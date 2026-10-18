# Sexo, rango de edad y consentimiento de datos
**Fecha:** 2026-10-17 · **Rama:** `feature/estado-sprints` · **Estado:** Implementado; migración pendiente de aplicar

## 1. Pedido

El director pidió el 2026-10-17: sexo y edad en el onboarding, calificación de eventos finalizados, imagen del evento
(subida o generada con IA), avatares y más interactividad en el login. Esta sesión implementa **solo** el primer punto
más el consentimiento de datos que exige (Ley 1581 de 2012). Los otros cuatro quedan registrados como ampliación en
`CLAUDE.md` §9 (el pedido hablaba de §8, pero el alcance está en §9; §8 es Git).

## 2. Qué se hizo

| Pieza | Detalle |
|---|---|
| Migración | `20261021120000_demographics_consent.sql`: tipo `gender_identity`, `profiles.gender`, `profiles.age_range` (check), `profiles.data_consent_at`. Perfiles existentes quedan en NULL. |
| API | `PUT /me/onboarding` acepta `gender`/`ageRange`; nuevo `PUT /me/consent`; `PATCH /me` acepta nombre y/o sexo y edad (`null` borra). `GET /me` suma `gender`, `ageRange`, `dataConsentAccepted` (sin exponer la fecha). |
| Registro | Casilla obligatoria con enlace a `/privacidad` (Zod `consent: true`). El botón de Google queda deshabilitado hasta marcarla. |
| `/privacidad` | Página pública con el texto corto: datos, para qué, IA, cómo pedir el borrado, proyecto académico y Ley 1581. |
| Onboarding | Paso 2 "Cuéntanos un poco de ti" (6 pasos); reducer con `pick`; payload solo envía lo elegido. |
| Perfil | Sección "Sobre ti" para editar sexo y edad. |
| Usuarios sin consentimiento | `ConsentGate`: diálogo una vez por sesión, no bloquea; "Ahora no" lo cierra. Si acaban de marcar la casilla en `/registro`, la aceptación se guarda sola al abrir sesión. |
| Privacidad | Comentario en `services/recommendations/index.js`: sexo y edad no se usan para recomendar ni se envían a IA. Un test verifica que no llegan a `user_preferences`. |

Archivos nuevos: `backend/src/constants/demographics.js`, `frontend/src/components/ui/Checkbox.jsx`,
`components/preferences/{DemographicsFields,DemographicsEditor,ConsentGate}.jsx`, `lib/consent-pending.js`,
`pages/PrivacidadPage.jsx`. Specs actualizadas: `api.md`, `database.md`, `auth-onboarding.md`.

## 3. Decisiones

1. **La API guarda `data_consent_at`, no el trigger.** El registro con Supabase Auth no pasa por la API, así que la casilla se
   recuerda en `sessionStorage` (10 min) y la app llama a `PUT /me/consent` al abrir sesión. Si la pestaña cambia (enlace de
   confirmación de correo) se pierde y aparece el diálogo. Se limpia si el registro falla.
2. **Google desde `/login`** (primera entrada) no tiene casilla previa: ve el diálogo, que se puede cerrar con "Ahora no".
   El pedido pedía casilla obligatoria; con Google desde `/login` no es posible antes de salir a Google. Si el director quiere
   bloquear hasta aceptar, hay que quitar "Ahora no".
3. **Reenviar el consentimiento no mueve la fecha** de la primera aceptación.

## 4. Verificación

- Backend: `npm test` 206/206 y `eslint` sin errores (se agregaron pruebas de Zod, consentimiento, `PATCH` y que sexo/edad no llegan a `user_preferences`).
- Frontend: `vitest` 60/60, `eslint` sin errores, `vite build` correcto. Pruebas nuevas: consentimiento obligatorio en el registro (`auth-schemas.test.js`), reducer del onboarding de 6 pasos, `consent-pending`, sincronía de listas front/back.
- Visual a 390 y 1440 px (Edge headless): `/registro` y `/privacidad` sin scroll horizontal; la casilla parte en dos líneas a 390 px sin romper.
- **Sin verificar a ojo:** el paso nuevo del onboarding, el diálogo de consentimiento y la sección de Perfil, porque exigen sesión real. Probar a mano con un usuario nuevo y con uno del seed.
- `npx supabase db push --dry-run`: solo esta migración está pendiente. **No se aplicó** y su SQL no se ejecutó contra una base.

## 5. Pendientes

1. Aplicar la migración (`npx supabase db push`) antes de probar: sin las columnas, `GET /me` falla.
2. El correo de `/privacidad` (`becore.app@gmail.com`) sale de `backend/.env.example`; confirmar que es el del proyecto.
3. `/privacidad` dice que *podemos* apoyarnos en IA (Gemini): hoy no hay IA en producción (`CLAUDE.md` §9). Ajustar el texto si la fase de IA no se aprueba.
4. `docs/PLAN.md` no existe (nunca llegó su contenido): `docs/PLAN-santiago.md` sigue en su lugar.
5. Calificaciones, imagen del evento, avatares e interactividad del login: sin especificar.
