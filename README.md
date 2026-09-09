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
manual, con dos capas:

1. **Admin puede eliminar directamente** — el botón "Eliminar" en `/files`
   aparece para el dueño del archivo y para admins.
2. **Reportes de la comunidad** — cualquier usuario (que no sea el dueño)
   puede darle "Reportar" a un archivo y elegir un motivo de una lista
   (contenido para adultos, copyright, violento, spam, malware, u "Otro"
   con texto libre). Los admins ven todos los archivos reportados en
   `/admin`, con el motivo y quién reportó, y pueden eliminar el archivo o
   descartar los reportes si no aplica. Un mismo usuario solo puede tener
   un reporte activo por archivo (reportar de nuevo actualiza el motivo,
   no duplica la fila).

No hay moderación automática de contenido explícito (por ejemplo,
detección de imágenes para adultos) — es una decisión consciente por
ahora: se optó por reportes de comunidad en vez de integrar un servicio
de terceros de moderación de imágenes.

### Bloqueo de malware

Dos capas, en `src/lib/fileTypes.ts` y `src/lib/virustotal.ts`:

1. **Extensiones de ejecutables/scripts bloqueadas** (`.exe`, `.msi`,
   `.bat`, `.cmd`, `.scr`, `.ps1`, `.vbs`, `.js`, `.jar`, `.sh`, `.dll`,
   `.apk`, etc.) — igual que el bloqueo de video/ROM, sin excepción y sin
   costo de latencia.
2. **Escaneo real con [VirusTotal](https://www.virustotal.com)** (variable
   `VIRUSTOTAL_API_KEY`, opcional — sin ella, el escaneo simplemente se
   salta): antes de aceptar el archivo, se busca su SHA-256 en la base de
   VirusTotal (~70 motores antivirus); si es desconocido, se sube para
   análisis y se espera hasta ~12s a que termine. Si algún motor lo marca
   como malicioso, el archivo se borra de R2 y la subida se rechaza con
   400. Si el análisis no termina a tiempo (típico en archivos nuevos y
   únicos), el archivo se acepta igual con `virusScanStatus: "pending"` —
   se muestra una insignia "Escaneo pendiente" en `/files` para que
   cualquiera lo note. Esto es defensa en profundidad, no la única capa:
   el bloqueo de extensiones y los reportes de comunidad (motivo "Malware
   o archivo dañino") siguen aplicando siempre.

   Mientras un archivo está en `"pending"` o `"error"`, **la API pública
   (`/api/v1/files`) lo excluye por completo** (ni aparece en el listado ni
   en el detalle) y `GET /api/files/<id>/download` responde 404 para
   cualquiera que no sea el dueño o un admin/moderador — igual que con los
   archivos privados. El sitio web (`/files`) sí lo sigue mostrando a
   todos con la insignia, para que la comunidad pueda ver/moderar mientras
   tanto.

   Nada vuelve a consultar un `"pending"` por su cuenta — admins/moderadores
   tienen un botón "Reescanear" junto a la insignia (`POST
   /api/admin/files/<id>/rescan`) que repite la búsqueda por hash; si sigue
   pendiente hay que reintentar más tarde, y si VirusTotal ya lo marcó
   malicioso lo borra en el acto.

   Límite del nivel gratis de VirusTotal: solo escanea archivos de hasta
   32 MB (`maxScannableSizeBytes()`) — los más grandes se aceptan sin
   escanear (`virusScanStatus: "skipped"`).

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
   sus archivos de R2) y gestionar usuarios (promover/degradar roles,
   eliminar cuentas junto con sus hacks).

### Rol `MODERATOR`

Un tercer rol, más limitado que `ADMIN`, pensado para delegar la
moderación de contenido sin dar acceso a la gestión de usuarios ni a la
lista completa de hacks/archivos:

- Ve `/moderation` (enlace "Moderación" en la nav) — **solo** la lista de
  archivos reportados por la comunidad, con motivo y quién reportó.
- Puede eliminar el archivo reportado o descartar los reportes.
- **No** puede ver la lista de usuarios, otros admins/moderadores, ni
  gestionar hacks — `/admin` le redirige a `/` si lo intenta.

Solo un `ADMIN` puede asignar el rol `MODERATOR` (desde el selector de rol
en la tabla de usuarios de `/admin`) — no hay forma de auto-promoverse.

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

## Temas por usuario

Cada usuario logueado puede elegir un tema visual desde `/me` (persistido en
`User`, sincronizado entre dispositivos). Los temas están inspirados en
géneros de juegos de Nintendo (aventura, plataformas, espacial, carreras)
pero **usan solo colores e íconos originales dibujados a mano en
`src/lib/themes.tsx`** — ninguna imagen, sprite o logo oficial.

