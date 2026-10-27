import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@2";

function respuestaError(mensaje: string, status = 400) {
  return Response.json(
    {
      success: false,
      error: mensaje,
    },
    { status },
  );
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      if (req.method !== "POST") {
        return respuestaError("Método no permitido.", 405);
      }

      // Identidad verificada con el mismo mecanismo de admin-create-attendant.
      const adminId = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;

      if (!adminId) {
        return respuestaError(
          "La sesión no está autenticada o no se pudo identificar al administrador.",
          401,
        );
      }

      const {
        data: perfilAdmin,
        error: perfilAdminError,
      } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, rol, es_admin_principal")
        .eq("id", adminId)
        .maybeSingle();

      if (perfilAdminError) {
        console.error("Error consultando perfil administrador.");
        return respuestaError(
          "No se pudo verificar el perfil del administrador.",
          500,
        );
      }

      if (
        !perfilAdmin ||
        perfilAdmin.rol !== "administrador" ||
        perfilAdmin.es_admin_principal !== true
      ) {
        return respuestaError(
          "Solo el administrador principal está autorizado para restablecer contraseñas de encargados.",
          403,
        );
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return respuestaError("El cuerpo de la solicitud no es JSON válido.");
      }

      const usuarioId =
        typeof body === "object" && body !== null && "usuario_id" in body
          ? body.usuario_id
          : undefined;
      const passwordTemporal =
        typeof body === "object" && body !== null &&
          "password_temporal" in body
          ? body.password_temporal
          : undefined;
      const passwordAdmin =
        typeof body === "object" && body !== null &&
          "password_admin" in body
          ? body.password_admin
          : undefined;

      if (typeof passwordAdmin !== "string" || passwordAdmin.length === 0) {
        return respuestaError("Ingresa la contraseña actual del administrador.");
      }

      // Obtiene el correo desde Auth usando el ID autenticado, no desde el body.
      const {
        data: usuarioAdminAuth,
        error: usuarioAdminAuthError,
      } = await ctx.supabaseAdmin.auth.admin.getUserById(adminId);

      if (usuarioAdminAuthError || !usuarioAdminAuth.user?.email) {
        console.error("No se pudo obtener el correo del administrador autenticado.");
        return respuestaError(
          "No se pudo verificar la cuenta del administrador.",
          500,
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const publishableKeysEnv = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");

      if (!supabaseUrl || !publishableKeysEnv) {
        console.error("Falta la configuración pública de Supabase para Auth.");
        return respuestaError(
          "No se pudo verificar la contraseña actual del administrador.",
          500,
        );
      }

      let publishableKey: string | undefined;
      try {
        const publishableKeys = JSON.parse(publishableKeysEnv) as Record<
          string,
          string
        >;
        publishableKey = publishableKeys.default;
      } catch {
        console.error("La configuración pública de Supabase no es válida.");
        return respuestaError(
          "No se pudo verificar la contraseña actual del administrador.",
          500,
        );
      }

      if (!publishableKey) {
        console.error("No se encontró la clave pública predeterminada de Supabase.");
        return respuestaError(
          "No se pudo verificar la contraseña actual del administrador.",
          500,
        );
      }

      // Cliente independiente: la sesión de signInWithPassword no persiste ni
      // altera la identidad administrativa validada por withSupabase.
      const supabaseAuthVerifier = createClient(supabaseUrl, publishableKey, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      });

      const { error: verificarPasswordAdminError } =
        await supabaseAuthVerifier.auth.signInWithPassword({
          email: usuarioAdminAuth.user.email,
          password: passwordAdmin,
        });

      if (verificarPasswordAdminError) {
        if (verificarPasswordAdminError.code === "invalid_credentials") {
          return respuestaError(
            "La contraseña actual del administrador es incorrecta.",
            401,
          );
        }

        console.error("No se pudo verificar la contraseña actual en Supabase Auth.");
        return respuestaError(
          "No se pudo verificar la contraseña actual del administrador.",
          500,
        );
      }

      if (
        typeof usuarioId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          usuarioId,
        )
      ) {
        return respuestaError("El ID del usuario objetivo no es válido.");
      }

      if (typeof passwordTemporal !== "string" || passwordTemporal.length < 8) {
        return respuestaError(
          "La contraseña temporal debe tener al menos 8 caracteres.",
        );
      }

      if (usuarioId === adminId) {
        return respuestaError(
          "No puedes restablecer la contraseña de tu propia cuenta.",
          403,
        );
      }

      const {
        data: usuarioAuth,
        error: usuarioAuthError,
      } = await ctx.supabaseAdmin.auth.admin.getUserById(usuarioId);

      if (usuarioAuthError) {
        console.error("Error consultando usuario objetivo en Auth.");
        return respuestaError(
          "No se pudo verificar la existencia del usuario objetivo.",
          500,
        );
      }

      if (!usuarioAuth.user) {
        return respuestaError("El usuario objetivo no existe.", 404);
      }

      const {
        data: perfilObjetivo,
        error: perfilObjetivoError,
      } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, rol")
        .eq("id", usuarioId)
        .maybeSingle();

      if (perfilObjetivoError) {
        console.error("Error consultando perfil del usuario objetivo.");
        return respuestaError(
          "No se pudo verificar el perfil del usuario objetivo.",
          500,
        );
      }

      if (!perfilObjetivo) {
        return respuestaError("El usuario objetivo no existe.", 404);
      }

      if (perfilObjetivo.rol !== "encargado") {
        return respuestaError(
          "El usuario objetivo no tiene el rol de encargado.",
          403,
        );
      }

      const { error: actualizarAuthError } =
        await ctx.supabaseAdmin.auth.admin.updateUserById(usuarioId, {
          password: passwordTemporal,
        });

      if (actualizarAuthError) {
        console.error("Error actualizando contraseña en Auth.");
        return respuestaError(
          "No se pudo actualizar la contraseña del encargado en Auth.",
          500,
        );
      }

      const {
        data: perfilActualizado,
        error: actualizarPerfilError,
      } = await ctx.supabaseAdmin
        .from("profiles")
        .update({
          requiere_cambio_password: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usuarioId)
        .eq("rol", "encargado")
        .select("id")
        .maybeSingle();

      if (actualizarPerfilError || !perfilActualizado) {
        console.error("Error actualizando perfil del encargado.");
        return respuestaError(
          "La contraseña se actualizó, pero no se pudo actualizar el perfil del encargado.",
          500,
        );
      }

      return Response.json({
        success: true,
        message: "La contraseña del encargado fue restablecida correctamente.",
      });
    } catch {
      console.error("Error inesperado en admin-reset-attendant-password.");
      return respuestaError(
        "Ocurrió un error inesperado al restablecer la contraseña del encargado.",
        500,
      );
    }
  }),
};
