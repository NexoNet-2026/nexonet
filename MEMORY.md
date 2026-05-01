# Pendientes técnicos detectados (sesión 26-Abr-2026)

1. **Bucket fantasma: `nexos-descargas`**
   - Referenciado en `src/app/nexo/[id]/page.tsx:400`
   - NO existe en Supabase Storage
   - Decisión: dejar el código pero crear el bucket cuando se implemente la feature de descargas, o eliminar la referencia si la feature ya no se planea.

2. **Centralización de buckets de storage**
   - 5 buckets distintos referenciados como literales en 6 archivos (auditoría completa en sesión 26-Abr-2026).
   - Crear `src/lib/storage/buckets.ts` con constantes `BUCKET_AVATARES`, `BUCKET_NEXOS`, `BUCKET_NEXOS_DESCARGAS`, `BUCKET_ANUNCIOS`, `BUCKET_IMAGENES`.
   - Crear helper `uploadToStorage(bucket, path, file, options)` que centralice upload + getPublicUrl.
   - Refactorizar los 6 archivos para usar las constantes y el helper.
   - Sumar al helper la lógica de compresión cliente (browser-image-compression, WebP, max 500KB, resize a 1600px).

3. **Inconsistencia bucket vs path: bucket `imagenes` guarda anuncios viejos**
   - Convención vieja: `anuncios/{id_numerico}/foto.jpg` en bucket `imagenes`.
   - Convención nueva: bucket `anuncios` para anuncios.
   - Pendiente: definir oficialmente qué bucket usa cada tipo de contenido y migrar lo que quede.

4. **Optimización de imágenes (estrategia 4 capas)**
   - Capa 1: Pre-upload en cliente con `browser-image-compression` (urgente, antes de tener usuarios reales).
   - Capa 2: Multi-tamaño (thumb 400px + full 1600px).
   - Capa 3: Edge Function red de seguridad para archivos > 500KB.
   - Capa 4 (futuro): Cloudflare R2 cuando se rompa el límite de storage del Free tier.

5. **Trigger anti-huérfanos**
   - Cuando se borra un anuncio/grupo/perfil/etc, sus archivos quedan huérfanos.
   - Implementar trigger BD o lógica en helper de borrado que mueva archivos a `_trash/` automáticamente.
   - Esto evita rehacer el proceso manual de cuarentena cada N meses.

6. **Smoke test post-cuarentena pendiente**
   - Verificar visualmente en localhost que ninguna imagen quedó rota tras la cuarentena del 26-Abr.
   - Si algo se rompe: usar `02-rollback-EMERGENCIA.sql`.

7. **Purga definitiva de huérfanos**
   - Fecha mínima: 9-May-2026.
   - Vía recomendada: dashboard manual (Opción A en `03-purga-MANUAL-via-dashboard.md`).
   - Vía alternativa: `04-purga-script-API.ts`.


# Cierre de sesión 29-Abr-2026

## Lo cerrado hoy
- **Clonado PROD -> STAGING completo** (proyecto STAGING `twnjmfwegelzvecxxwtj`):
  79 tablas, 121 FKs, 192 policies, 12 functions, 4 triggers + 1 event trigger, 32 indexes, 30 constraints, 6690 filas de seed en 22 tablas. Verificado por SELECT de control (los 7 contadores dieron exactos).
- **`.env.local` reapuntado a STAGING** (creado con Read-Host para no exponer keys en chat). El `.env.local` viejo de PROD quedó respaldado como `.env.production.local`.
- **Vercel confirmado apuntando a PROD** (`thehpvccubxzsnbtbzmz`) en variable `NEXT_PUBLIC_SUPABASE_URL`, scope "All Environments".
- **Smoke test OK**: `npm run dev` levanta apuntando a STAGING, Network confirma requests a `twnjmfwegelzvecxxwtj.supabase.co`.

## Rotación de service_role en PROD (29-Abr-2026)
- **Causa**: `.claude/settings.local.json` estaba trackeado en git con el `service_role` JWT de PROD inline en varios comandos curl autorizados. 4 commits con esa key llegaron a `origin/master`: `9bab788`, `f753012`, `7807f1a`, `1542a70`.
- **Acción**:
  1. Generada nueva secret key `default_v3` en Supabase PROD.
  2. Cargada en Vercel (Production env, "All Environments") + redeploy Ready en 55s.
  3. Verificado nexonet.ar operativo con la nueva key (login persistente, anuncios visibles).
  4. `default_v2` (la expuesta) eliminada del dashboard.
