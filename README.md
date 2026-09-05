# RomHack Hub

Plataforma para publicar y descubrir ROM hacks de consolas retro (NES, SNES,
N64, Game Boy, GBA, DS, 3DS, Switch).

## Modelo legal: solo parches, nunca ROMs

Este sitio **solo aloja archivos de parche** (`.ips`, `.bps`, `.ups`, `.xdelta`),
nunca la ROM completa de un juego. Distribuir una ROM con copyright —modificada
o no— es una infracción de derechos de autor. El modelo de parches es el que
usan comunidades como RomHacking.net:

1. El autor del hack sube únicamente el parche (la diferencia entre el juego
   original y el juego modificado).
2. Quien lo descarga usa su **propia copia legal** del juego original y aplica
   el parche con la herramienta de parcheo en `/patch`, que corre 100% en el
   navegador (nada se sube al servidor).

No subas archivos de ROM completos: serán eliminados.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS 4)
- [Prisma 7](https://www.prisma.io) + PostgreSQL (`@prisma/adapter-pg`)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible) para
  los archivos de parche subidos — descargas vía URL firmada, sin pasar por
  el servidor
- Auth propia con JWT en cookie httpOnly (bcrypt para contraseñas)
- Parcheo IPS/BPS/UPS implementado desde cero en TypeScript, ejecutado en el
  navegador del usuario (`src/lib/patchers/`)

Este stack está elegido para poder desplegarse gratis en Vercel: sin disco
local persistente ni base de datos con estado en el propio servidor.

## Requisitos

- Node.js 20+
- [pnpm](https://pnpm.io) (el proyecto usa `pnpm-workspace.yaml` para aprobar
  scripts de build nativos — no uses `npm install`, tuvo problemas de
  estabilidad durante el desarrollo)
- Una base de datos Postgres (gratis en [Neon](https://neon.tech))
- Un bucket de [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2)
  (10 GB gratis/mes, sin costo de egreso)

## Puesta en marcha

1. Crea un proyecto en [neon.tech](https://neon.tech) y copia el
   **connection string pooled** (incluye `-pooler` en el host).
2. Crea un bucket en Cloudflare R2 y un API token con permiso de
   lectura/escritura sobre ese bucket (Dashboard → R2 → Manage API Tokens).
3. Copia `.env.example`-como valores en `.env` (ya incluido) con tus propias
   credenciales:

   | Variable | Descripción |
   | --- | --- |
   | `DATABASE_URL` | Connection string de Postgres (Neon, pooled) |
   | `JWT_SECRET` | Secreto para firmar las cookies de sesión (genera uno nuevo con `openssl rand -hex 32`) |
   | `R2_ACCOUNT_ID` | ID de cuenta de Cloudflare (aparece en la URL del dashboard) |
   | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Credenciales del API token de R2 |
   | `R2_BUCKET_NAME` | Nombre del bucket creado |
   | `MAX_PATCH_SIZE_BYTES` | Tamaño máximo por archivo de parche (4 MB por defecto, ver nota de Vercel abajo) |

4. Instala dependencias y aplica el esquema:

   ```bash
   pnpm install
   pnpm exec prisma migrate dev   # aplica el esquema a tu base de Neon
   pnpm run seed                  # carga las plataformas (NES, SNES, GBA, DS, ...)
   pnpm dev                       # http://localhost:3000
   ```

## Desplegar gratis en Vercel

1. Sube el repo a GitHub y [importa el proyecto en Vercel](https://vercel.com/new)
   (detecta Next.js automáticamente, no hace falta configuración adicional).
2. En **Project Settings → Environment Variables**, agrega las mismas
   variables del paso anterior (`DATABASE_URL`, `JWT_SECRET`, `R2_*`,
   `MAX_PATCH_SIZE_BYTES`).
3. Antes del primer deploy (o en un paso de build), aplica las migraciones a
   la base de producción: `pnpm exec prisma migrate deploy` (puedes correrlo
   localmente apuntando a la misma `DATABASE_URL` de producción, o agregarlo
   como build command en Vercel).
4. Deploy. El plan gratuito de Vercel no "duerme" como Railway/Render y no
   requiere tarjeta de crédito.

**Límite importante**: el plan Hobby de Vercel acepta cuerpos de request de
hasta ~4.5 MB en funciones serverless. Por eso `MAX_PATCH_SIZE_BYTES` está en
4 MB por defecto — la gran mayoría de parches IPS/BPS/UPS pesan mucho menos,
pero un parche xdelta muy grande podría no caber. Si eso es un problema,
considera subir el parche directamente a R2 desde el navegador con una URL
prefirmada de subida en vez de pasar por la función serverless (no
implementado todavía).

### Anuncios no invasivos

Si quieres monetizar sin ser intrusivo, dos opciones que encajan con un sitio
de comunidad/desarrolladores:

- [Google AdSense](https://adsense.google.com) — banners está­ticos discretos
  (sidebar, entre la lista de hacks). Requiere aprobación y contenido real.
- [EthicalAds](https://www.ethicalads.io) / [Carbon Ads](https://www.carbonads.net) —
  anuncios de texto pequeños sin tracking agresivo, pensados para sitios de
  developers.

## Estructura relevante

```
prisma/schema.prisma        Modelos: User, Platform, Game, Hack, Patch
src/lib/auth.ts             Sesión JWT (cookie httpOnly)
src/lib/prisma.ts           Cliente Prisma con el driver adapter de Postgres
src/lib/storage.ts          Subida a R2 y generación de URLs de descarga firmadas
src/lib/patchers/           Implementación de IPS, BPS, UPS y CRC32 (cliente)
src/app/api/hacks           Crear hack + primera versión de parche
src/app/api/patches         Agregar nueva versión / descargar un parche
src/app/hacks/new           Formulario de publicación (requiere sesión)
src/app/patch                Herramienta de parcheo en el navegador
```

## Notas sobre Next.js 16

Este proyecto usa Next.js 16, cuya API difiere de versiones anteriores en
puntos que vale la pena tener presentes al modificar el código:

- `params` y `searchParams` son `Promise` tanto en Server Components como en
  Route Handlers (`const { slug } = await params`).
- El middleware se renombró a `proxy.ts` (no se usa en este proyecto).
- `cacheComponents` (PPR / `use cache`) está deshabilitado a propósito: la app
  necesita datos dinámicos por request.

## Prisma 7: driver adapter obligatorio

Prisma 7 ya no incluye un motor de conexión por defecto: hace falta pasar un
`adapter` explícito. Ver `src/lib/prisma.ts`, que usa `@prisma/adapter-pg`
contra el connection string de Neon.
