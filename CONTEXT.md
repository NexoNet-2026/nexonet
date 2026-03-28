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
| **Deploy** | Vercel Hobby |
| **Dev** | Adrian — solo developer |

## Datos del admin

| Campo | Valor |
|---|---|
| **Usuario admin** | adrianmorra / adrianmorra@gmail.com |
| **Código usuario** | NAN-5194178 |
| **UUID admin** | ab56253d-b92e-4b73-a19a-3cd0cd95c458 |
| **Panel admin** | nexonet.ar/admin/login |

---

## Estado funcional — ✅ Resuelto

- Tarjetas unificadas: TarjetaNexo (home + buscar) y TarjetaAnuncio con visitas
- AyudaPopup: fullscreen, se abre al tocar tipo en publicar y franja promotor en header
- MercadoPago: crear-preferencia acepta titulo+monto desde tienda
- Datos vendedor en anuncio según vis_personal (sin mostrar WhatsApp)
- Búsqueda IA: matching al guardar, notifica al buscador en campanita, lista de resultados en perfil → Búsquedas con popup de anuncio
- Anunciante recibe chat cuando alguien lo busca con IA (solo si tiene bits_conexion)
- Panel BIT Conexión en anuncio muestra: visitantes del anuncio + interesados IA, con checkboxes para enviar mensajes
- Costo de mensajes: 1 BIT del anuncio (emisor) + 1 BIT del receptor por mensaje
- Toggle notificaciones WhatsApp eliminado de mis-anuncios y usuario
- RLS en anuncio_visitas y busqueda_matches configuradas correctamente
- Tabla busqueda_matches con columna config agregada

## Tablas nuevas esta sesión
- `busqueda_matches` (id uuid, busqueda_id uuid, usuario_id uuid, anuncio_id integer, bits_consumidos integer, created_at)
- RLS en `anuncio_visitas`: INSERT auth.uid()=visitante_id, SELECT dueño del anuncio
- RLS en `busqueda_matches`: SELECT auth.uid()=usuario_id

## Reglas de trabajo con Claude

1. Siempre archivos completos, nunca snippets parciales.
2. Siempre incluir comandos Git junto a cada cambio.
3. Respuestas directas. Sin explicaciones largas si no se piden.
4. Antes de tocar código, pedir el archivo si no lo tenés.
5. Grupos se guardan en tabla nexos (tipo=grupo).
6. miembros_count no existe en nexos — se cuenta desde nexo_miembros en runtime.

---

*Última actualización: 28 de marzo de 2026*
