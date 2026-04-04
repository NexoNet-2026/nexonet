# NexoNet — Contexto para Claude

> Pegá este archivo al inicio de cada nuevo chat para restaurar el contexto completo del proyecto.
> También subí el nexonet-contexto.txt (exportado con exportar-nexonet.ps1) para que Claude tenga acceso al código.

---

## Datos del proyecto

| Campo | Valor |
|---|---|
| **App** | NexoNet — nexonet.ar |
| **Stack** | Next.js + TypeScript + Tailwind CSS |
| **Backend** | Supabase (DB + Storage + Auth) |
| **Repo** | GitHub: NexoNet-2026/nexonet (público) |
| **Deploy** | Vercel Hobby — branch: master |
| **Dev** | Adrian — solo developer — Roldán, Santa Fe |

## Datos del admin

| Campo | Valor |
|---|---|
| **Usuario admin** | adrianmorra / adrianmorra@gmail.com |
| **Código usuario** | NAN-5194178 |
| **UUID admin** | ab56253d-b92e-4b73-a19a-3cd0cd95c458 |
| **Panel admin** | nexonet.ar/admin/login |
| **WhatsApp soporte** | 3413251818 |
| **Supabase project** | thehpvccubxzsnbtbzmz |

---

## Reglas de trabajo con Claude

1. Siempre archivos completos, nunca snippets parciales.
2. Siempre incluir comandos Git junto a cada cambio.
3. Respuestas directas. Sin explicaciones largas si no se piden.
4. Pedir el archivo antes de tocar código si no lo tenés en contexto.
5. Para dar instrucciones a Claude Code en terminal: `claude "instrucción en texto plano"`
6. Nunca usar PowerShell para instrucciones — siempre la terminal integrada de VS Code con Claude Code.

---

## Errores frecuentes ya resueltos — NO repetir

| Error | Causa | Solución correcta |
|---|---|---|
| Columna `codigo_nexo` no existe | La columna se llama `codigo` en tabla usuarios | Siempre usar `codigo` |
| `telefono_empresa` no existe | No existe en tabla usuarios | No usar |
| `miembros_count` no existe en nexos | Se cuenta desde nexo_miembros en runtime | COUNT desde nexo_miembros |
| Update directo a Supabase desde admin no dispara comisiones | asignarBit en admin hacía update directo | Siempre llamar a `/api/admin/asignar-bit` |
| Link referido usa URL de Vercel | `window.location.origin` toma el dominio activo | Hardcodeado a `https://nexonet.ar` + useEffect |
| Preview URL de Vercel redirige a login | — | `src/middleware.ts` hace redirect 301 a nexonet.ar |
| Sliders con costo 50 BIT | Bug corregido | Sliders/páginas son GRATIS |

---

## Arquitectura de BIT

### Tipos y columnas en tabla usuarios

| Tipo | Columna | Descripción |
|---|---|---|
| 🟡 BIT Nexo | `bits` | Comprados con dinero real via MercadoPago |
| 🔵 BIT Free | `bits_free` | Gratuitos — 3.000 al registro + devueltos por mensualidad |
| 🟢 BIT Promo | `bits_promo` | Ganados como promotor |
| — | `bits_promotor_total` | Histórico total acumulado como promotor |
| — | `bits_saldo` | Saldo total calculado |

### Qué BIT acepta cada acción

| Acción | BIT Nexo | BIT Free | BIT Promo |
|---|---|---|---|
| Publicar anuncio / renovar | ✅ | ✅ | ✅ |
| Crear empresa/servicio (mensualidad) | ✅ | ✅ | ✅ |
| Unirse a grupo | ✅ | ✅ | ✅ |
| Ser admin de grupo | ✅ | ✅ | ✅ |
| Búsqueda IA (por match) | ✅ | ✅ | ✅ |
| Conexión con anuncio | ✅ | ✅ | ✅ |
| Flash mensaje | ✅ | ✅ | ✅ |
| Pagar descarga de otro usuario | ✅ | ❌ | ✅ |

### Tracking de gasto (columnas en tabla usuarios)

| Columna | Qué trackea |
|---|---|
| `bits_gastados_anuncios` | Crear/renovar anuncios |
| `bits_gastados_empresa` | Crear/renovar empresas ⚠️ columna nueva |
| `bits_gastados_servicio` | Crear/renovar servicios ⚠️ columna nueva |
| `bits_gastados_trabajo` | Crear busco trabajo ⚠️ columna nueva |
| `bits_gastados_grupo` | Unirse a grupos + pagar admin |
| `bits_gastados_link` | Habilitar links en anuncios |
| `bits_gastados_adjuntos` | Habilitar adjuntos y descargas |
| `bits_gastados_conexion` | Conexiones desde mapa |
| `bits_gastados_busquedas` | Búsquedas IA |
| `bits_gastados_flash` | Mensajes flash ⚠️ columna nueva |