A diferencia de la primera versión (que solo cambiaba el color de los
botones), el tema ahora controla **todo el sitio**: fondo de página,
superficie de tarjetas/paneles, bordes, texto y el acento de botones/enlaces
destacados — todo vía variables CSS en `globals.css` (`[data-theme="..."]`
sobre `<html>`) y las clases utilitarias `bg-page`, `bg-surface`,
`border-base`, `text-base`, `text-muted`, `btn-accent`, `text-accent`, etc.
(en vez de clases fijas de Tailwind como `bg-neutral-900`). Agregar un tema
nuevo es agregar una entrada al arreglo `THEMES` + su bloque
`[data-theme="id"]` correspondiente en CSS.

### Tema personalizado

Además de los 5 presets, cualquier usuario puede crear su propio tema
("Personalizado") eligiendo 4 colores (fondo, superficie, acento, texto)
con selectores de color nativos del navegador. Estos valores son arbitrarios
por usuario, así que no tienen un bloque `[data-theme]` fijo en CSS — se
inyectan como `style` inline sobre `<html>` (`buildCustomThemeStyle()` en
`src/lib/themes.tsx`), validados en el servidor como hex de 6 dígitos antes
de guardarse (`PATCH /api/me/theme`).

Mientras se editan los 4 colores, se ven **aplicados al instante en toda la
página** (`applyLivePreview()` los escribe directo en `<html>` vía
`element.style.setProperty`) — nada se guarda hasta darle a "Guardar tema
personalizado". "Cancelar" (o salir de una vista previa) llama a
`clearLivePreview()` antes de refrescar: como esos estilos se escriben por
fuera del control de React, un simple re-render no basta para quitarlos si
el estado de reposo no tiene `style` inline (por ejemplo, cualquier tema
no-personalizado) — React solo limpia las propiedades que él mismo recuerda
haber puesto.

### Galería de temas de la comunidad (`/themes`)

Cualquier usuario con un tema personalizado activo puede compartirlo con un
nombre (`POST /api/community-themes`, tabla `CommunityTheme`). Otros
usuarios navegan `/themes`, hacen clic en una tarjeta para verla **aplicada
de inmediato como vista previa sin guardar** (mismo mecanismo de arriba), y
si les gusta le dan "Usar este tema" — eso copia esos 4 colores a su propio
tema personalizado (`theme=custom` + sus propios `customTheme*`), totalmente
editable después, desligado del original. El creador (o un admin) puede
borrar el tema de la galería.

## Multijugador (link cable) — `relay/`