- **Estado**: las versiones del JWT que quedaron en el historial de git ya no sirven para nada. Limpieza del historial NO ejecutada (queda como pendiente, ver abajo).
- **`.claude/` agregado a `.gitignore`** y sacado del tracking con `git rm --cached`. El archivo sigue en disco para uso de Claude Code, pero git ya no lo ve.

## Aprendizajes (para evitar fricción en futuras sesiones)
- **NUNCA correr `cat .env.local`** ni equivalentes en chat. Para verificar contenido sin exponer secretos: usar `Test-Path`, contar líneas, mostrar primeros N caracteres.
- **PowerShell `Read-Host`**: dentro de `Read-Host`, `Ctrl+V` no pega — inserta el carácter de control `^V`. Hay que pegar con **click derecho** en la terminal.
- **`Set-Content` con here-string** (`@"..."@`) es la forma confiable de escribir varias líneas en un archivo desde PowerShell, sin BOM cuando se usa `-Encoding UTF8` en PS 7+ (en PS 5.1 sí mete BOM, ojo si reusamos esto).
- **Cuando git imprime `rm 'archivo'` después de `git rm --cached`**, eso es output informativo, NO un comando. Si lo copiás y pegás como comando, borrás el archivo del disco.

# Pendientes técnicos detectados (sesión 29-Abr-2026)
6. **Limpieza del historial de git para borrar el JWT viejo expuesto**
   - El `service_role` `default_v2` ya está invalidado en Supabase, pero el JWT como string sigue presente en los 4 commits mencionados arriba (`9bab788`, `f753012`, `7807f1a`, `1542a70`).
   - No es un riesgo de acceso (la key no funciona), pero queda como huella de mala práctica visible en el repo.
   - Solución: `git filter-repo` o BFG Repo-Cleaner para reescribir esos commits sacando el contenido de `.claude/settings.local.json`. Requiere `git push --force` y coordinación si hay otros colaboradores.
   - Prioridad: baja (cosmética).