---

## Sistema de Promotores

### Reglas de comisión

- **20%** para cualquier promotor normal
- **30%** para NAN-5194178 (adrianmorra — socio principal)
- **Cascada ilimitada**: mientras loop hasta que comisión llegue a 0 o no haya referido_por
- **Anti-ciclos**: Set de visitados en el loop
- Comisión se acredita en `bits_promo` y `bits_promotor_total`

### Cuándo se dispara comisión

- `src/app/api/admin/asignar-bit/route.ts` — obsequio manual desde admin
- `src/app/api/mp/webhook/route.ts` — compra via MercadoPago
- `src/app/nexo/[id]/page.tsx` función `pagarDescarga` — descarga paga

### Promotor default

- Registros sin código → `referido_por = ab56253d-b92e-4b73-a19a-3cd0cd95c458`
- adrianmorra recibe 1.500 BIT Promo como bonus de bienvenida por cada nuevo usuario

### Reintegro

- Mínimo 100.000 BIT Promo acumulados
- Factura A con IVA a NexoNet Argentina
- Se solicita desde perfil → tab Promotor

---

## Lógica de negocio — Grupos

### Tipos de acceso

| Tipo | Descripción | Puede rechazar el admin |
|---|---|---|
| Libre | Cualquiera se une pagando | ❌ No puede rechazar |
| Con aprobación | Admin aprueba primero, luego se cobra | ✅ Sí (no se devuelve nada porque aún no se cobró) |
| Free | El creador absorbe el costo | — |

### Flujo unirse a grupo con aprobación

1. Usuario solicita → estado `pendiente`
2. Admin aprueba → estado `activo` (o rechaza)
3. Si aprueba → usuario paga 500 BIT → membresía activa por 30 días

### Flujo ser admin de grupo

1. Usuario solicita → rol `admin_solicitado`
2. Admin aprueba → rol `admin_pago_pendiente`
3. Usuario ve banner dorado y paga 500 BIT → rol `admin`
4. Costo mensual: 500 BIT/mes pagado por el propio admin (NO por el grupo)

### Descargas en grupos/empresas/servicios

- Disponible en: Grupos, Empresas, Servicios
- Tipos: gratuita / por solicitud / paga
- Pago con BIT Nexo o BIT Promo (NO BIT Free)
- Distribución: 90% al creador (BIT Promo) + 10% a NexoNet
- Cascada de comisiones se aplica sobre el 90% que recibe el creador

---

## Lógica de negocio — Empresa y Servicio

### Costos

- 1er mes: GRATIS (trial)
- Renovación: 10.000 BIT/mes → se devuelven como 10.000 BIT Free al usuario
- Páginas/sliders: GRATIS (ilimitadas)
- Adjuntos dentro de una página: 500 BIT/mes por adjunto

---

## Estructura de archivos clave

### APIs (src/app/api/)

| Archivo | Función |
|---|---|
| `admin/asignar-bit/route.ts` | Asignación manual BIT + cascada de comisiones |
| `mp/crear-preferencia/route.ts` | Crear preferencia de pago MercadoPago |
| `mp/webhook/route.ts` | Webhook MP: acredita BIT + dispara cascada |
| `registro/completar/route.ts` | Registro usuario + promotor default |
| `busqueda-ia/match/route.ts` | Matching búsquedas IA |

### Páginas principales (src/app/)

| Archivo | Función |
|---|---|
| `admin/page.tsx` | Panel admin — tabs: Panel, Usuarios, Anuncios, Nexos, Mensajes, Promotores, Pagos, Alarmas |
| `promotor/page.tsx` | Panel promotor del usuario |
| `nexo/[id]/page.tsx` | Página de nexo — unirse, descargas, pagar admin |
| `nexo/[id]/admin/page.tsx` | Admin de nexo — sliders, miembros, config |
| `nexo/crear/[tipo]/page.tsx` | Crear nexo por tipo (anuncio/empresa/servicio/trabajo/grupo) |
| `usuario/page.tsx` | Perfil — saldo BIT, gráfico de gasto, búsquedas, stats |
| `mis-anuncios/page.tsx` | Lista de anuncios del usuario + links + adjuntos |
| `buscar/page.tsx` | Buscador principal |
| `mapa/page.tsx` | Mapa con anuncios y nexos |
| `publicar/page.tsx` | Publicar anuncio rápido |

