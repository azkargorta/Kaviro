# Marca: Kaviro

- **Nombre público**: Kaviro (`lib/brand.ts` — `APP_NAME`, taglines, títulos OG).
- **Repositorio / paquete npm**: TripBoard (legado; no mostrar al usuario).
- **Logo**: `components/brand/KaviroLogo.tsx` (alias deprecado `TripBoardLogo.tsx`). Lockup en fondos claros usa filtro CSS coral sobre el PNG fullcolor; el icono suelto usa `/brand/icon.png`.
- **Componentes de layout** con prefijo `TripBoard*` (p. ej. `TripBoardPageHeader`): nombres internos; no cambian la marca visible.
- **Marcadores IA** `KAVIRO_*_JSON_*` (ver `lib/trip-ai/kaviroJsonMarkers.ts`): protocolo que emiten los prompts (itinerario, diff, búsqueda, documentos, plan del día, listas). Al leer respuestas antiguas se aceptan alias `TRIPBOARD_*_JSON_*`. `tripboardJsonMarkers.ts` reexporta por compatibilidad.
- **Variables de entorno**: preferir `KAVIRO_ADMIN_EMAILS`; `TRIPBOARD_ADMIN_EMAILS` sigue funcionando.
- **Email transaccional**: proveedor **Resend** (SMTP en Supabase Auth); remitente `hola@kaviro.app`. Ver `docs/RESEND_EMAIL_SETUP.md`.