7. **Variables marcadas "Needs Attention" en Vercel**
   - Detectadas en Settings -> Environments -> Production: `SUPABASE_SERVICE_ROLE_KEY` (post-rotación), `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
   - Significado a confirmar (puede ser que Vercel detectó que estaban vacías, expuestas en logs, o duplicadas). Revisar en próxima sesión.
8. **Env vars de Supabase en Vercel scope "All Environments"**
   - `NEXT_PUBLIC_SUPABASE_URL` y compañía están seteadas para Production + Preview + Development a la vez, todas apuntando a PROD.
   - Cuando empecemos a usar branches de Preview o el ambiente Development, conviene scopearlas: Production -> PROD, Preview/Development -> STAGING.
9. **Warning de Next 16: `middleware` -> `proxy`**
   - `next dev` tira: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
   - Migrar el archivo `middleware.ts` (o `.js`) a la nueva convención `proxy` cuando haya una ventana tranquila. No bloquea hoy.
10. **`.env.production.local` queda en disco con la key vieja invalidada**
    - Es el respaldo del `.env.local` original que apuntaba a PROD.
    - Como la `service_role` que contiene ya está invalidada, el archivo es inofensivo pero engañoso: si en el futuro alguien lo lee creyendo que es válido, va a confundirse.
    - Decisión: actualizarlo con la key nueva (`default_v3`) para que sirva si volvemos a apuntar local a PROD, o borrarlo y dejarlo solo en Vercel.


# Cierre de sesion 01-May-2026

## Lo cerrado hoy
- **Dossier para abogado argentino** redactado y entregado al usuario (archivo separado, no commiteado al repo). Cubre: que es NexoNet en lenguaje claro, arquitectura tecnica resumida, datos personales recolectados, marco legal aplicable (Ley 25.326, Ley 24.240, jurisprudencia CSJN Rodriguez/Gimbutas/Mazza, ARCA/AFIP), riesgos identificados, documentos a redactar por el abogado, preguntas concretas para la primera reunion.
- **Checklist tecnico de pre-lanzamiento** redactado y entregado. Items A1-A10 (bloqueantes legales) y B1-B10 (deuda manejable post-lanzamiento).
- **Smoke test** desde la PC del usuario: app sana, requests al Supabase de STAGING correctamente.
- **Hallazgos sorpresa al recorrer la app en PROD via URL directa de Vercel**:
  - Existen ya las paginas legales: `/legal/terminos`, `/legal/privacidad`, `/legal/cookies`, `/legal/copyright` (formulario DMCA-like funcional). Esto cubre A1, A2, A9 parcialmente.
  - Bug menor: el boton "Volver" en paginas `/legal/*` no funciona (lleva a ningun lado). El boton "Inicio" si funciona.
  - El sitio NO tenia footer global. Los links legales eran invisibles para el usuario que no llegaba al formulario de registro o no conocia la URL exacta.
  - El formulario de registro tiene aceptacion tacita ("Al registrarte aceptas nuestros Terminos...") sin checkbox tildable.
- **Footer global implementado** (commit `f9cee9e`):
  - Componente `src/app/_components/Footer.tsx` con 4 columnas (NexoNet, Plataforma, Legal, Soporte).
  - Estilos inline alineados con la convencion del layout.
  - Padding-bottom 140px para no taparse con la barra inferior mobile (BUSCAR/MAPA/CREAR/GRUPOS/PERFIL).
  - Datos del titular: Adrian Morra monotributista, CUIT pendiente (placeholder visible), Roldan, legal@nexonet.ar.
  - Links a las 4 paginas legales existentes + placeholder visible para "Boton de Arrepentimiento" (todavia 404, prox sesion) + link a Defensa del Consumidor argentina.gob.ar.
  - Integrado en `src/app/layout.tsx` para aparecer en todas las paginas.
  - Verificado funcionando en local y en produccion (`nexonet.ar`).

## Aprendizajes (para evitar fricción en futuras sesiones)
- **NUNCA pegar codigo via PowerShell here-string @'...'@** en archivos .tsx. PowerShell o el chat intermedio reinterpretan caracteres como [mail](mailto:...) y rompen el JSX. Mejor: archivo presentado al usuario con boton de copia, usuario lo pega manualmente en VS Code.
- **Test-NetConnection se cuelga en "Waiting for response"** cuando la IP no responde a TCP. Usar ping primero como diagnostico rapido (mas barato y mas rapido).
- **El ISP del usuario tiene bloqueo selectivo** al rango 216.198.79.0/24 de Vercel desde su wifi. La PC del usuario no puede alcanzar 
exonet.ar ni la URL directa de Vercel cuando viajan por ese rango. Otras conexiones (celular con datos moviles) si llegan. Confirmado: no es problema de la app, es ruteo del ISP. Diagnostico hecho con: ping a IPs especificas, comparacion con 1.1.1.1 (responde), 8.8.8.8 (responde), 216.198.79.1 (no responde, 100% packet loss). DNS cambiado a 8.8.8.8/1.1.1.1, router reiniciado. Nada lo arregla excepto VPN.
- **Cuando una PC tiene problema de ISP, el navegador del celular con datos moviles** es el plan B confiable para verificar PROD.

# Pendientes técnicos detectados (sesion 01-May-2026)
11. **Botón de Arrepentimiento real** (la parte mas urgente legalmente)
    - Hoy en footer hay link visible que apunta a `/legal/arrepentimiento` pero esa ruta da 404.
    - Implementar:
      - Pagina `/legal/arrepentimiento` con formulario completo (10 campos, declaracion de buena fe).
      - Tabla `solicitudes_arrepentimiento` en Supabase con RLS.
      - Generador de codigo unico `ARR-YYYYMMDD-XXXX`.
      - Email al usuario con codigo + email a admin (`arrepentimiento@nexonet.ar`).
      - Pagina admin `/admin/arrepentimientos` para gestionar estados.
    - Resolucion 424/2020 + Disposicion 954/2025 lo exigen literalmente con ese nombre.
12. **Checkbox de aceptacion T&C en formulario de registro**
    - Hoy es aceptacion tacita ("Al registrarte aceptas...").
    - Agregar checkbox NO pre-tildado, deshabilitar boton hasta tildar, guardar version+fecha de terminos aceptados en columna nueva de tabla usuarios.
13. **Bug Volver en /legal/***
    - Boton "← Volver" no funciona en paginas legales. Boton "Inicio" si funciona.
    - Investigar y arreglar.
14. **CUIT real en footer**
    - Hoy esta como placeholder `[PENDIENTE — completar]`. Reemplazar con CUIT verdadero del usuario.
15. **Verificacion de email obligatoria al registrarse**
    - Supabase Auth tiene la opcion nativa: Settings -> Authentication -> Email Auth -> "Confirm email".
    - Verificar si esta activada. Si no, activarla.
16. **Banner de cookies inicial**
    - La pagina `/legal/cookies` existe. Falta el banner discreto la primera vez que entra el usuario.
17. **Problema de ISP del usuario con rango Vercel**
    - El ISP bloquea/no rutea bien hacia `216.198.79.0/24`.
    - Usuarios reales NO se ven afectados (lo testeamos desde celular, funciona).
    - Para resolver: llamar al ISP, o usar VPN (Cloudflare WARP descarga falla por intercepcion SSL del ISP - probar Proton VPN o Mullvad), o trabajar desde URL directa de Vercel cuando se necesite.
