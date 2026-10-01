# Decisiones de arquitectura iniciales

**Sprint:** 0 · **Fecha:** 2026-09-30 · **Responsables:** Santiago y Felipe · **Estado:** Completado

## 1. Objetivo
Dejar registradas las decisiones técnicas tomadas antes de escribir código, con su justificación para la sustentación.

## 2. Qué se decidió

| Tema | Decisión | Antes (documento de grado) |
|---|---|---|
| Base de datos | Supabase (PostgreSQL en la nube) | MySQL 8.0 local |
| Autenticación | Supabase Auth + verificación del JWT en Express | JWT + bcrypt propios |
| Despliegue | Solo local; pruebas con celulares por la Wi-Fi | Solo local |
| Control de cupos | Funciones SQL atómicas con bloqueo de fila | Sin definir |
| Tiempo real | Supabase Realtime (solo lectura) | Sin definir |
| Correo | Nodemailer (SMTP Gmail) + node-cron | Firebase / OneSignal / cron |

## 3. Decisiones técnicas

**Supabase en lugar de MySQL.** *Problema:* dos desarrolladores necesitan la misma base sin instalar ni
sincronizar servidores locales. *Opciones:* MySQL local en cada equipo, MySQL en Docker, Supabase.
*Decisión:* Supabase, aprobado por el director. *Por qué:* una sola base compartida, migraciones SQL
versionadas, y trae autenticación y tiempo real sin servicios adicionales.

**Supabase Auth en lugar de JWT propio.** *Problema:* registrar e iniciar sesión de forma segura.
*Opciones:* (a) implementar registro, hash con bcrypt y emisión de JWT en Express; (b) Supabase Auth.
*Decisión:* (b). *Por qué:* Supabase guarda las contraseñas con bcrypt y emite JWT firmados, que es
exactamente lo que pide RNF-02, y evita escribir y probar código de seguridad desde cero. Express sigue
siendo quien autoriza: verifica el token en cada petición y lee el rol desde `profiles`, no desde el
token, porque el usuario podría modificar sus metadatos.

**Cupos con función SQL atómica.** *Problema:* si dos personas confirman el último cupo al mismo tiempo,
una verificación "leer cupos y luego insertar" en Node permite sobrecupo. *Decisión:* la función
`confirm_attendance` bloquea la fila del evento (`SELECT ... FOR UPDATE`) y hace la verificación y el
incremento en una sola transacción. *Evidencia:* prueba con 50 confirmaciones simultáneas sobre cupo 10:
exactamente 10 confirmados y 40 rechazos `EVENT_FULL`.

**Toda escritura pasa por la API.** El frontend solo usa Supabase para iniciar sesión y escuchar
cambios en tiempo real. Las reglas de negocio quedan en un solo lugar (el backend) y las políticas RLS
bloquean cualquier escritura directa desde el navegador.

## 4. Cómo reproducir
Ver `docs/specs/database.md` y `supabase/migrations/20261001024930_initial_schema.sql`.

## 5. Pendientes y riesgos
- Actualizar en la presentación las láminas de stack (MySQL → Supabase).
- El proyecto gratuito de Supabase se pausa tras 7 días sin uso: entrar al panel si pasa una semana sin actividad.
