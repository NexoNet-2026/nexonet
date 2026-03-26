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
- Grupos completos — se crean en nexos (tipo=grupo), clasifican por subrubro_id
- Sistema de BIT: tipos Free, Nexo, Promotor
- PopupCompra unificado con 5 métodos de pago
- Tienda de BIT + API MercadoPago — crear-preferencia acepta titulo+monto desde tienda
- Panel Admin v2 con 9 tabs
- Sistema de Promotores + referidos escalonados
- Notificaciones in-app + campana Header
- Geolocalización + tablas de Argentina cargadas
- Sliders en nexos: flechas / dots / autoplay
- Grupos en buscar: clasificados por subrubro_id, muestran miembros_count (desde nexo_miembros) y visitas totales
- Grupos en home: muestran nombre creador (owner_nombre), miembros_count y visitas
- TarjetaNexo unificada: nombre creador + miembros (si grupo) + visitas totales
- TarjetaAnuncio: muestra visitas_semana
- Perfil → Grupos: muestra vistas del grupo
- Botón eliminar grupo desde perfil (solo creador)
- AyudaPopup: fullscreen, controlable externamente (open/onClose), CTA navega al rubro, botón ? en cada tipo en publicar

## Estado funcional — ⏳ Pendiente

- MercadoPago: crear-preferencia corregido, pendiente confirmar que el pago completo funcione end-to-end
- Términos y Condiciones / Privacidad / Cookies
- Scraper de clasificados (local en PC de Adrian)
- Sección de descargas pagas (diseño conceptual listo)

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| WhatsApp Business | No implementar. Chats internos. |
| Scraper | Local en PC de Adrian, no en repo. |
| Vercel plan | Hobby OK. Migrar a Pro al lanzar. |
| Grupos | Se guardan en tabla nexos (tipo=grupo), NO en tabla grupos separada |
| miembros_count | No existe en nexos — se cuenta desde nexo_miembros en runtime |

## Reglas de trabajo con Claude

1. Siempre archivos completos, nunca snippets parciales.
2. Siempre incluir comandos Git junto a cada cambio.
3. Respuestas directas. Sin explicaciones largas si no se piden.
4. Antes de tocar código, preguntar si no está claro.

---

*Última actualización: 26 de marzo de 2026*
