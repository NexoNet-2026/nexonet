# NexoNet — Contexto para Claude

> Pegá este archivo al inicio de cada nuevo chat para restaurar el contexto completo del proyecto.

---

## Datos del proyecto

| Campo | Valor |
|---|---|
| **App** | NexoNet — nexonet.ar |
| **Stack** | Next.js + TypeScript + Tailwind CSS |
| **Backend** | Supabase (DB + Storage + Auth) |
| **Repo** | GitHub: NexoNet-2026/nexonet |
| **Deploy** | Vercel Hobby (migrar a Pro al lanzar comercialmente) |
| **Dev** | Adrian — solo developer |

## Datos del admin

| Campo | Valor |
|---|---|
| **Usuario admin** | adrianmorra / adrianmorra@gmail.com |
| **Código usuario** | NAN-5194178 |
| **UUID admin** | ab56253d-b92e-4b73-a19a-3cd0cd95c458 |
| **Nexo propio** | NXN-00003 |
| **Panel admin** | nexonet.ar/admin/login |

---

## Estado funcional — ✅ Resuelto

- Home, Buscar, Mapa, Publicar, Anuncios/[id], Mis Anuncios, Usuario, Chat
- Grupos completos (8 pestañas + consorcios)
- Sistema de BIT: tipos Free, Nexo, Promotor, Búsquedas, Grupo, Conexión
- PopupCompra unificado con 5 métodos de pago
- Tienda de BIT + API MercadoPago integrada (falta activar cuenta producción)
- Panel Admin v2 con 9 tabs (incluyendo config de rubros/subrubros y grupos)
- Sistema de Promotores + referidos escalonados
- Notificaciones in-app + campana Header
- Geolocalización + tablas de Argentina cargadas
- Sliders en nexos: flechas / dots / autoplay
- Bucket nexos en Supabase Storage creado (Public, con políticas INSERT y SELECT)
- Fix tabla nexo_sliders (antes se consultaba erróneamente como nexo_páginas)
- Fix flujo de eliminación de usuarios (error auth.admin.deleteUser no fatal)
- Modal "Asignar BIT" limpio: solo muestra BIT Nexo, BIT Free, BIT Promo
- Modal búsqueda socios comerciales: fix filtro .or() reemplazado por dos .maybeSingle()
- RLS deshabilitado en socios_comerciales para permitir inserts del admin
- Query cargarSocios usa sintaxis de FK explícita: usuarios:usuario_id(...)
- Fallback "👥 Grupos" en home slider para grupos sin subtipo (commit 02b1f8b)
- Página buscar: fix React Fragment para que bloque sinCat renderice correctamente

---

## Estado funcional — ⏳ Pendiente / En progreso

### 🔴 Bug abierto: Grupos no visibles en frontend
- Síntoma: Un grupo recién creado (ej: "Electrotec", subtipo: null) aparece correctamente en la DB con usuario_id poblado, pero no se muestra en home ni en buscar aunque los fixes de fallback fueron aplicados.
- Último diagnóstico: Console logs confirmaron que el grupo estaba en el array sinCat pero no renderizaba visualmente. Posible problema de scroll visibility o condición de renderizado. Sin resolver al cierre de la última sesión.
- Archivos clave: src/app/page.tsx (home), src/app/buscar/page.tsx

### 🟡 Socios tab — nombre muestra "—"
- Después del último fix no se confirmó si el nombre del socio aparece correctamente.
- Archivo clave: src/app/nexo/[id]/admin/page.tsx (tab Socios)

### 🟡 MercadoPago
- API integrada pero falta activar credenciales de producción (cuenta vendedor).

### 🟡 Términos y Condiciones / Privacidad / Cookies
- Pendiente desde hace varias sesiones.

### 🟡 Scraper de clasificados
- Lista de sitios AR armada. Se desarrolla local en PC de Adrian, no en el repo.

### ⚪ Sección de descargas pagas (futuro)
- Diseño conceptual completo. No implementado todavía.

---

## Decisiones tomadas (no reabrir)

| Tema | Decisión |
|---|---|
| WhatsApp Business | No implementar por costo. Chats internos con notificaciones. |
| Scraper | Local en PC de Adrian, no en Vercel/repo. |
| Vercel plan | Hobby OK para desarrollo. Migrar a Pro al lanzar comercialmente. |

---

## Reglas de trabajo con Claude

1. Siempre archivos completos, nunca snippets parciales.
2. Siempre incluir comandos Git junto a cada cambio de archivo.
3. Respuestas directas y accionables, sin explicaciones largas si no se piden.

---

## Próximos pasos (en orden de prioridad)

1. Resolver bug visual de grupos en home y buscar
2. Confirmar fix de socios tab (nombre "—")
3. Activar MercadoPago producción
4. Términos y Condiciones (contenido)

---

*Última actualización: 25 de marzo de 2026*
