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
| **UUID admin** | f9b23e04-c591-44bf-9efb-51966c30a083 |
| **Panel admin** | nexonet.ar/admin/login |
| **WhatsApp soporte** | 3413251818 |
| **Supabase project** | thehpvccubxzsnbtbzmz |


## Usuarios de prueba
| Usuario | UUID | Email | Referido por |
|---|---|---|---|
| Promotor01 | 089c5c33-b0ce-4d15-9a9e-1fde349a727e | promotor01@test.nexonet.ar | adrianmorra |
| Promotor02 | 794b719e-1706-48a1-bb87-bd0a76e9ab48 | promotor02@test.nexonet.ar | Promotor01 |
| Promotor03 | 34052276-6560-4d7a-85a0-a6afa75eafbb | promotor03@test.nexonet.ar | Promotor02 |

---

## Reglas de trabajo con Claude

1. Siempre archivos completos, nunca snippets parciales.
2. Siempre incluir comandos Git junto a cada cambio.
3. Respuestas directas. Sin explicaciones largas si no se piden.
4. Pedir el archivo antes de tocar código si no lo tenés en contexto.
5. Para dar instrucciones a Claude Code en terminal: `claude "instrucción en texto plano"`
6. Nunca usar PowerShell para instrucciones — siempre la terminal integrada de VS Code con Claude Code.
7. Antes de implementar, analizar TODAS las variables del problema.
8. No hacer consultas que ya fueron respondidas en la conversación.

---

## Errores frecuentes ya resueltos — NO repetir

| Error | Causa | Solución correcta |
|---|---|---|
| Columna `codigo_nexo` no existe | La columna se llama `codigo` en tabla usuarios | Siempre usar `codigo` |
| `telefono_empresa` no existe | No existe en tabla usuarios | No usar |
| `miembros_count` no existe en nexos | Se cuenta desde `nexo_miembros` en runtime | COUNT desde nexo_miembros |
| Update directo a Supabase desde admin no dispara comisiones | asignarBit en admin hacía update directo | Siempre llamar a `/api/admin/asignar-bit` |
| Link referido usa URL de Vercel | `window.location.origin` toma el dominio activo | Hardcodeado a `https://nexonet.ar` + useEffect |
| Preview URL de Vercel redirige a login | — | `src/middleware.ts` hace redirect 301 a nexonet.ar |
| Sliders con costo 50 BIT | Bug corregido | Sliders/páginas son GRATIS |
| `bits_promotor` no existe | Columna inexistente | Usar `bits_promo` siempre |
| `codigo_nexo` no existe | Columna inexistente | Usar `codigo` siempre |
| FK error al eliminar nexo | `notificaciones.nexo_id` tiene FK | Supabase tiene ON DELETE SET NULL en esa FK |
| UUID admin cambió | Usuario Auth fue recreado | UUID nuevo: f9b23e04-c591-44bf-9efb-51966c30a083 |

---

## Arquitectura de BIT

### Tipos y columnas en tabla `usuarios`
| Tipo | Columna | Descripción |
|-