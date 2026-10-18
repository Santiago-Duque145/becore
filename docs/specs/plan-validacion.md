# Plan de validación — partido del 31 de octubre de 2026 (S3-07)

Objetivo: comprobar con usuarios reales que Be Core permite organizar un partido sin sobrecupo y que se entiende sin explicación. Se mide con tiempos, errores, conteos de asistencia y el cuestionario SUS. Es un proyecto académico; los datos son anónimos y se usan solo para el trabajo de grado (Ley 1581 de 2012, ver `/privacidad`).

## 1. Preparación (antes del 31 de octubre)

**Fecha límite de cambios:** congelamiento el 29 de octubre (ver `backlog.md`, S4). El 30 se hace el ensayo general.

| Qué | Detalle | Responsable |
|---|---|---|
| Red | La cancha puede no tener Wi-Fi. Usar el *hotspot* del celular de un integrante o el del portátil. Probar con 10 celulares conectados a la vez. | Ambos |
| IP del portátil | `ipconfig` > IPv4 (p. ej. `192.168.43.5`). La app queda en `http://<IP>:5173`. Ver README §8. Anotar la IP: con *hotspot* cambia. | Santiago |
| Firewall | Permitir Node.js en red privada o abrir el puerto 5173 (README §9). Probar desde otro celular antes. | Santiago |
| Google (Test users) | Cada amigo que entre con Google debe estar como *Test user* en Google Cloud (modo prueba, `auth-onboarding.md` §10). Agregarlos a más tardar el 28. Si alguno no está, que se registre con correo y contraseña. | Felipe |
| URLs de Supabase | Que `http://<IP>:5173/**` (o `http://192.168.*.*:5173/**`) esté en Authentication > URL Configuration. | Felipe |
| Datos | Un evento "Partido 31 oct" publicado por un organizador (cupo 10 de 12 invitados para forzar cupo lleno). No usar los `@becore.test`: los participantes crean su propia cuenta. | Santiago |
| Correo | SMTP funcionando; confirmar que un recordatorio de prueba llega a la bandeja y no a spam (`npm run reminders -w backend`). Ajustar `REMINDER_HOURS_BEFORE` o crear el evento con inicio cercano para que el recordatorio ocurra en la sesión. | Felipe |
| Portátil | Cargado, `npm run dev` probado, backup del seed (`npm run seed -w backend`). | Santiago |
| Cuestionario | Crear el SUS (§5) en Google Forms con las 12 preguntas y la hoja de respuestas; enlace corto o QR impreso. | Felipe |
| Plan B | Si la red falla: video de respaldo y demostración en el portátil; el cuestionario se responde en papel. | Ambos |

## 2. Roles durante la sesión

- **Facilitador** (uno de los integrantes): explica el objetivo, entrega la tarea y **no ayuda** salvo que el participante lleve más de 3 minutos atascado (se anota como "ayuda requerida").
- **Observador** (el otro): cronometra, anota errores y comentarios; no habla.
- **Organizador del partido**: el integrante que usa el rol organizador para el check-in en la cancha.
- **Participantes**: 8 a 12 amigos, con teléfono propio. Cada uno firma o acepta verbalmente el consentimiento y recibe un código (P01, P02, ...) para no usar nombres en los registros.

## 3. Guion paso a paso para los participantes

El facilitador lee la introducción: "Estamos probando la aplicación, no a ti. Si algo no se entiende, el problema es de la app. Piensa en voz alta."

| # | Tarea | Resultado esperado |
|---|---|---|
| T1 | Abre `http://<IP>:5173` y **crea una cuenta** (correo o Google). Acepta la política de datos. | Cuenta creada |
| T2 | Completa **"Cuéntanos tus gustos"** (onboarding). | Llega a Descubre |
| T3 | Mira la sección **"Para ti"** y dime si ves algo que te interese (se pregunta la P11 al final). | Ve recomendaciones |
| T4 | Encuentra el evento **"Partido 31 oct"** y **confirma tu asistencia**. | Asistencia confirmada |
| T5 | **Cancela** tu asistencia. | Cupo liberado |
| T6 | **Vuelve a confirmar.** | Confirmado otra vez |
| T7 | Abre **Avisos** y busca el aviso/recordatorio del partido; revisa tu correo si te llegó. | Ve el aviso |
| T8 | En la cancha: el organizador hace **check-in** de cada persona presente. El participante verifica que aparece como "llegó". | Check-in registrado |
| T9 | (Opcional, si ya está P2) **Califica el evento** una vez finalizado. | Calificación enviada |
| T10 | Responde el cuestionario SUS y las 2 preguntas extra (§5). | Formulario enviado |

