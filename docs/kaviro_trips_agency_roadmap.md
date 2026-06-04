# Kaviro Trips — Qué más puede necesitar una agencia

**Fecha:** Junio 2026  
**Base:** Kaviro-main v2 — análisis desde la perspectiva real de una agencia de viajes

---

## Lo que Kaviro Trips ya tiene

| Feature | Estado |
|---|---|
| Panel centralizado con todos los viajes | ✅ Completo |
| Equipo con roles admin/editor | ✅ Completo |
| Plantillas reutilizables entre temporadas | ✅ Completo |
| Portal cliente con branding (logo + color) | ✅ Completo |
| Importación de dossiers con IA | ✅ Completo |
| Gastos compartidos del grupo | ✅ Completo |
| Anuncios al cliente desde el panel | ✅ Completo |
| Informes básicos (5 métricas) | 🟡 Básico |
| CRM de clientes | 🟡 Solo lista básica |

---

## 🔴 Alta prioridad

1. **Cotizaciones y presupuestos** — propuesta formal, PDF, aceptación online (2-3 semanas)
2. **Gestión de cobros** — señal + pago final, Stripe, semáforo por viajero (2-3 semanas)
3. **Plazas, lista de espera y cancelaciones** — ✅ **MVP** (`/agency/trips/[id]/operaciones` + `docs/kaviro_agency_capacity.sql`)
4. **CRM completo** — historial, tags, segmentación (2-3 semanas)
5. **Comunicación automatizada** — secuencias Resend por evento (2-3 semanas)

---

## 🟣 Media prioridad

6. Encuesta pre-viaje  
7. NPS post-viaje  
8. Directorio de proveedores  
9. Calendario de operaciones  
10. Checklist pre-salida — ✅ **MVP** (misma página operaciones + `docs/kaviro_agency_checklist.sql`)  
11. Firma digital de documentos  

---

## 🔵 Revenue adicional

12. Dominio personalizado portal  
13. Actividades opcionales con pago en portal  
14. Informes financieros avanzados  

---

## 🟢 Diferenciadores

15. Generador de dossier con IA  
16. WhatsApp Business  
17. Portal multidioma  

---

## Implementación acordada (orden)

### Ahora mismo
1. ~~Plazas y estados por participante~~ ✅ MVP junio 2026  
2. ~~Encuesta pre-viaje~~ ✅ MVP junio 2026 (`docs/kaviro_agency_pretravel_survey.sql`)  
3. ~~Checklist pre-salida~~ ✅ MVP junio 2026  
4. ~~Calendario de operaciones~~ ✅ MVP (`/agency/calendar`)  

### Siguiente trimestre
5. Cotizaciones → 6. Cobros Stripe → 7. Emails automáticos → 8. NPS → 9. Firma digital  

### Medio plazo
10. Dossier IA → 11. CRM → 12. Informes → 13. Proveedores → 14. Dominio custom  

### Largo plazo
15. WhatsApp → 16. Multidioma → 17. Opcionales con pago  

---

## SQL de despliegue (nuevas features)

| Feature | Archivo SQL |
|---|---|
| Plazas y estados | `docs/kaviro_agency_capacity.sql` |
| Checklist pre-salida | `docs/kaviro_agency_checklist.sql` |
| Encuesta pre-viaje | `docs/kaviro_agency_pretravel_survey.sql` |

Ejecutar en Supabase → SQL Editor tras `kaviro_agency_features.sql`.

---

*Última actualización: Junio 2026*