### Componentes (src/components/)

| Archivo | Función |
|---|---|
| `PopupCompra.tsx` | Popup genérico de compra — acepta `bits: {free, nexo, promo}` |
| `Header.tsx` | Header con campana de notificaciones |
| `BottomNav.tsx` | Navegación inferior |
| `AyudaPopup.tsx` | Popup de ayuda contextual por tipo |
| `BannerPromotor.tsx` | Banner compartible del promotor |
| `nexo/FlashEnvio.tsx` | Envío de mensajes flash |

### Otros

| Archivo | Función |
|---|---|
| `src/middleware.ts` | Redirect de preview URL Vercel → nexonet.ar (301) |
| `src/lib/supabase.ts` | Cliente Supabase |
| `src/lib/matchBusquedas.ts` | Lógica de matching automático búsquedas IA |

---

## Tablas DB principales

| Tabla | Columnas importantes |
|---|---|
| `usuarios` | id, codigo, nombre, bits, bits_free, bits_promo, bits_promotor_total, referido_por, es_admin, es_bot, is_interno |
| `anuncios` | id, usuario_id, titulo, subrubro_id, estado, mostrar_en_mapa, fecha_vencimiento |
| `nexos` | id, usuario_id, tipo (empresa/servicio/grupo/trabajo), titulo, estado, mostrar_en_mapa, tipo_acceso |
| `nexo_miembros` | id, nexo_id, usuario_id, rol (creador/admin/moderador/miembro/admin_solicitado/admin_pago_pendiente), estado, vence_el |
| `nexo_sliders` | id, nexo_id, tipo, titulo, emoji, orden |
| `nexo_slider_items` | id, nexo_id, slider_id, tipo, titulo, precio, archivo_url, vence_el |
| `busquedas_automaticas` | id, usuario_id, texto, config jsonb, activa |
| `busqueda_matches` | id, busqueda_id, usuario_id, anuncio_id, bits_consumidos — FK ON DELETE CASCADE |
| `notificaciones` | id, usuario_id, tipo, mensaje, leida, emisor_id uuid |
| `anuncio_visitas` | id, anuncio_id, usuario_id, created_at |
| `pagos` | id, usuario_id, monto, tipo, estado |
| `solicitudes_reembolso_promotor` | id, usuario_id, bits_cantidad, estado |

### Columnas booleanas importantes

- `anuncios.mostrar_en_mapa` — boolean DEFAULT true
- `nexos.mostrar_en_mapa` — boolean DEFAULT true
- `usuarios.es_admin` — acceso al panel admin
- `usuarios.es_bot` — usuarios bot para contenido semilla
- `usuarios.is_interno` — usuarios internos

---

## Precios y costos (resumen definitivo)

| Concepto | Costo |
|---|---|
| Empresa/Servicio — 1er mes | GRATIS |
| Empresa/Servicio — renovación | 10.000 BIT/mes (se devuelven como BIT Free) |
| Anuncio — renovación | 500 BIT/mes |
| Páginas/sliders en nexo | GRATIS |
| Adjunto dentro de una página | 500 BIT/mes |
| Unirse a grupo | 500 BIT/mes |
| Ser admin de grupo | 500 BIT/mes (lo paga el admin) |
| Conexión con anuncio | 1 BIT emisor + 1 BIT receptor |
| Flash mensaje | 1 BIT por destinatario |
| Búsqueda IA por match | 1 BIT |
| Pagar descarga | Precio del creador (BIT Nexo o Promo) |

---

## Notificaciones — canales

- **Push nativa**: todos los eventos importantes
- **Email**: vencimientos (3 días y 1 día antes) via Resend / notificaciones@nexonet.ar
- **Chat interno**: todos los eventos — campana en header
- **WhatsApp soporte**: botón manual — 3413251818

---

## Cómo exportar el código para nuevas conversaciones

Ejecutar en terminal de VS Code:
```
.\exportar-nexonet.ps1
```
Genera `nexonet-contexto.txt` en Descargas. Si es muy grande, particionar:
```
.\partir-nexonet.ps1
```
Genera `nexonet-parte1.txt` y `nexonet-parte2.txt`.

---

*Última actualización: 4 de abril de 2026*
