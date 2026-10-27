import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const EMAIL_DOMAIN = "@ecocanje.pe";

function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function respuestaError(
  mensaje: string,
  status = 400,
) {
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
      // =========================================
      // SOLO SE PERMITE POST
      // =========================================

      if (req.method !== "POST") {
        return respuestaError(
          "Método no permitido.",
          405,
        );
      }

      // =========================================
      // IDENTIFICAR AL USUARIO AUTENTICADO
      // =========================================
      //
      // ctx.userClaims contiene la identidad verificada
      // del usuario autenticado.
      //
      // ctx.jwtClaims contiene los claims completos
      // del JWT, incluyendo "sub".
      //

      const adminId =
        ctx.userClaims?.id ??
        ctx.jwtClaims?.sub;

      if (!adminId) {
        return respuestaError(
          "No se pudo identificar al administrador.",
          401,
        );
      }

      // =========================================
      // VERIFICAR QUE SEA ADMINISTRADOR
      // =========================================

      const {
        data: perfilAdmin,
        error: perfilError,
      } = await ctx.supabaseAdmin
        .from("profiles")
        .select(
          "id, rol, es_admin_principal"
        )
        .eq("id", adminId)
        .maybeSingle();

      if (perfilError) {
        console.error(
          "Error consultando perfil administrador:",
          perfilError,
        );

        return respuestaError(
          "No se pudo verificar el perfil del administrador.",
          500,
        );
      }

      if (
        !perfilAdmin ||
        perfilAdmin.rol !== "administrador"
      ) {
        return respuestaError(
          "No tienes permisos para crear cuentas de encargado.",
          403,
        );
      }

      // =========================================
      // LEER DATOS DEL PANEL ADMINISTRATIVO
      // =========================================

      const body = await req.json();

      const puntoAcopioId = Number(
        body?.punto_acopio_id
      );

      const passwordTemporal = String(
        body?.password_temporal ?? ""
      ).trim();

      // =========================================
      // VALIDAR PUNTO DE ACOPIO
      // =========================================

      if (
        !Number.isInteger(puntoAcopioId) ||
        puntoAcopioId <= 0
      ) {
        return respuestaError(
          "El punto de acopio seleccionado no es válido.",
        );
      }

      // =========================================
      // VALIDAR CONTRASEÑA TEMPORAL
      // =========================================

      if (!passwordTemporal) {
        return respuestaError(
          "La contraseña temporal es obligatoria.",
        );
      }

      if (passwordTemporal.length < 8) {
        return respuestaError(
          "La contraseña temporal debe tener al menos 8 caracteres.",
        );
      }

      // =========================================
      // BUSCAR PUNTO DE ACOPIO
      // =========================================

      const {
        data: punto,
        error: puntoError,
      } = await ctx.supabaseAdmin
        .from("collection_points")
        .select(
          "id, nombre, estado"
        )
        .eq("id", puntoAcopioId)
        .maybeSingle();

      if (puntoError) {
        console.error(
          "Error consultando punto de acopio:",
          puntoError,
        );

        return respuestaError(
          "No se pudo consultar el punto de acopio.",
          500,
        );
      }

      if (!punto) {
        return respuestaError(
          "El punto de acopio seleccionado no existe.",
          404,
        );
      }

      // Solo se permiten cuentas para puntos activos.
      if (punto.estado !== "activo") {
        return respuestaError(
          "El punto de acopio seleccionado no está activo.",
        );
      }

      // =========================================
      // COMPROBAR ENCARGADO ACTIVO
      // =========================================

      const {
        data: asignacionExistente,
        error: asignacionError,
      } = await ctx.supabaseAdmin
        .from("attendant_collection_points")
        .select(
          "id, encargado_id"
        )
        .eq(
          "punto_acopio_id",
          puntoAcopioId
        )
        .eq(
          "estado",
          "activo"
        )
        .maybeSingle();

      if (asignacionError) {
        console.error(
          "Error consultando asignación del punto:",
          asignacionError,
        );

        return respuestaError(
          "No se pudo comprobar si el punto ya tiene encargado.",
          500,
        );
      }

      if (asignacionExistente) {
        return respuestaError(
          "Este punto de acopio ya tiene un encargado activo.",
          409,
        );
      }

      // =========================================
      // GENERAR CORREO INSTITUCIONAL
      // =========================================

      const nombreNormalizado =
        normalizarNombre(
          punto.nombre
        );

      if (!nombreNormalizado) {
        return respuestaError(
          "El punto de acopio no tiene un nombre válido para generar el correo.",
        );
      }

      const email =
        `encargado${nombreNormalizado}${EMAIL_DOMAIN}`;

      // =========================================
      // CREAR CUENTA EN SUPABASE AUTH
      // =========================================

      const {
        data: usuarioCreado,
        error: crearUsuarioError,
      } =
        await ctx.supabaseAdmin.auth.admin.createUser({
          email,
          password: passwordTemporal,
          email_confirm: true,
        });

      if (
        crearUsuarioError ||
        !usuarioCreado.user
      ) {
        console.error(
          "Error creando usuario Auth:",
          crearUsuarioError,
        );

        const mensajeError =
          crearUsuarioError?.message?.toLowerCase() ||
          "";

        if (
          mensajeError.includes("already") ||
          mensajeError.includes("exists") ||
          mensajeError.includes("duplicate")
        ) {
          return respuestaError(
            `El correo ${email} ya está registrado en EcoCanje.`,
            409,
          );
        }

        return respuestaError(
          crearUsuarioError?.message ||
            "No se pudo crear la cuenta del encargado.",
          500,
        );
      }

      const encargadoId =
        usuarioCreado.user.id;

      // =========================================
      // CONFIGURAR PERFIL Y ASIGNAR PUNTO
      // =========================================

      try {
        // El trigger de creación de usuario ya creó
        // el registro correspondiente en profiles.
        //
        // Aquí establecemos el rol y obligamos
        // al cambio de contraseña en el primer acceso.

        const {
          error: actualizarPerfilError,
        } = await ctx.supabaseAdmin
          .from("profiles")
          .update({
            rol: "encargado",
            requiere_cambio_password: true,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            encargadoId
          );

        if (actualizarPerfilError) {
          throw new Error(
            `No se pudo configurar el perfil: ${actualizarPerfilError.message}`,
          );
        }

        // =========================================
        // ASIGNAR PUNTO DE ACOPIO
        // =========================================

        const {
          error: asignarPuntoError,
        } = await ctx.supabaseAdmin
          .from(
            "attendant_collection_points"
          )
          .insert({
            encargado_id:
              encargadoId,
            punto_acopio_id:
              puntoAcopioId,
            estado: "activo",
          });

        if (asignarPuntoError) {
          throw new Error(
            `No se pudo asignar el punto de acopio: ${asignarPuntoError.message}`,
          );
        }
      } catch (
        configuracionError
      ) {
        console.error(
          "Error configurando encargado. Se intentará revertir la cuenta:",
          configuracionError,
        );

        // Si la configuración falla,
        // eliminamos la cuenta recién creada.
        await ctx.supabaseAdmin.auth.admin.deleteUser(
          encargadoId
        );

        throw configuracionError;
      }

      // =========================================
      // RESPUESTA EXITOSA
      // =========================================

      return Response.json({
        success: true,
        message:
          "Encargado creado correctamente.",
        encargado: {
          id: encargadoId,
          email,
          punto_acopio_id:
            puntoAcopioId,
          punto_acopio:
            punto.nombre,
          requiere_cambio_password:
            true,
        },
      });
    } catch (error) {
      console.error(
        "Error en admin-create-attendant:",
        error,
      );

      return respuestaError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al crear el encargado.",
        500,
      );
    }
  }),
};