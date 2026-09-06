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

## Archivos de la comunidad (`/files`)

Además de los parches (ligados a un hack), hay una sección de archivos
generales sin restricción de tipo — capturas, guías, savestates, assets,
etc. — pensada para que la comunidad comparta lo que necesite sin tener que
crear un hack falso solo para subir algo.

Dos bloqueos automáticos en `src/lib/fileTypes.ts` (por extensión, aplican
sin importar el tipo de archivo que se declare):

- **Videos** (`.mp4`, `.mkv`, `.avi`, `.webm`, ...): para no volar el
  almacenamiento gratuito de R2 con archivos pesados.
- **Volcados de ROM/ISO** (`.nds`, `.gba`, `.sfc`, `.nsp`, `.xci`, `.iso`,
  ...): el único tipo de archivo que representa el riesgo legal real de
  esta plataforma, así que se bloquea aquí también aunque la sección sea
  "de tipo libre".

Todo lo demás se permite sin filtro. La moderación de lo que sí se sube es
manual: cualquier admin puede eliminar cualquier archivo desde `/files` (el
botón "Eliminar" aparece para el dueño del archivo y para admins).

La subida va **directo del navegador a R2** (URL prefirmada vía
`POST /api/files/presign`), sin pasar por la función serverless de Vercel —
por eso no está limitada a los ~4.5 MB de Vercel Hobby como los parches
(tope configurable con `MAX_SHARED_FILE_SIZE_BYTES`, 200 MB por defecto).
Esto requiere CORS configurado en el bucket de R2 para `PUT`/`GET`/`HEAD`
desde el dominio del sitio (y `localhost:3000` para desarrollo) — si creas
un bucket nuevo, configúralo con `PutBucketCorsCommand` del SDK de S3 antes
de probar la subida.

### Público / privado

Cada archivo se sube como **público** (cualquiera lo ve en `/files` y lo
puede descargar) o **privado** (solo el dueño y los admins lo ven en la
lista y pueden descargarlo — para cualquier otra persona, `GET
/api/files/<id>/download` devuelve 404 en vez de 403, para no revelar ni
la existencia del archivo). Los admins ven todos los archivos, públicos o
privados, para poder moderar.

**El bloqueo de extensiones de video/ROM se aplica sin excepción, incluso
a administradores** — no es una restricción de UX, es la salvaguarda legal
de la que depende todo el proyecto (ver "Modelo legal" arriba).

## Portadas de juegos

Al crear un hack o etiquetar un archivo con un juego, hay un botón "Buscar
portada" que consulta [TheGamesDB](https://thegamesdb.net) (`src/lib/thegamesdb.ts`)
y deja elegir entre las miniaturas encontradas. Importante:

- Solo se **guarda la URL** de la imagen (en el CDN de TheGamesDB); nunca se
  descarga ni se re-aloja en nuestro R2. `isAllowedCoverUrl()` rechaza
  cualquier URL que no apunte a `cdn.thegamesdb.net`, así que no se puede
  usar este campo para inyectar una URL arbitraria vía la API.
- La portada de un `Game` se fija una sola vez (al crear el primer hack para
  ese juego); hacks posteriores del mismo juego no la sobreescriben.
- Un archivo de `/files` puede tener su propia portada independiente, ya
  que su `gameTitle` es texto libre y no está ligado a un `Game` real.
