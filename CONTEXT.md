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

## Estado funcional — ✅ Resuelto esta sesión

- Tarjetas unificadas: TarjetaNexo (home + buscar) con visitas totales
- TarjetaAnuncio con visitas_semana, sin indicador WhatsApp
- AyudaPopup: fullscreen, controlable externamente, CTA continúa flujo de rubros
- AyudaPopup tipos: anuncio, empresa, servicio, grupo, trabajo, busqueda_ia, general, mapa, perfil, promotor, descarga, pagina
- Popup "Crear páginas": gratis crear, 500 BIT por archivo/link
- Popup "Agregar descarga": tipos free/solicitud/pago, aviso copyright
- MercadoPago: crear-preferencia acepta titulo+monto desde tienda
- Datos vendedor en anuncio según vis_personal (sin WhatsApp)
- Panel BIT Conexión en anuncio: visitantes + interesados IA con checkboxes y mensajes
- Costo mensajes: 1 BIT anuncio (emisor) + 1 BIT receptor
- Búsqueda IA: matching al guardar, notifica campanita, lista en perfil → Búsquedas
- Chat: notificación en campanita al recibir mensaje, link al anuncio en contexto
- Notificación conexion lleva al chat (con emisor_id)
- Toggle mostrar/ocultar en mapa para anuncios y nexos
- Eliminación nexo redirige a perfil sección empresa
- Panel admin nexo: sliders renombrados a "páginas"
- 3 tipos de acceso: libre (usuario paga), solicitud (creador elige quién paga), free (empresa paga)
- Crear empresa redirige a panel admin del nexo
- RLS configuradas: anuncio_visitas, busqueda_matches
- FK busqueda_matches ON DELETE CASCADE
- Toggle notificaciones WhatsApp eliminado de mis-anuncios y usuario

## Tablas nuevas / modificadas

- `busqueda_matches` (id uuid, busqueda_id uuid, usuario_id uuid, anuncio_id integer, bits_consumidos integer)
- `anuncios.mostrar_en_mapa` boolean DEFAULT true
- `nexos.mostrar_en_mapa` boolean DEFAULT true
- `busquedas_automaticas.config` jsonb
- `notificaciones.emisor_id` uuid

## Reglas de trabajo con Claude

1. Siempre archivos completos, nunca snippets parciales.
2. Siempre incluir comandos Git junto a cada cambio.
3. Respuestas directas. Sin explicaciones largas si no se piden.
4. Pedir el archivo antes de tocar código si no lo tenés en contexto.
5. Grupos se guardan en tabla nexos (tipo=grupo).
6. miembros_count no existe en nexos — se cuenta desde nexo_miembros en runtime.
7. telefono_empresa NO existe en tabla usuarios.

---

*Última actualización: 28 de marzo de 2026*
