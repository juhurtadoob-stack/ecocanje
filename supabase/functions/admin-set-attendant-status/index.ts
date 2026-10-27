import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@2";

const MARCADOR_DESACTIVACION = "ecocanje_attendant_disabled";
const MARCADOR_BAN = "ecocanje_attendant_banned_until";
const DURACION_BAN = "876000h";
type SupabaseAdminClient = ReturnType<typeof createClient>;
type AuthUser = {
  id: string;
  email?: string | null;
  banned_until?: string | null;
  app_metadata?: Record<string, unknown> | null;
};
type Assignment = {
  id: number | string;
  encargado_id: string;
  punto_acopio_id?: number | string;
  estado: string;
  created_at?: string;
};

function respuestaError(mensaje: string, status = 400) {
  return Response.json({ success: false, error: mensaje }, { status });
}

function respuestaParcial() {
  return respuestaError(
    "Se produjo un estado parcial y se requiere revisión administrativa.",
    500,
  );
}

function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(valor);
}

function metadataComoObjeto(metadata: unknown): Record<string, unknown> {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

function tieneBanActivo(usuario: AuthUser): boolean {
  if (!usuario.banned_until) return false;
  const fecha = Date.parse(usuario.banned_until);
  return !Number.isFinite(fecha) || fecha > Date.now();
}

function esErrorUnique(error: { code?: string; message?: string }): boolean {
  return error.code === "23505" ||
    error.message?.toLowerCase().includes("unique") === true;
}

async function obtenerUsuarioAuth(
  admin: SupabaseAdminClient,
  usuarioId: string,
): Promise<{ user: AuthUser | null; error: boolean }> {
  try {
    const { data, error } = await admin.auth.admin.getUserById(usuarioId);
    return { user: (data?.user as AuthUser | undefined) ?? null, error: Boolean(error) };
  } catch {
    return { user: null, error: true };
  }
}

async function obtenerAsignacion(
  admin: SupabaseAdminClient,
  usuarioId: string,
  estado: "activo" | "inactivo",
): Promise<{ row: Assignment | null; error: boolean }> {
  try {
    const { data, error } = await admin
      .from("attendant_collection_points")
      .select("id, encargado_id, punto_acopio_id, estado, created_at")
      .eq("encargado_id", usuarioId)
      .eq("estado", estado)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { row: (data as Assignment | null) ?? null, error: Boolean(error) };
  } catch {
    return { row: null, error: true };
  }
}

async function obtenerAsignacionPorId(
  admin: SupabaseAdminClient,
  id: number | string,
): Promise<{ row: Assignment | null; error: boolean }> {
  try {
    const { data, error } = await admin
      .from("attendant_collection_points")
      .select("id, encargado_id, punto_acopio_id, estado, created_at")
      .eq("id", id)
      .maybeSingle();
    return { row: (data as Assignment | null) ?? null, error: Boolean(error) };
  } catch {
    return { row: null, error: true };
  }
}

async function actualizarEstadoAsignacion(
  admin: SupabaseAdminClient,
  asignacion: Assignment,
  desde: "activo" | "inactivo",
  hacia: "activo" | "inactivo",
): Promise<{
  updated: boolean;
  noMatch: boolean;
  error: { code?: string; message?: string } | null;
  verifiedState: string | null;
  verificationError: boolean;
}> {
  let data: { id: number | string } | null = null;
  let error: { code?: string; message?: string } | null = null;

  try {
    const result = await admin
      .from("attendant_collection_points")
      .update({ estado: hacia })
      .eq("id", asignacion.id)
      .eq("encargado_id", asignacion.encargado_id)
      .eq("estado", desde)
      .select("id")
      .maybeSingle();
    data = (result.data as { id: number | string } | null) ?? null;
    error = result.error
      ? { code: result.error.code, message: result.error.message }
      : null;
  } catch (errorOriginal) {
    const errorComoObjeto = typeof errorOriginal === "object" && errorOriginal !== null
      ? errorOriginal as { code?: string; message?: string }
      : null;
    error = {
      code: errorComoObjeto?.code,
      message: errorComoObjeto?.message || String(errorOriginal),
    };
  }

  // Confirmar el estado real incluso si PostgREST devolvió error o la respuesta
  // pudo perderse después de aplicar el UPDATE.
  const actual = await obtenerAsignacionPorId(admin, asignacion.id);
  return {
    updated: Boolean(data),
    noMatch: !error && !data,
    error,
    verifiedState: actual.row?.estado ?? null,
    verificationError: actual.error,
  };
}

function respuestaErrorActualizacionAsignacion(
  asignacion: Assignment,
  resultado: Awaited<ReturnType<typeof actualizarEstadoAsignacion>>,
) {
  const detalle = resultado.error?.message || (
    resultado.noMatch
      ? "El UPDATE no encontró filas que coincidieran con id, encargado_id y estado."
      : resultado.updated
        ? "PostgREST devolvió una fila, pero la lectura no confirmó el estado solicitado."
        : "El UPDATE no pudo confirmarse con la respuesta recibida."
  );
  const estado = resultado.verificationError
    ? "no disponible (falló la lectura de verificación)"
    : resultado.verifiedState ?? "fila inexistente";

  return Response.json({
    success: false,
    error: "No se confirmó la desactivación de la asignación. La función conservó el estado de Auth sin intentar desbloquearlo; se requiere revisión administrativa.",
    diagnostico: {
      asignacion_id: asignacion.id,
      encargado_id: asignacion.encargado_id,
      estado_verificado: estado,
      codigo_error: resultado.error?.code ?? null,
      detalle_error: detalle,
      update_devolvio_fila: resultado.updated,
      fallo_lectura_verificacion: resultado.verificationError,
    },
  }, { status: 500 });
}

async function actualizarAuth(
  admin: SupabaseAdminClient,
  usuarioId: string,
  patch: Record<string, unknown>,
): Promise<{ user: AuthUser | null; error: boolean }> {
  try {
    const { data, error } = await admin.auth.admin.updateUserById(
      usuarioId,
      patch as Parameters<typeof admin.auth.admin.updateUserById>[1],
    );
    if (!error && data?.user) {
      return { user: data.user as AuthUser, error: false };
    }
  } catch {
    // Se relee Auth antes de decidir si hace falta compensar.
  }
  return obtenerUsuarioAuth(admin, usuarioId);
}

function metadataTieneBanEcoCanje(usuario: AuthUser): boolean {
  const metadata = metadataComoObjeto(usuario.app_metadata);
  return metadata[MARCADOR_DESACTIVACION] === true &&
    typeof metadata[MARCADOR_BAN] === "string" &&
    metadata[MARCADOR_BAN] === usuario.banned_until &&
    tieneBanActivo(usuario);
}

async function verificarPasswordAdministrador(
  admin: SupabaseAdminClient,
  adminId: string,
  passwordAdmin: string,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const { user: usuarioAdmin, error: authError } = await obtenerUsuarioAuth(admin, adminId);
  if (authError || !usuarioAdmin?.email) {
    console.error("No se pudo obtener el correo del administrador autenticado.");
    return { ok: false, response: respuestaError("No se pudo verificar la cuenta del administrador.", 500) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKeysEnv = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!supabaseUrl || !publishableKeysEnv) {
    console.error("Falta configuración pública de Supabase para Auth.");
    return { ok: false, response: respuestaError("No se pudo verificar la contraseña actual del administrador.", 500) };
  }

  let publishableKey: string | undefined;
  try {
    publishableKey = (JSON.parse(publishableKeysEnv) as Record<string, string>).default;
  } catch {
    console.error("La configuración pública de Supabase no es válida.");
    return { ok: false, response: respuestaError("No se pudo verificar la contraseña actual del administrador.", 500) };
  }
  if (!publishableKey) {
    console.error("No se encontró la clave pública predeterminada de Supabase.");
    return { ok: false, response: respuestaError("No se pudo verificar la contraseña actual del administrador.", 500) };
  }

  try {
    const verifier = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await verifier.auth.signInWithPassword({
      email: usuarioAdmin.email,
      password: passwordAdmin,
    });
    if (error?.code === "invalid_credentials") {
      return { ok: false, response: respuestaError("La contraseña del administrador es incorrecta.", 401) };
    }
    if (error) {
      console.error("No se pudo verificar la contraseña actual en Supabase Auth.");
      return { ok: false, response: respuestaError("No se pudo verificar la contraseña actual del administrador.", 500) };
    }
    return { ok: true };
  } catch {
    console.error("Error de red al verificar la contraseña del administrador.");
    return { ok: false, response: respuestaError("No se pudo verificar la contraseña actual del administrador.", 500) };
  }
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      if (req.method !== "POST") return respuestaError("Método no permitido.", 405);

      const adminId = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
      if (!adminId) return respuestaError("La sesión no está autenticada.", 401);

      const { data: perfilAdmin, error: perfilAdminError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, rol, es_admin_principal")
        .eq("id", adminId)
        .maybeSingle();
      if (perfilAdminError) {
        console.error("Error consultando perfil administrador.");
        return respuestaError("No se pudo verificar el perfil del administrador.", 500);
      }
      if (!perfilAdmin || perfilAdmin.rol !== "administrador" || perfilAdmin.es_admin_principal !== true) {
        return respuestaError("No tienes permisos para realizar esta operación.", 403);
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return respuestaError("El cuerpo de la solicitud no es JSON válido.");
      }
      const usuarioId = typeof body === "object" && body !== null && "usuario_id" in body
        ? body.usuario_id : undefined;
      const accion = typeof body === "object" && body !== null && "accion" in body
        ? body.accion : undefined;
      const passwordAdmin = typeof body === "object" && body !== null && "password_admin" in body
        ? body.password_admin : undefined;

      if (!esUuid(usuarioId)) return respuestaError("El ID del usuario objetivo no es válido.");
      if (usuarioId === adminId) {
        return respuestaError("No puedes realizar esta operación sobre tu propia cuenta.", 403);
      }
      if (accion !== "desactivar" && accion !== "reactivar") {
        return respuestaError("La acción debe ser desactivar o reactivar.");
      }
      if (typeof passwordAdmin !== "string" || passwordAdmin.length === 0) {
        return respuestaError("Ingresa la contraseña actual del administrador.");
      }

      // La identidad objetivo no se consulta hasta que Auth valide la contraseña administrativa.
      const verificacion = await verificarPasswordAdministrador(
        ctx.supabaseAdmin,
        adminId,
        passwordAdmin,
      );
      if (!verificacion.ok) return verificacion.response;

      const { user: usuarioObjetivo, error: objetivoAuthError } = await obtenerUsuarioAuth(
        ctx.supabaseAdmin,
        usuarioId,
      );
      if (objetivoAuthError) {
        console.error("Error consultando usuario objetivo en Auth.");
        return respuestaError("No se pudo verificar la existencia del usuario objetivo.", 500);
      }
      if (!usuarioObjetivo) return respuestaError("El usuario objetivo no existe.", 404);

      const { data: perfilObjetivo, error: perfilObjetivoError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("id, rol")
        .eq("id", usuarioId)
        .maybeSingle();
      if (perfilObjetivoError) {
        console.error("Error consultando perfil del usuario objetivo.");
        return respuestaError("No se pudo verificar el perfil del usuario objetivo.", 500);
      }
      if (!perfilObjetivo) return respuestaError("El usuario objetivo no existe.", 404);
      if (perfilObjetivo.rol !== "encargado") {
        return respuestaError("Esta operación solo está disponible para cuentas de encargado.", 400);
      }

      return accion === "desactivar"
        ? await desactivarEncargado(ctx.supabaseAdmin, usuarioId)
        : await reactivarEncargado(ctx.supabaseAdmin, usuarioId);
    } catch {
      console.error("Error inesperado en admin-set-attendant-status.");
      return respuestaError("Ocurrió un error inesperado al actualizar el estado del encargado.", 500);
    }
  }),
};

async function desactivarEncargado(admin: SupabaseAdminClient, usuarioId: string) {
  const authAntes = await obtenerUsuarioAuth(admin, usuarioId);
  if (authAntes.error || !authAntes.user) {
    return respuestaError("No se pudo verificar la cuenta en Auth.", 500);
  }
  const metadataAntes = metadataComoObjeto(authAntes.user.app_metadata);
  const marcado = metadataAntes[MARCADOR_DESACTIVACION] === true;

  if (tieneBanActivo(authAntes.user)) {
    if (!marcado) {
      return respuestaError("La cuenta ya está bloqueada por otra causa y no puede ser desactivada desde EcoCanje.", 409);
    }
    const bannedUntilMarcado = metadataAntes[MARCADOR_BAN];
    if (
      bannedUntilMarcado !== null &&
      bannedUntilMarcado !== undefined &&
      bannedUntilMarcado !== authAntes.user.banned_until
    ) {
      return respuestaError("El bloqueo actual de la cuenta no coincide con el bloqueo creado por EcoCanje. Se requiere revisión administrativa.", 409);
    }
  } else if (marcado) {
    return respuestaError("El estado de Auth no coincide con la desactivación registrada por EcoCanje. Se requiere revisión administrativa.", 409);
  }

  const asignacionActiva = await obtenerAsignacion(admin, usuarioId, "activo");
  if (asignacionActiva.error) {
    return respuestaError("No se pudo consultar la asignación del encargado.", 500);
  }

  if (
    marcado &&
    metadataTieneBanEcoCanje(authAntes.user) &&
    !asignacionActiva.row
  ) {
    const historica = await obtenerAsignacion(admin, usuarioId, "inactivo");
    if (!historica.error && historica.row) {
      const authIdempotente = await obtenerUsuarioAuth(admin, usuarioId);
      if (
        authIdempotente.error || !authIdempotente.user ||
        !metadataTieneBanEcoCanje(authIdempotente.user)
      ) {
        return respuestaError(
          "No se pudo confirmar el estado bloqueado de Auth junto con la asignación inactiva. Se requiere revisión administrativa.",
          500,
        );
      }
      return Response.json({ success: true, accion: "desactivar", message: "El encargado ya estaba desactivado." });
    }
  }

  // La consulta de asignación pudo tomar tiempo; refrescar Auth y metadata justo
  // antes del cambio para no fusionar sobre una copia antigua.
  const authInmediatamenteAntes = await obtenerUsuarioAuth(admin, usuarioId);
  if (authInmediatamenteAntes.error || !authInmediatamenteAntes.user) {
    return respuestaError("No se pudo volver a verificar la cuenta en Auth.", 500);
  }
  const metadataInmediatamenteAntes = metadataComoObjeto(
    authInmediatamenteAntes.user.app_metadata,
  );
  const marcadoInmediatamenteAntes =
    metadataInmediatamenteAntes[MARCADOR_DESACTIVACION] === true;
  if (tieneBanActivo(authInmediatamenteAntes.user)) {
    const bannedUntilMarcado = metadataInmediatamenteAntes[MARCADOR_BAN];
    if (
      !marcadoInmediatamenteAntes ||
      (bannedUntilMarcado !== null &&
        bannedUntilMarcado !== undefined &&
        bannedUntilMarcado !== authInmediatamenteAntes.user.banned_until)
    ) {
      return respuestaError(
        "La cuenta ya está bloqueada por otra causa o requiere revisión administrativa.",
        409,
      );
    }
  } else if (marcadoInmediatamenteAntes) {
    return respuestaError(
      "El estado de Auth no coincide con la desactivación registrada por EcoCanje. Se requiere revisión administrativa.",
      409,
    );
  }

  const tieneBanMarcado =
    metadataInmediatamenteAntes[MARCADOR_BAN] !== null &&
    metadataInmediatamenteAntes[MARCADOR_BAN] !== undefined;
  const debeAplicarBan = !tieneBanActivo(authInmediatamenteAntes.user) ||
    (marcadoInmediatamenteAntes && !tieneBanMarcado);

  if (debeAplicarBan) {
    const metadataNueva = {
      ...metadataInmediatamenteAntes,
      [MARCADOR_DESACTIVACION]: true,
    };
    await actualizarAuth(admin, usuarioId, {
      ban_duration: DURACION_BAN,
      app_metadata: metadataNueva,
    });
  }

  // updateUserById puede omitir banned_until en data.user. Esta lectura fresca
  // de Auth es la única fuente de verdad para obtener y validar el valor.
  const authActualizado = await obtenerUsuarioAuth(admin, usuarioId);
  if (authActualizado.error || !authActualizado.user) {
    return respuestaError(
      "Auth pudo quedar bloqueado, pero no se pudo volver a leer la cuenta. La asignación no se modificó y el bloqueo se conservó; se requiere revisión administrativa.",
      500,
    );
  }

  if (
    !tieneBanActivo(authActualizado.user) ||
    metadataComoObjeto(authActualizado.user.app_metadata)[MARCADOR_DESACTIVACION] !== true
  ) {
    return respuestaError(
      "No se pudo confirmar el bloqueo de Auth y su marcador. La asignación no se modificó y no se intentó desbloquear la cuenta.",
      500,
    );
  }

  const bannedUntil = authActualizado.user.banned_until;
  if (!bannedUntil) {
    return respuestaError(
      "Auth está bloqueado, pero no se pudo confirmar banned_until. La asignación no se modificó y el bloqueo se conservó; se requiere revisión administrativa.",
      500,
    );
  }

  const metadataConFecha = {
    ...metadataComoObjeto(authActualizado.user.app_metadata),
    [MARCADOR_DESACTIVACION]: true,
    [MARCADOR_BAN]: bannedUntil,
  };
  await actualizarAuth(admin, usuarioId, { app_metadata: metadataConFecha });

  const authConFecha = await obtenerUsuarioAuth(admin, usuarioId);
  if (authConFecha.error || !authConFecha.user) {
    return respuestaError(
      "Auth está bloqueado, pero no se pudo confirmar el marcador banned_until. La asignación no se modificó y el bloqueo se conservó; se requiere revisión administrativa.",
      500,
    );
  }
  const metadataFinal = metadataComoObjeto(authConFecha.user.app_metadata);
  const timestampRegistrado = authConFecha.user.banned_until === bannedUntil &&
    metadataFinal[MARCADOR_DESACTIVACION] === true &&
    metadataFinal[MARCADOR_BAN] === bannedUntil &&
    tieneBanActivo(authConFecha.user);
  if (!timestampRegistrado) {
    return respuestaError(
      "Auth está bloqueado, pero no se pudo guardar o confirmar ecocanje_attendant_banned_until. La asignación no se modificó y el bloqueo se conservó; se requiere revisión administrativa.",
      500,
    );
  }

  if (!asignacionActiva.row) {
    return respuestaError(
      "Auth quedó bloqueado y su marcador fue confirmado, pero no se encontró una asignación activa para confirmar como inactiva. Se requiere revisión administrativa.",
      500,
    );
  }

  const cambio = await actualizarEstadoAsignacion(
    admin,
    asignacionActiva.row,
    "activo",
    "inactivo",
  );
  const authReal = await obtenerUsuarioAuth(admin, usuarioId);
  if (authReal.error || !authReal.user) return respuestaParcial();
  const authBanExacto = metadataTieneBanEcoCanje(authReal.user) &&
    metadataComoObjeto(authReal.user.app_metadata)[MARCADOR_BAN] === bannedUntil;

  if (
    !cambio.error && !cambio.verificationError &&
    cambio.verifiedState === "inactivo" && authBanExacto
  ) {
    return Response.json({
      success: true,
      accion: "desactivar",
      message: cambio.updated
        ? "El encargado fue desactivado correctamente."
        : "El encargado ya estaba desactivado.",
    });
  }

  return respuestaErrorActualizacionAsignacion(asignacionActiva.row, cambio);
}

async function reactivarEncargado(admin: SupabaseAdminClient, usuarioId: string) {
  const authInicial = await obtenerUsuarioAuth(admin, usuarioId);
  if (authInicial.error || !authInicial.user) return respuestaError("No se pudo verificar la cuenta en Auth.", 500);

  const metadataInicial = metadataComoObjeto(authInicial.user.app_metadata);
  if (metadataInicial[MARCADOR_DESACTIVACION] !== true) {
    return respuestaError("La cuenta no fue desactivada por EcoCanje y no puede reactivarse desde esta opción.", 409);
  }
  if (!metadataTieneBanEcoCanje(authInicial.user)) {
    return respuestaError("El bloqueo actual de la cuenta no coincide con el bloqueo creado por EcoCanje. Se requiere revisión administrativa.", 409);
  }
  const bannedUntil = authInicial.user.banned_until!;

  const historica = await obtenerAsignacion(admin, usuarioId, "inactivo");
  if (historica.error) return respuestaError("No se pudo consultar la asignación histórica del encargado.", 500);
  let asignacion = historica.row;
  if (!asignacion) {
    // Permite resolver una reactivación concurrente cuyo primer request ya activó la fila.
    const activa = await obtenerAsignacion(admin, usuarioId, "activo");
    if (activa.error || !activa.row) {
      return respuestaError("El encargado no tiene una asignación histórica que pueda recuperarse.", 409);
    }
    asignacion = activa.row;
  }

  const { data: punto, error: puntoError } = await admin
    .from("collection_points")
    .select("id, estado")
    .eq("id", asignacion.punto_acopio_id)
    .maybeSingle();
  if (puntoError) return respuestaError("No se pudo comprobar la disponibilidad del punto de acopio.", 500);
  if (!punto || punto.estado !== "activo") {
    return respuestaError("El punto de acopio de la asignación histórica no existe o no está activo.", 409);
  }

  const { data: ocupante, error: ocupanteError } = await admin
    .from("attendant_collection_points")
    .select("id")
    .eq("punto_acopio_id", asignacion.punto_acopio_id)
    .eq("estado", "activo")
    .neq("encargado_id", usuarioId)
    .maybeSingle();
  if (ocupanteError) return respuestaError("No se pudo comprobar si el punto de acopio está ocupado.", 500);
  if (ocupante) return respuestaError("El punto de acopio ya está asignado a otro encargado.", 409);

  if (asignacion.estado === "inactivo") {
    const activacion = await actualizarEstadoAsignacion(admin, asignacion, "inactivo", "activo");
    const fila = await obtenerAsignacionPorId(admin, asignacion.id);
    if (activacion.error && esErrorUnique(activacion.error)) {
      return respuestaError("El punto de acopio ya fue asignado a otro encargado.", 409);
    }
    if (fila.error || !fila.row) return respuestaParcial();
    if (fila.row.estado !== "activo") {
      if (!activacion.error) return respuestaError("La asignación histórica cambió durante la reactivación. No se retiró el bloqueo.", 409);
      return respuestaError("No se pudo reactivar la asignación histórica.", 500);
    }
  }

  // Releer Auth justo antes de quitar el ban para detectar un bloqueo externo.
  const authAntesDeUnban = await obtenerUsuarioAuth(admin, usuarioId);
  if (authAntesDeUnban.error || !authAntesDeUnban.user) {
    await compensarReactivacion(admin, usuarioId, asignacion, bannedUntil);
    return respuestaParcial();
  }
  if (!metadataTieneBanEcoCanje(authAntesDeUnban.user) ||
    metadataComoObjeto(authAntesDeUnban.user.app_metadata)[MARCADOR_BAN] !== bannedUntil) {
    const compensacion = await compensarReactivacion(admin, usuarioId, asignacion, bannedUntil);
    return compensacion
      ? respuestaError("El bloqueo actual cambió durante la operación. Se requiere revisión administrativa.", 409)
      : respuestaParcial();
  }

  const metadataReactivada = {
    ...metadataComoObjeto(authAntesDeUnban.user.app_metadata),
    [MARCADOR_DESACTIVACION]: false,
    [MARCADOR_BAN]: null,
  };
  await actualizarAuth(admin, usuarioId, { ban_duration: "none", app_metadata: metadataReactivada });

  const authFinal = await obtenerUsuarioAuth(admin, usuarioId);
  const asignacionFinal = await obtenerAsignacionPorId(admin, asignacion.id);
  if (authFinal.error || asignacionFinal.error || !authFinal.user || !asignacionFinal.row) {
    return respuestaParcial();
  }
  const metadataFinal = metadataComoObjeto(authFinal.user.app_metadata);
  const bannedUntilPresente = Object.prototype.hasOwnProperty.call(
    authFinal.user,
    "banned_until",
  );
  const marcadorBanLimpio = metadataFinal[MARCADOR_BAN] === null ||
    metadataFinal[MARCADOR_BAN] === undefined;
  const bannedUntilSinBan = !bannedUntilPresente ||
    authFinal.user.banned_until === null;
  const cuentaLiberada = bannedUntilSinBan &&
    metadataFinal[MARCADOR_DESACTIVACION] === false &&
    marcadorBanLimpio;
  if (cuentaLiberada && asignacionFinal.row.estado === "activo") {
    return Response.json({ success: true, accion: "reactivar", message: "El encargado fue reactivado correctamente." });
  }

  if (metadataTieneBanEcoCanje(authFinal.user) && asignacionFinal.row.estado === "activo") {
    const compensado = await compensarReactivacion(admin, usuarioId, asignacion, bannedUntil);
    return compensado
      ? respuestaError("No se pudo desbloquear la cuenta. La asignación quedó inactiva.", 500)
      : respuestaParcial();
  }
  return Response.json({
    success: false,
    error: "Se produjo un estado parcial y se requiere revisiÃ³n administrativa.",
    diagnostico: {
      lectura_auth_completa: bannedUntilPresente,
      auth_sin_ban_activo: !tieneBanActivo(authFinal.user),
      marcador_desactivacion_confirmado: metadataFinal[MARCADOR_DESACTIVACION] === false,
      marcador_ban_limpio: marcadorBanLimpio,
      asignacion_activa: asignacionFinal.row.estado === "activo",
    },
  }, { status: 500 });
}

async function compensarReactivacion(
  admin: SupabaseAdminClient,
  usuarioId: string,
  asignacion: Assignment,
  bannedUntil: string,
): Promise<boolean> {
  const authActual = await obtenerUsuarioAuth(admin, usuarioId);
  if (authActual.error || !authActual.user) return false;
  if (tieneBanActivo(authActual.user) &&
    metadataComoObjeto(authActual.user.app_metadata)[MARCADOR_BAN] === bannedUntil) {
    const estado = await obtenerAsignacionPorId(admin, asignacion.id);
    if (estado.error || !estado.row) return false;
    if (estado.row.estado === "inactivo") return true;
    const cambio = await actualizarEstadoAsignacion(admin, estado.row, "activo", "inactivo");
    const final = await obtenerAsignacionPorId(admin, asignacion.id);
    return !final.error && final.row?.estado === "inactivo" && (!cambio.error || !cambio.updated);
  }
  return false;
}