Carpeta aparte, proyecto propio (no Next.js, no Vercel): un relay de
[PartyKit](https://www.partykit.io) para que dos jugadores intercambien o
combatan vía link cable emulado (ej. Pokémon), desplegado en
`wss://romhack-relay.skyacdx.partykit.dev`.

- Deliberadamente sin lógica de "crear sala" del lado del servidor: el
  código de sala es cualquier string que el cliente elija (ej. 6
  caracteres al azar) y comparta con el otro jugador por fuera — ambos se
  conectan al mismo WebSocket `wss://romhack-relay.skyacdx.partykit.dev/parties/main/<código>`.
- El servidor (`relay/party/server.ts`, ~20 líneas) no interpreta los
  bytes en absoluto: reenvía cada mensaje tal cual al otro conector en la
  sala — la semántica del protocolo de link cable la resuelve el núcleo
  del emulador de cada lado (mGBA, etc.), igual que ya hacen para
  multijugador por TCP/IP.
- Máximo 2 conexiones por sala (un cable link solo tiene dos puntas); un
  tercer intento de conexión se cierra con código `4000`.
- Sin autenticación ni base de datos — no depende de una cuenta de
  RomHack Hub, a propósito (YAGNI: nada lo pedía).

Desplegar cambios: `cd relay && npx partykit deploy`. Correr local:
`cd relay && npx partykit dev`.

### Por qué PartyKit y no algo en Vercel

Vercel Functions son de petición/respuesta corta — no sirven para una
conexión WebSocket persistente de baja latencia. PartyKit corre sobre la
red edge de Cloudflare (Durable Objects), escala sola según demanda sin
tocar código, y como el relay es un módulo autocontenido (no toca
usuarios/hacks/guardados de la base de datos principal), migrarlo a otra
cosa en el futuro —si hiciera falta— sería reescribir solo esta carpeta,
no una migración del resto del sitio.

## Mensajes (DMs y grupos)

`/messages`: solo texto, sin adjuntos — el modelo `Message` ni siquiera
tiene un campo de archivo, así que no hay forma de reintroducirlo por
accidente. Los links (a una comunidad, a la página, o cualquier http/https)
se detectan y se muestran como enlace clicable, nunca como HTML crudo.

- **DM**: requiere amistad aceptada (sección "Comunidades y amigos" más abajo).
- **Grupo**: cualquier usuario elige un nombre y arma el grupo con amigos;
  ya dentro, cualquier miembro puede agregar a alguien más por username.
- Actualización cada 3s por polling (no websocket) — consistente con el
  resto del sitio, que es serverless; el relay de multijugador es la única
  excepción porque necesita conexión persistente.

## Comunidades y amigos

`/communities`: cualquier usuario crea un grupo (nombre único → slug), se
une o sale libremente; el creador es "owner" y no puede salir (debe
eliminar la comunidad). Sin feed, solo lista de miembros.

`/me/friends`: solicitudes de amistad simples — `POST /api/friends` con
`{username}` envía la solicitud (si el otro ya te la envió, se acepta
automáticamente en vez de duplicarla); `POST /api/friends/[id]` acepta,
`DELETE /api/friends/[id]` rechaza/cancela/elimina según el estado. El
botón "Agregar amigo" vive en `/u/[username]`.

## Vincular la app del emulador (guardado en la nube)

Endpoints con **Bearer token**, no cookies — pensados para que la app nativa
del emulador (`multiemu`) vincule la cuenta y sincronice partidas guardadas
entre dispositivos:

1. **Login**: `POST /api/auth/token` con `{ email, password, label? }`
   (`label` es el nombre del dispositivo, ej. "Pixel 8 de Juan"). Si la
   cuenta no tiene 2FA, responde `{ token, username }` — ese `token` va en
   `Authorization: Bearer <token>` en cada request siguiente. Si tiene 2FA,
   responde `{ requiresTotp: true, pendingToken }`; se completa con
   `POST /api/auth/token/verify` (`{ pendingToken, code, label? }`) para
   obtener el `token` real.
2. **Subir un guardado**: primero `POST /api/saves/presign` (Bearer,
   `{ filename, fileSize, contentType }`) da una URL prefirmada de R2 —
   `PUT` los bytes del guardado ahí directo (nunca pasan por nuestro
   servidor). Luego `POST /api/saves` (Bearer,
   `{ gameKey, slot?, storedName, originalName }`) confirma la subida y crea
   o **sobreescribe** el guardado para ese `(gameKey, slot)` — `gameKey` lo
   define la app (ej. `"gba:pokemon-emerald"` o un hash de la ROM), `slot`
   es un número opcional (default `0`) para varios espacios de guardado por
   juego.
3. **Listar / descargar / borrar**: `GET /api/saves` (Bearer) devuelve todos
   los guardados de la cuenta con su `downloadUrl`; `GET
   /api/saves/<id>/download` (Bearer) da `{ downloadUrl }` (URL firmada de
   R2, válida 5 min); `DELETE /api/saves/<id>` (Bearer) borra uno.

Los tokens son de un solo uso por dispositivo y de larga duración (no
expiran solos). El usuario puede ver y revocar cada dispositivo vinculado
desde `/me/security` → "Dispositivos vinculados" (`GET`/`DELETE
/api/me/tokens/<id>`, con cookie de sesión normal, no Bearer). Revocar
borra el token de la base de datos — la próxima request de esa app con ese
token da 401.

## Seguridad

- **Cabeceras** (`next.config.ts`): `Content-Security-Policy` (allowlist
  explícita para AdSense, EthicalAds, TheGamesDB, R2 y Cloudflare Insights —
  cualquier otro origen de script/imagen/conexión se bloquea),
  `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy` (sin cámara/micrófono/geolocalización,
  el sitio no los usa). El CSP usa `'unsafe-inline'` en `script-src` a
  propósito: se intentó el patrón de nonce por request de Next.js (que lo
  evitaría), pero Turbopack no timbra sus propios scripts de hidratación con
  el nonce — probado con un build de producción real, rompía toda la
  interactividad del sitio. La defensa real contra inyección de scripts está
  en escapar el contenido de usuario antes de volcarlo en HTML crudo (ver el
  siguiente punto).
- **XSS**: el único lugar del código que usa `dangerouslySetInnerHTML` es el
  JSON-LD de `/hacks/[slug]` — `JSON.stringify(jsonLd).replace(/</g,
  "\\u003c")`, para que un `title`/`description` con `</script><script>...`
  (controlados por cualquier usuario que publica un hack) no pueda romper el
  tag e inyectar JS. Verificado con un payload real.
- **Rate limiting** (`src/lib/rateLimit.ts`): usa Upstash Redis
  (`@upstash/ratelimit` + `@upstash/redis`, ventana deslizante) cuando están
  configuradas `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`; si no,
  cae a un contador en memoria por instancia (suficiente para dev local, pero
  no para un ataque real distribuido entre las múltiples instancias
  serverless de Vercel). Para activarlo en producción: en el dashboard de
  Vercel, **Storage → Marketplace Database Providers → Upstash** (o
  directamente en upstash.com, plan gratis), crear una base Redis y conectar
  el proyecto — Vercel inyecta esas dos variables automáticamente.
  - Login / registro / verificación TOTP: 5–10 intentos por 15 min por IP
    (o por usuario en el caso de desactivar 2FA).
  - Creación de hacks/comunidades/chats: 10–20 por hora por usuario.
  - Publicaciones en comunidad, reportes, solicitudes de amistad: 20–30 por
    hora por usuario.
  - Mensajes de chat: 60 por minuto por usuario (throughput normal de chat,
    no pensado para frenar spam sino abuso automatizado).

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

## Acerca de, Contacto y retroalimentación

- `/about`: qué es el sitio, el modelo de solo-parches, y qué más hay
  (archivos, comunidades, temas, la app). Contenido estático.
- `/contact`: formulario público (sin login) → `POST /api/contact`,
  guarda en `ContactMessage`. No se muestra ningún correo públicamente —
  el admin lee los mensajes desde el panel de admin (`/admin`), que
  también permite borrarlos. Rate-limited por IP (5/hora) para frenar spam.
- Comentarios de retroalimentación en `/app` (`AppFeedback`): requiere
  cuenta, igual que el resto del contenido de usuarios del sitio. Cualquiera
  puede leerlos; solo el autor o un admin puede borrar uno.

## Ficha pública de la app (`AppListing` / `AppRelease`)

A diferencia de todo lo demás en este proyecto, esto **no es una colección
de contenido de usuarios** — hay una sola app (multiemu), con un historial
de versiones. `AppListing` es la ficha (texto/ícono/capturas, cambia poco);
`AppRelease` es cada versión publicada, con su propio APK. Contrato
completo en `docs/applistingapi.md` del repo de la app.

- Lectura pública sin auth: `GET /api/v1/app` → `{ listing, latestRelease }`
  (404 si nadie ha creado la ficha todavía), `GET /api/v1/app/releases`
  (historial paginado), `POST /api/v1/app/releases/<id>/downloads` (solo
  telemetría, `204`).
- Escritura solo para **ADMIN** (no cualquier cuenta logueada, ni
  MODERATOR — esto no es contenido de usuario): `PUT /api/app` (crea o
  actualiza la ficha; la primera vez exige `tagline` y `description`),
  `POST /api/app/releases` (nueva versión, 409 si el `versionCode` ya
  existe).
- Subir ícono/capturas/APK: mismo patrón presign→PUT→registrar que
  `/api/saves` y `/api/themes` reservan para su v2 — `POST
  /api/app/assets/presign` con `slot: "icon" | "screenshot" |
  "apk:<releaseId>"`, el cliente hace `PUT` a la URL firmada, y `POST
  /api/app/assets` registra la pieza. Límites: ícono ≤2MB, captura ≤5MB,
  APK sin límite propio (usa el mismo tope que `/files`, 200MB).

## Temas del emulador (`EmulatorTheme`)

No confundir con `CommunityTheme` (el tema de colores de esta web) — este es
el modelo de temas visuales para los controles del emulador de la app
(`docs/themes-api.md` en el repo de la app tiene el contrato completo).

- **v1 = presets + color, sin imágenes propias.** `palette` son 6 colores
  hex; `presets` son IDs de forma de botón que la app resuelve del lado del
  cliente (el servidor solo guarda el string, nunca sabe qué dibuja cada
  uno). El campo `assets` del JSON de respuesta siempre va con todo `null`
  en v1 — no hay columna para eso todavía a propósito; se agrega en v2 sin
  romper el contrato actual.
- `system` valida contra los slugs ya existentes de `Platform` (`gb`,
  `gbc`, `gba`, `nds`, ...) — reusa esa tabla en vez de duplicar un enum.
- Lectura pública sin auth: `GET /api/v1/themes` (lista) y `GET
  /api/v1/themes/<id>` (detalle, 404 si no es público).
- Escritura con **Bearer token** (mismo esquema que `/api/saves`):
  `POST /api/themes` (crea, `slug` elegido por el cliente, 409 si ya
  existe), `PATCH /api/themes/<id>` y `DELETE /api/themes/<id>` (403 si el
  token no es del autor).

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
| `GET /api/v1/themes?system=&q=&sort=downloads\|newest&limit=&offset=` | Temas visuales del emulador (ver más abajo) |
| `GET /api/v1/themes/<id>` | Detalle de un tema, solo si es público |
| `POST /api/v1/themes/<id>/downloads` | Incrementa el contador de descargas en 1 (sin auth, es solo telemetría) → `204` |

`games`, `hacks` y `themes` devuelven paginación: `{ ..., pagination: { limit, offset, total, hasMore } }`.
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
