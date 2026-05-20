# Marca: Kaviro

- **Nombre público**: Kaviro (`lib/brand.ts` — `APP_NAME`, taglines, títulos OG).
- **Repositorio / paquete npm**: TripBoard (legado; no mostrar al usuario).
- **Logo**: `components/brand/KaviroLogo.tsx` (alias deprecado `TripBoardLogo.tsx`).
- **Componentes de layout** con prefijo `TripBoard*` (p. ej. `TripBoardPageHeader`): nombres internos; no cambian la marca visible.
- **Marcadores IA** `TRIPBOARD_*_JSON_*`: protocolo estable con el modelo; no renombrar sin migración.
- **Variables de entorno**: preferir `KAVIRO_ADMIN_EMAILS`; `TRIPBOARD_ADMIN_EMAILS` sigue funcionando.