Prueba de cupo: cuando el evento esté lleno, 2 o 3 participantes intentan confirmar a la vez; debe verse el mensaje de "evento lleno" y nunca más confirmados que el cupo.

## 4. Qué medir

| Métrica | Cómo | Dónde se anota |
|---|---|---|
| Tiempo por tarea (T1 a T6) | Cronómetro del observador: desde que se lee la tarea hasta que el participante lo logra | Hoja de observación |
| Éxito de tarea | Sí / Con ayuda / No | Hoja de observación |
| Errores | Mensajes de error vistos, toques equivocados, vueltas atrás | Hoja de observación |
| Confirmaciones | Confirmados al cierre vs. cupo (nunca debe exceder) | Panel del organizador / base |
| Asistencia real vs. confirmada | Confirmados vs. con check-in; porcentaje de llegada | Panel del organizador |
| Recordatorio | Si llegó el correo y cuánto tardó | Participante / bandeja |
| Check-ins | Cantidad y tiempo promedio por persona | Observador |
| Calificaciones | Promedio y número de calificaciones (si P2 está activa) | Base de datos |
| SUS | Puntaje por participante y promedio (§6) | Hoja de cálculo |
| Comentarios | Citas textuales (anónimas) y dolores repetidos | Hoja de observación |

Además se registra el rendimiento medido con `backend/scripts/measure-p90.js` (RNF: p90 de `GET /events` < 2 s) y se reportan los resultados en el informe de validación (`docs/progreso/`).

Hoja de observación sugerida (una fila por participante y tarea): `Código | Tarea | Inicio | Fin | Segundos | Éxito | Errores | Comentario`.

## 5. Cuestionario SUS en español

Escala de 1 (Totalmente en desacuerdo) a 5 (Totalmente de acuerdo). Se pregunta por "el sistema" = la aplicación Be Core.

1. Creo que me gustaría usar este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría el apoyo de una persona técnica para poder usar este sistema.
5. Encontré que las diversas funciones del sistema estaban bien integradas.
6. Pensé que había demasiada inconsistencia en este sistema.
7. Imagino que la mayoría de las personas aprendería a usar este sistema muy rápidamente.
8. Encontré el sistema muy engorroso de usar.
9. Me sentí muy seguro/a usando el sistema.
10. Necesité aprender muchas cosas antes de poder empezar a usar el sistema.

Preguntas propias (misma escala 1 a 5, **no entran en el puntaje SUS**):

11. Las recomendaciones de "Para ti" me parecieron acertadas.
12. Calificar el evento fue fácil. (Si no se pudo calificar, "No aplica".)

Preguntas abiertas (opcionales): ¿Qué fue lo que más te gustó? ¿Qué fue lo más confuso? ¿Qué cambiarías primero?

## 6. Cómo calcular el puntaje SUS

Solo los ítems 1 a 10. Para cada participante:

1. Ítems **impares** (1, 3, 5, 7, 9): contribución = respuesta − 1.
2. Ítems **pares** (2, 4, 6, 8, 10): contribución = 5 − respuesta.
3. Suma las 10 contribuciones (rango 0 a 40) y **multiplica por 2,5** (rango 0 a 100).
4. El puntaje del sistema es el **promedio** de los puntajes individuales (no se promedia por ítem).

Ejemplo: respuestas 4, 2, 4, 1, 5, 2, 4, 2, 4, 2 → impares: 3+3+4+3+3 = 16; pares: 3+4+3+3+3 = 16; suma 32 × 2,5 = **80**.

Interpretación de referencia: 68 es el promedio de la literatura; ≥ 68 se considera usabilidad aceptable, ≥ 80 buena, ≥ 85 excelente. Descartar cuestionarios incompletos (se necesitan los 10 ítems). Reportar n, promedio, mediana, desviación y mínimo/máximo. Las preguntas 11 y 12 se reportan aparte (promedio y distribución, y porcentaje que respondió 4 o 5).

Fórmula para la hoja de cálculo, con las respuestas del ítem 1 en `B2` hasta el ítem 10 en `K2`:

```
=((B2-1)+(5-C2)+(D2-1)+(5-E2)+(F2-1)+(5-G2)+(H2-1)+(5-I2)+(J2-1)+(5-K2))*2.5
```

## 7. Después de la sesión

1. Exportar las respuestas del formulario y la hoja de observación el mismo día.
2. Calcular SUS, tiempos y asistencia real vs. confirmada.
3. Listar problemas por frecuencia y severidad; los de severidad alta se corrigen el 1 de noviembre si hay tiempo, el resto queda como trabajo futuro.
4. Registrar todo en `docs/progreso/04_2026-11-01_validacion-y-cierre.md` y usar los resultados en la presentación (S4-03).