- La ruta `/api/games/search-cover` requiere sesión (evita gastar la cuota
  gratuita de la API con tráfico anónimo) y mantiene el `TGDB_API_KEY` en
  el servidor — nunca se expone al navegador.

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
   | `DATABASE_URL` | Connection string de Postgres (Neon, **pooled**) — la usa la app en runtime |
   | `DIRECT_DATABASE_URL` | Connection string **directa** (sin `-pooler` en el host) — solo la usa `prisma migrate`, porque el pooler de Neon no soporta los advisory locks que necesita |
   | `JWT_SECRET` | Secreto para firmar las cookies de sesión (genera uno nuevo con `openssl rand -hex 32`) |
   | `TOTP_ENCRYPTION_KEY` | Clave de 32 bytes en hex para cifrar los secretos TOTP en la base de datos (genera uno nuevo con `openssl rand -hex 32`) |
   | `R2_ACCOUNT_ID` | ID de cuenta de Cloudflare (aparece en la URL del dashboard) |
   | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Credenciales del API token de R2 |
   | `R2_BUCKET_NAME` | Nombre del bucket creado |
   | `MAX_PATCH_SIZE_BYTES` | Tamaño máximo por archivo de parche (4 MB por defecto, ver nota de Vercel abajo) |
   | `TGDB_API_KEY` | API key gratuita de [TheGamesDB](https://thegamesdb.net/member/apikey) — usada para buscar portadas de juegos |

4. Instala dependencias y aplica el esquema:

   ```bash
   pnpm install
   pnpm exec prisma migrate dev   # aplica el esquema a tu base de Neon
   pnpm run seed                  # carga las plataformas (NES, SNES, GBA, DS, ...)
   pnpm dev                       # http://localhost:3000
   ```

5. Regístrate normalmente en la web y luego promuévete a administrador
   (no hay forma de hacerlo desde la UI, a propósito):

   ```bash
   pnpm exec tsx prisma/make-admin.ts tu@correo.com
   ```

   Con el rol `ADMIN` aparece un enlace "Admin" en la barra de navegación,
   que lleva a `/admin`: ahí puedes eliminar cualquier hack (borra también
   sus archivos de R2) y gestionar usuarios (promover/degradar admins,
   eliminar cuentas junto con sus hacks).

## Verificación en dos pasos (2FA / TOTP)

Cualquier usuario puede activar 2FA desde `/me/security` (compatible con
Google Authenticator, Authy, 1Password, etc.):

- El secreto se genera con [`otplib`](https://www.npmjs.com/package/otplib)
  y se cifra con AES-256-GCM (`src/lib/totp.ts`) antes de guardarse — nunca
  queda en texto plano en la base de datos.
- Activar 2FA requiere escanear un QR y confirmar con un código válido
  (`/api/auth/totp/setup` → `/api/auth/totp/confirm`).
- Con 2FA activo, `POST /api/auth/login` ya no abre sesión directamente:
  devuelve `{ requiresTotp: true, pendingToken }` (token de 5 minutos), y
  hay que llamar a `/api/auth/totp/verify-login` con el código para
  completar el inicio de sesión.
- Desactivar 2FA (`/api/auth/totp/disable`) exige contraseña **y** un
  código válido, para que no baste con robar solo la sesión activa.

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

Implementado en `src/components/AdSlot.tsx`, con dos redes en cascada:

1. **[EthicalAds](https://www.ethicalads.io)** primero — anuncios de texto
   pequeños, sin tracking agresivo, pensados para sitios de comunidad.
2. **[Google AdSense](https://www.google.com/adsense)** como respaldo —
   solo se muestra si EthicalAds no tiene inventario para esa carga (se le
   da ~2s a EthicalAds para llenar su div; si no lo hace, se activa AdSense).

Ambas son opcionales de forma independiente vía variables de entorno — si
ninguna está configurada, `<AdSlot />` no renderiza nada:

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_ETHICALADS_PUBLISHER_ID` | Publisher ID que da EthicalAds al aprobar tu sitio |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Tu ID de cliente de AdSense (`ca-pub-...`) |
| `NEXT_PUBLIC_ADSENSE_SLOT_ID` | ID del bloque de anuncio específico (se crea dentro de AdSense, después de la aprobación del sitio) |

El script de carga de AdSense (`adsbygoogle.js`) se inyecta en el `<head>`
de **todas** las páginas desde `src/app/layout.tsx` en cuanto
`NEXT_PUBLIC_ADSENSE_CLIENT_ID` está configurado — es el requisito de Google
para verificar el sitio, independiente de si `<AdSlot />` termina mostrando
un anuncio de AdSense o no. `src/app/ads.txt/route.ts` genera el
`ads.txt` requerido automáticamente a partir del mismo ID.

`<AdSlot />` está colocado en dos sitios poco intrusivos: la página de
inicio (debajo de la intro) y el detalle de cada hack (debajo de la
descripción, antes de la lista de versiones).

## API pública (para el emulador u otros clientes)

Endpoints de solo lectura, sin autenticación, pensados para que una app
externa (ej. un emulador) busque hacks y descargue parches directamente —
CORS abierto (`Access-Control-Allow-Origin: *`), útil tanto desde apps
nativas/React Native (que no aplican CORS) como desde el navegador.

| Endpoint | Descripción |
| --- | --- |
| `GET /api/v1` | Info de la API y enlaces a cada endpoint (autodescriptivo) |
| `GET /api/v1/platforms` | Lista de plataformas: `{ platforms: [{ slug, name }] }` |
| `GET /api/v1/games?platform=<slug>&q=<texto>&limit=&offset=` | Juegos, filtrables por plataforma y/o búsqueda de texto en el título |
| `GET /api/v1/hacks?game=<slug>&platform=<slug>&q=<texto>&limit=&offset=` | Hacks (con sus parches y `downloadUrl` listo para usar), filtrables por juego, plataforma y/o texto en el título |
| `GET /api/v1/hacks/<slug>` | Detalle de un hack específico |
| `GET /api/patches/<id>/download` | Redirige (307) a una URL firmada de R2 válida por 5 minutos — descarga el archivo de parche directo |

`games` y `hacks` devuelven paginación: `{ ..., pagination: { limit, offset, total, hasMore } }`.
`limit` por defecto es 20 (máximo 50); usa `offset` para pedir la siguiente página.
Las respuestas exitosas llevan `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
(cacheables por CDN/cliente ~1 min); los errores van con `no-store`.

No hay autenticación ni rate limiting en estos endpoints todavía — si el uso
crece, considera añadir un límite de requests por IP (ej. con Upstash Redis,
que también tiene capa gratuita).

Ejemplo de flujo típico desde un emulador: el usuario elige su plataforma →
`GET /api/v1/games?platform=gba` → elige su juego → `GET /api/v1/hacks?game=<slug>`
→ el usuario elige un parche → `fetch(patch.downloadUrl)` para obtener los
bytes → aplicar el parche (mismo algoritmo IPS/BPS/UPS que hay en
`src/lib/patchers/`, son ~200 líneas de TS sin dependencias, fácil de portar)
sobre la ROM que el usuario ya tiene cargada, todo en memoria, sin que este
servidor vea la ROM en ningún momento.

## SEO

Para que Google (y otros buscadores) indexen el sitio y muestren buenos
snippets:

- **Metadatos por página** (`generateMetadata` en `/hacks/[slug]` y
  `/platforms/[slug]`, `metadata` estático en el resto): título,
  descripción (tomada del texto real del hack, recortada a 160
  caracteres), URL canónica, y Open Graph/Twitter con la portada del
  juego como imagen si existe.
- **Datos estructurados (JSON-LD)** en cada página de hack, tipo
  `SoftwareApplication`, para que Google pueda mostrar resultados
  enriquecidos (rich results).
- **`/sitemap.xml`** (`src/app/sitemap.ts`) generado dinámicamente desde
  la base de datos: incluye cada plataforma y cada hack. Como es
  dinámico, no hay que regenerarlo a mano al publicar contenido nuevo.
- **`/robots.txt`** (`src/app/robots.ts`) permite indexar todo excepto
  `/admin`, `/me`, `/login`, `/register` y `/api/`.

Esto es todo lo que se puede hacer desde el código. Para que realmente
aparezca en resultados de búsqueda, falta un paso que solo tú puedes
hacer (requiere verificar que eres dueño del dominio):

1. Entra a [Google Search Console](https://search.google.com/search-console),
   agrega la propiedad `https://www.emulatornds.online` (verificación por
   DNS o subiendo un archivo HTML — Vercel deja hacer ambas).
2. Envía `https://www.emulatornds.online/sitemap.xml` en la sección
   "Sitemaps" — así Google encuentra y rastrea todas las páginas de una
   vez, en vez de esperar a encontrarlas solo.
3. (Opcional) Repite el proceso en [Bing Webmaster Tools](https://www.bing.com/webmasters).

No hay forma de "forzar" que algo aparezca como sugerencia de autocompletado
del buscador — eso lo decide el buscador según qué tan indexado y buscado
esté el sitio con el tiempo; lo de arriba es lo que maximiza esa
probabilidad.

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
