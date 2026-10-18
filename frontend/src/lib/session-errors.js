// Cuándo una respuesta de la API significa "tu sesión ya no sirve" y hay que cerrarla.
// Solo el 401 con código UNAUTHENTICATED (token inválido o vencido). Cualquier otro 401, un 403 o un 500
// son fallos del servidor o de permisos: se muestran como error, pero no sacan al usuario de su sesión.
export function shouldSignOut(status, code) {
  return status === 401 && code === 'UNAUTHENTICATED';
}
