# Cómo pedirle tareas a Claude Code (Sonnet) — Be Core

Claude Code ya lee `CLAUDE.md` solo. Estos prompts le dicen **qué** tarea hacer y **cómo** cerrarla.
Se copian tal cual, cambiando únicamente el ID de la tarea.

## Reglas de uso

1. Abre la terminal en la raíz del repo, ejecuta `claude` y luego `/model sonnet`.
2. **No ejecutes `/init`**: reescribiría el `CLAUDE.md` que ya está escrito.
3. **Una tarea por sesión.** Al terminar una tarea, `/clear` antes de la siguiente. El contexto limpio hace que Sonnet siga mejor las reglas.
4. Empieza cada tarea en **modo plan** (Shift+Tab hasta ver "plan mode"). Lee el plan, corrígelo si algo no cuadra con las specs y solo entonces apruébalo.
5. Si Sonnet propone instalar algo fuera de la lista permitida o cambiar el esquema, responde "no, sigue la spec".
6. Antes de hacer el PR, revisa tú el diff completo. Ustedes deben poder explicar cada línea en la sustentación.

---

## Prompt 1 · Empezar una tarea (el que más van a usar)

```
Vamos a hacer la tarea S1-03 del backlog.

1. Lee la tarea en docs/specs/backlog.md y SOLO las secciones de spec que cita.
2. Crea la rama feature/S1-03-<nombre-corto> desde develop.
3. Antes de escribir código, muéstrame el plan: archivos a crear o modificar, funciones principales
   y pruebas que vas a escribir. Señala cualquier ambigüedad de la spec.
4. Cuando lo apruebe, implementa solo lo que pide la tarea, siguiendo backend/CLAUDE.md o
   frontend/CLAUDE.md según corresponda.
5. Ejecuta npm run lint y npm test, y corrige hasta que pasen.
6. Termina con: archivos cambiados, cómo probarlo a mano paso a paso, criterios de aceptación
   cumplidos (uno por uno) y el mensaje de commit propuesto. No hagas commit todavía.
```

## Prompt 2 · Commit y PR

```
Revisé el diff y está bien. Haz el commit con el mensaje que propusiste (Conventional Commits en
español y la línea Refs: <ID>), haz push de la rama y dame el texto para el PR siguiendo
.github/pull_request_template.md.
```

## Prompt 3 · Arreglar un error

```
Hay un error en <pantalla o endpoint>.
Pasos para reproducir: <1, 2, 3>
Esperado: <qué debería pasar según docs/specs>
Obtenido: <qué pasa, con el mensaje de error o captura>

Encuentra la causa antes de cambiar nada y explícamela en dos o tres frases. Después propón el
arreglo mínimo, agrega una prueba que falle sin el arreglo y pase con él, y no toques nada más.
```

## Prompt 4 · Revisar el PR del compañero

```
Revisa la rama feature/<rama> contra develop (git diff develop...feature/<rama>).
Compárala con la tarea <ID> de docs/specs/backlog.md y con CLAUDE.md. Dame una lista corta de:
1) criterios de aceptación que no se cumplen, 2) violaciones de las reglas de capas o de seguridad,
3) errores probables. No cambies código; solo reporta con archivo y línea.
```

## Prompt 5 · Avance de sprint

```
Escribe docs/progreso/<NN>_<fecha>_<titulo>.md con la plantilla del final de docs/specs/backlog.md.
Usa git log de este sprint (desde el tag anterior) para saber qué se hizo. En "Decisiones técnicas"
explica cada decisión como para un jurado: problema, opciones, decisión y por qué.
Deja en blanco los KPIs que no puedas medir y dime cuáles faltan.
```

---

## Arranque de hoy (S0), en este orden

Antes de los prompts: hagan entre los dos la tarea **S0-00** (configuración manual en Supabase, Gmail y
GitHub) y copien al repo los archivos de este kit: `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`,
`docs/`, `supabase/migrations/` y `.claude/settings.json`. Hagan un primer commit
`chore: contexto y especificaciones del proyecto` directo en `develop` (única excepción a la regla de PR).

| Orden | Tarea | Quién | Depende de |
|---|---|---|---|
| 1 | S0-01 Monorepo y herramientas | Santiago | S0-00 |
| 2 | S0-03 Migración en Supabase | Felipe | S0-00 (en paralelo con 1) |
| 3 | S0-02 Esqueleto del backend | Santiago | S0-01 |
| 4 | S0-05 Esqueleto del frontend | Felipe | S0-01 |
| 5 | S0-04 Autenticación en el backend | Santiago | S0-02, S0-03 |
| 6 | S0-06 Datos de demo | Felipe | S0-02, S0-03 |

Para S0-01, como el repo está vacío, usen esta variante del Prompt 1:

```
Vamos a hacer la tarea S0-01 del backlog. El repositorio solo tiene la documentación; todavía no
hay código. Lee CLAUDE.md, la tarea S0-01 en docs/specs/backlog.md y la sección 3 de
backend/CLAUDE.md (scripts). No crees aún el código de backend ni de frontend: solo la raíz del
monorepo, las configuraciones y el CI. Para que los workspaces funcionen, crea en backend/ y
frontend/ un package.json mínimo con "name", "private": true, "type": "module" y scripts lint/test
que por ahora solo impriman un mensaje. Muéstrame el plan antes de crear archivos.
```
