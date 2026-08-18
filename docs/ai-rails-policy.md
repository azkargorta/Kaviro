# Raíles IA — acuerdos por tema

## Tema 1 — Plan por día (cerrado)

**Decisión:** no usar conteo global de actividades. La IA trabaja **por día** según carga horaria estimada e intención del usuario.

### Comportamiento acordado

1. **Preguntar antes de añadir** solo si hay **huecos horarios** detectados o si el **usuario lo pide** («añade», «busca», «rellena», «sobra tiempo»…).
2. **Anti-duplicados:** no repetir la misma visita **el mismo día**. Sí permitido en **días distintos** (ej. Torre Eiffel ver vs subir; Cataratas del Iguazú día 1 y 2).
3. **Día completo:** inferencia por palabras clave (Disney, parque temático, cataratas, safari, «día completo»…) + tipo de actividad. Bloque ~8 h → no añadir extras ese día salvo petición.
4. **Plan existente:** por defecto **KAVIRO_DIFF** / **KAVIRO_DAYPLAN**, no itinerario completo. Itinerario completo solo si el usuario pide **reemplazar** / **empezar de cero**.

### Implementación

- `lib/trip-ai/tripDayPlanningHints.ts` — análisis de huecos y bloque de prompt.
- `lib/trip-ai/buildTripSummary.ts` — incluye raíles en contexto del chat.
- `lib/trip-ai/buildPrompt.ts`, `handleAIAction.ts` — instrucciones al modelo.

### Cómo probar (manual)

1. Viaje Premium con 2 actividades el mismo día con hueco (ej. 10:00 museo, 20:00 cena).
2. Chat: «¿Qué te parece el jueves?» → debería comentar el día y **preguntar** si quieres añadir en la franja libre.
3. Chat: «Añade algo tranquilo el jueves por la tarde» → diff con `create_activity`, sin duplicar museo/cena.
4. Dos días «Cataratas del Iguazú» en fechas distintas → la IA no debe tratarlo como error.
5. «Rehaz todo el plan» → puede proponer itinerario completo (confirmación UI = Tema 2).

---

## Tema 4 — Autocreador conversacional (cerrado)

**Decisión:** el planificador Premium arranca con chat «Cuéntame tu viaje». Extrae una ficha estructurada, pregunta solo lo que falta, genera propuesta **antes** de crear el viaje, PDF descargable, y se puede iterar.

**Principio:** el viaje son **datos**, no un bloque de texto. El LLM de entrevista **no** diseña el itinerario. El motor de ruta / noches / actividades es código + prompts acotados.

### Ficha (qué falta para READY_TO_PLAN)

1. Destino
2. Bases de noche si es región o varios sitios (no hardcodear pueblos)
3. Fechas o duración
4. Llegada (o «no lo sé»)
5. Salida (o «no lo sé»)
6. Transporte si hay más de una base

Campos opcionales (si el usuario los dice): origen, ritmo, presupuesto, evitar, imprescindibles, pocos/muchos cambios de base.

### Arquitectura (alineada con `estructura_chatbot_creador_de_viajes`)

| Módulo | En Kaviro |
|---|---|
| Travel Interviewer | `interview/route.ts` + `plannerBrief.ts` |
| TripState | `PlannerBrief` (ficha) + draft de generate |
| Route / noches | `plannerStayRoute.ts` (código, no un prompt único) |
| Actividades | `generate/route.ts` por bloque de ciudad + relleno de traslados |
| Validator | relleno de días vacíos, no inventar destinos desde el chat (`plannerChatStops`, `plannerChatIntent`) |
| Modificación | «Refinar con IA» clasifica intención (`plannerChatIntent`) y regenera con raíles; no es un chat libre sin estado |

### PDF

`/trips/new/planner/propuesta` — imprimir / guardar como PDF. Regenerar itinerario vía chat = nuevo PDF.

### Formulario clásico

Sigue disponible («Prefiero el formulario clásico»).

### Fuera de este tema (más adelante)

- Versionado v1/v2 del viaje
- Duraciones door-to-door y fatiga por día
- Intereses dinámicos por destino (Islandia: termas, auroras…)
- Diff quirúrgico sin regenerar todo el itinerario


---

## Temas pendientes

- Tema 2: confirmación add vs replace en execute-plan
- Tema 3: límites del diff
- Tema 5: onboarding chat (viaje ya creado vacío)
- Tema 6: modo búsqueda
- Tema 7: import PDF
- Tema 8: límites de gasto (`docs/ai-spending-limits-future.md`)
