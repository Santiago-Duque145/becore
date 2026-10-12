# Rediseño del frontend (R0–R9)
**Sprint:** Rediseño (entre S2 y S3) · **Fecha:** 2026-10-12 · **Responsables:** Santiago / Felipe · **Estado:** Completado (pendientes de configuración en Supabase, ver §6)

## 1. Objetivo

Llevar todo el frontend al diseño de los mockups (`docs/mockups/`) con la skill `becore-ui`, agregar login con Google
y onboarding de gustos con recomendaciones "Para ti" por reglas, y dejar la app lista para usarla desde el celular en el
partido del 31 de octubre.

## 2. Qué se hizo (por sesión)

| Sesión | Qué se hizo | Rama / RF |
|---|---|---|
| R0 | Auditoría del frontend frente a los mockups (`docs/specs/rediseno-auditoria.md`), contradicciones resueltas y orden de precedencia | `rediseno-r0` |
| R1 | Tokens de la skill y tema oscuro, componentes base de `components/ui/`, íconos SVG propios, layouts por rol y ancho (barra inferior, superior y lateral), `/dev/ui` | `rediseno-r1` |
| R2 | Migración de onboarding aplicada en Supabase; `GET /me` con `onboardingCompleted` y `preferences`; `PUT /me/onboarding` y `PUT /me/preferences` | `rediseno-r2` · RF-03 |
| R3 | `/login` idéntico al mockup a 390 px; registro sin rol con indicador de fuerza; Google (`/auth/callback`); recuperar y nueva contraseña; guard `RequireOnboarding`; errores de Auth en español | `rediseno-r3` · RF-01, RF-02 |
| R4 | Onboarding de 5 pasos en `/bienvenida` (reducer, Omitir, Reintentar, foco al título, `motion-reduce`) | `rediseno-r4` · RF-03 |
| R5 | `GET /events/recommended` (`getCandidates → scoreEvent → rank`, preparado para re-ranking con IA); `/descubre` con buscador, ticker en vivo, chips, "Para ti" y columna de citas | `rediseno-r5` · RF-07 |
| R6 | Detalle de evento como el mockup, cupo en vivo (`useRealtimeEvent`), barra de acción fija, vista del dueño | `rediseno-r6` · RF-08, RF-11, RF-12 |
| R7 | `/mis-eventos`, `/avisos` (bandeja con punto de no leídas por Realtime) y `/perfil` con "Tus gustos"; `GET /dashboard/participant` y endpoints de avisos | `rediseno-r7` · RF-16, RF-17, RF-19 |
| R8 | `/panel` del organizador (`GET /dashboard/organizer`), formulario de evento con duración, stepper y vista previa, asistentes con contador, citas con el mismo lenguaje | `rediseno-r8` · RF-04, RF-05, RF-13, RF-14, RF-18 |
| R9 | Checklist §7 en todas las rutas, objetivos de 44 px, contraste, PWA mínima, carga diferida por ruta, limpieza de dependencias | `rediseno-r9` |

## 3. Decisiones técnicas

1. **Sin mapa, ruta, distancia ni chat.** Los mockups los traen, pero están fuera de alcance (`CLAUDE.md` §9). Donde estaban, el layout se reacomoda sin huecos; tampoco se muestra "van en camino" ni avatares de asistentes porque la API no trae esos datos.
2. **El rol se elige en el onboarding**, no en el login ni en el registro (`auth-onboarding.md` §2): Google no envía rol y elegirlo al iniciar sesión confundía. El cambio de rol solo se permite mientras el onboarding está pendiente (409 después).
3. **Placeholder `#64748B` (`ink-faint`)** en lugar del `#475569` del mockup, que no tenía contraste. Aun así no llega a 4.5:1, por eso no se usa para texto que importe (el divisor de login pasó a `ink-muted`) y todos los campos tienen label.
4. **Layouts por rol:** barra inferior de 4 pestañas en móvil; en escritorio, barra superior para el participante y barra lateral para el organizador. El detalle de evento en móvil va a pantalla completa (modo inmersivo del `AppShell`).
5. **"Para ti" por reglas, sin IA.** Puntaje en el backend (categoría +3; día, franja y zona +1) en hora de Bogotá; el módulo deja un punto de enganche para un re-ranking con IA sin cambiar el contrato.
6. **Alturas del mockup:** campos de 47 px y botones de 49 px con `leading-[17px]`, aunque el texto de los campos sea de 16 px en móvil (evita el zoom de iOS).
7. **Sin tocar contratos:** los endpoints nuevos (`/events/recommended`, `/notifications/*`, `/dashboard/*`) se documentaron en `api.md`; `/dashboard/*` ya estaban especificados y se construyeron tal cual, con campos adicionales (asistencias canceladas en participante; `category` y `location` en organizador).
8. **PWA mínima sin service worker:** manifiesto, íconos generados del `BrandMark` y metas de iOS. Por HTTP en la red local queda como acceso directo a pantalla completa.

## 4. Cómo reproducir

```bash
npm install
npm run dev                         # backend :3000 y frontend :5173
npm test && npm run lint            # 194 pruebas del backend, 47 del frontend
npm run build -w frontend           # sin aviso de chunk > 500 kB
```

Celular: abrir la URL **Network** que imprime Vite (`http://192.168.x.x:5173`) → Android: menú ⋮ → "Agregar a pantalla de
inicio"; iPhone: Safari → Compartir → "Agregar a pantalla de inicio". Abrir desde el ícono e iniciar sesión.

## 5. KPIs

| Indicador | Valor |
|---|---|
| Pruebas | 194 backend + 47 frontend, todas en verde |
| Lighthouse móvil · Accesibilidad | `/login` 100 · `/descubre` 100 |
| Lighthouse móvil · Rendimiento | `/login` 86 · `/descubre` 100 |
| Checklist §7 | 46 combinaciones (ruta × rol × ancho) sin problemas |
| Bundle | de 1 chunk de 789.9 kB (232.6 kB gzip) a 40 archivos; mayor 265.4 kB; carga inicial 565.9 kB (170.2 kB gzip) |
| `/login` frente al mockup a 390 px | posiciones y tamaños iguales al píxel (salvo el bloque de Google) |
| Confirmar asistencia | 1 toque desde el detalle, 2 desde Descubre (RNF-01: ≤ 3) |

## 6. Pendientes y riesgos

- **Supabase (lo hace el equipo):** activar Google y agregar las URLs de redirección (`auth-onboarding.md` §10); configurar SMTP propio o desactivar "Confirm email" (hoy el correo integrado permite 2 correos por hora y el registro nuevo no se puede completar).
- **Probar en celulares reales** "Agregar a pantalla de inicio" (Android y iPhone) por la IP de la Wi-Fi; en headless solo se verificó el manifiesto y los íconos.
- **Ticker y actividad en vivo** empiezan vacíos: no hay endpoint de actividad global (solo Realtime).
- **Datos de prueba:** dos eventos cancelados "[Prueba R8] …" de `santiago` y una fila de `user_preferences` vacía de `jugador12`.
- **Buenas prácticas de Lighthouse en `/descubre` (96):** el 65 % del texto mide menos de 12 px (metadatos de tarjeta en 11.5 px, como el mockup).
- **Push:** ninguna de las ramas `feature/rediseno-r0` … `r9` está publicada todavía; se encadenan en orden (r3 integra r1 y r2).
