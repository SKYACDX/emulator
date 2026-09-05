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
- [Prisma 7](https://www.prisma.io) + SQLite (`@prisma/adapter-better-sqlite3`)
- Auth propia con JWT en cookie httpOnly (bcrypt para contraseñas)
- Parcheo IPS/BPS/UPS implementado desde cero en TypeScript, ejecutado en el
  navegador del usuario (`src/lib/patchers/`)

## Requisitos

- Node.js 20+
- [pnpm](https://pnpm.io) (el proyecto usa `pnpm-workspace.yaml` para aprobar
  scripts de build nativos — no uses `npm install`, tuvo problemas de
  estabilidad durante el desarrollo)

## Puesta en marcha

```bash
pnpm install
pnpm exec prisma migrate dev   # crea prisma/dev.db y aplica el esquema
pnpm run seed                  # carga las plataformas (NES, SNES, GBA, DS, ...)
pnpm dev                       # http://localhost:3000
```

Variables de entorno (`.env`, ya incluido para desarrollo local):

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Ruta del archivo SQLite, ej. `file:./prisma/dev.db` |
| `JWT_SECRET` | Secreto para firmar las cookies de sesión |
| `PATCH_STORAGE_DIR` | Carpeta donde se guardan los archivos de parche subidos (`./storage/patches` por defecto) |
| `MAX_PATCH_SIZE_BYTES` | Tamaño máximo permitido por archivo de parche |

En producción, genera un `JWT_SECRET` nuevo y aleatorio, y considera mover
`PATCH_STORAGE_DIR` a un volumen persistente o un bucket compatible con S3.

## Estructura relevante

```
prisma/schema.prisma        Modelos: User, Platform, Game, Hack, Patch
src/lib/auth.ts             Sesión JWT (cookie httpOnly)
src/lib/storage.ts          Guardado/lectura de archivos de parche en disco
src/lib/patchers/           Implementación de IPS, BPS, UPS y CRC32 (cliente)
src/app/api/hacks           Crear hack + primera versión de parche
src/app/api/patches         Agregar nueva versión / descargar un parche
src/app/hacks/new           Formulario de publicación (requiere sesión)
src/app/patch               Herramienta de parcheo en el navegador
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
`adapter` explícito incluso para SQLite. Ver `src/lib/prisma.ts`, que usa
`@prisma/adapter-better-sqlite3`.
