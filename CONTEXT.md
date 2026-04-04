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

## Estado funcional — ✅ Resuelto sesiones anteriores

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

## ✅ Resuelto — 4 abril 2026

### Infraestructura
- Middleware redirect: nexonet-git-master-...vercel.app → nexonet.ar (src/middleware.ts)
- Cache-Control: no-store, no-cache, must-revalidate en next.config.ts headers
- linkReferido en promotor/page.tsx usa https://nexonet.ar hardcodeado (no window.location.origin)
- linkReferido se calcula en useEffect, no en render (evita cache de bundle)

### Comisión en cascada ilimitada
- While loop con Set anti-ciclos en 3 puntos: asignar-bit API, webhook MercadoPago, descargas en nexo
- 30% para NAN-5194178, 20% para el resto, sobre la comisión del nivel anterior
- Notificación con nombre del referido y nivel: "⭐ Recibiste X BIT Promo de comisión por tu referido [nombre] (nivel N)"
- Se detiene cuando comisión llega a 0 o no hay más referido_por
- Archivos: src/app/api/admin/asignar-bit/route.ts, src/app/api/mp/webhook/route.ts, src/app/nexo/[id]/page.tsx

### Promotor y referidos
- Registro sin código de promotor asigna referido_por = adrianmorra (ab56253d...) por default
- asignarBit en admin llama a API /api/admin/asignar-bit en vez de update directo (activa comisión)
- Texto WhatsApp promotor: "Registrate en NexoNet con mi codigo [X] y empeza con 3.000 BIT gratis 🎁"
- Columna DB es `codigo` (no `codigo_nexo`) — codigo_nexo no existe en tabla usuarios

### Panel admin
- Dashboard: contadores por tipo de nexo (empresa/servicio/grupo/trabajo activos/total), descargas, links, mensajes totales
- Tab Promotores: árbol jerárquico expandible con niveles, top-level = promotores sin referido_por promotor
- Referidos expandibles muestran nombre, código, fecha, saldos (💛💙🟢)
- Múltiples nodos expandibles a la vez (Set)
- bits_promo 🟢 visible en tarjeta de cada usuario

### Grupos
- BIT Free habilitado para unirse a grupo (PopupCompra muestra saldo free)
- BIT Free habilitado para pagar admin en grupo (confirmarPagoAdmin acepta bit_free)
- Cascada ilimitada en comisión por unirse a grupo (reemplaza comisión fija al dueño)

### Formulario crear anuncio
- Filtros dinámicos de subrubro excluyen "precio" y "descripcion" para evitar duplicados con campos principales
- Aplica en ambas secciones (sin sliders y con sliders) de src/app/nexo/crear/[tipo]/page.tsx

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

*Última actualización: 4 de abril de 2026*
