import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de firma de código",
  description:
    "Quién firma el ejecutable de Windows de multiemu, qué se firma, quién puede aprobarlo y qué datos envía la app por red.",
  alternates: { canonical: "/code-signing-policy" },
};

const REPO_EXE = "https://github.com/SKYACDX/multiemu_exe";
const REPO_ANDROID = "https://github.com/SKYACDX/multiemu";

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline">
      {children}
    </a>
  );
}

export default function CodeSigningPolicyPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="font-pixel text-base">Política de firma de código</h1>

      <p className="text-muted">
        Esta página describe cómo se firma el instalador de Windows de{" "}
        <Link href="/app" className="text-accent underline">
          multiemu
        </Link>{" "}
        (el emulador de Game Boy, GBA, Nintendo DS y 3DS), qué se firma, quién
        puede aprobarlo y qué datos envía la app por red. Última actualización:
        5 de octubre de 2026.
      </p>

      <section className="game-card flex flex-col gap-2 p-4">
        <p className="text-base">
          Firma de código gratuita proporcionada por{" "}
          <Ext href="https://signpath.io">SignPath.io</Ext>, certificado de{" "}
          <Ext href="https://signpath.org">SignPath Foundation</Ext>.
        </p>
        <p className="text-muted text-sm">
          Free code signing provided by <Ext href="https://signpath.io">SignPath.io</Ext>,
          certificate by <Ext href="https://signpath.org">SignPath Foundation</Ext>.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">Qué se firma</h2>
        <p className="text-muted">
          Únicamente los instaladores y ejecutables de Windows de multiemu
          (<code>multiemu-&lt;versión&gt;-setup.exe</code>) generados a partir
          del código fuente público de este proyecto:{" "}
          <Ext href={REPO_EXE}>SKYACDX/multiemu_exe</Ext>, que a su vez usa el
          código de la app de Android,{" "}
          <Ext href={REPO_ANDROID}>SKYACDX/multiemu</Ext>. No se firman
          binarios de otros proyectos. El programa es software libre bajo la
          licencia GPL-3.0-or-later e incluye componentes de terceros con sus
          propias licencias (melonDS, mGBA, Azahar, Electron); el detalle está
          en el archivo <code>THIRD_PARTY_NOTICES.md</code> de cada repositorio.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">Roles del equipo</h2>
        <p className="text-muted mb-2">
          multiemu es un proyecto con un único mantenedor, que cumple los tres
          roles que exige la política de SignPath Foundation:
        </p>
        <ul className="text-muted list-disc pl-5">
          <li>
            <strong>Autores y committers</strong> (quienes escriben el código):{" "}
            <Ext href="https://github.com/WilbertACDX">WilbertACDX</Ext>
          </li>
          <li>
            <strong>Revisores</strong> (quienes revisan los cambios antes de
            publicar): <Ext href="https://github.com/WilbertACDX">WilbertACDX</Ext>
          </li>
          <li>
            <strong>Aprobadores</strong> (quienes autorizan cada solicitud de
            firma): <Ext href="https://github.com/WilbertACDX">WilbertACDX</Ext>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-base">Privacidad: qué datos envía la app</h2>
        <p className="text-muted">
          multiemu no incluye analíticas, telemetría ni reporte automático de
          errores. Esto es todo lo que la app de Windows transmite por red, y
          solo va a RomHack Hub (<code>emulatornds.online</code>), a los
          servicios de archivos e imágenes que RomHack Hub indica y, solo si tú
          entras a una sala de la inalámbrica por internet de 3DS, al servidor
          de salas del proyecto:
        </p>

        <div>
          <h3 className="mb-1 font-medium text-base">Sin iniciar sesión</h3>
          <ul className="text-muted list-disc pl-5">
            <li>
              <strong>Comprobación de actualizaciones</strong>, al abrir la app
              y cada 2 horas: una consulta{" "}
              <code>GET /api/v1/app/releases?limit=20</code>. La app no envía su
              versión ni ningún identificador; compara las versiones
              localmente. Si hay una nueva, la descarga del instalador (desde
              almacenamiento Cloudflare R2, con un enlace firmado temporal) solo
              ocurre cuando pulsas el botón de actualizar.
            </li>
            <li>
              <strong>Catálogo</strong>: las listas de archivos y plataformas
              de RomHack Hub, y la descarga de los archivos que elijas.
            </li>
            <li>
              <strong>Carátulas</strong>: las imágenes se descargan de las
              direcciones que indica el catálogo (normalmente{" "}
              <code>cdn.thegamesdb.net</code>, de TheGamesDB).
            </li>
            <li>
              <strong>Comentarios</strong>, solo cuando tú los envías: el texto,
              la versión de la app, la versión de Windows (por ejemplo
              &quot;Windows 10.0.26300&quot;), una captura opcional y un
              nombre opcional si no has iniciado sesión.
            </li>
            <li>
              <strong>Juego en línea de Nintendo DS</strong>, solo si un juego
              intenta conectarse: el tráfico de la consola emulada sale por tu
              propia conexión, mediante una red virtual (libslirp), hacia los
              servidores que ese juego o el DNS configurado en él usen. No pasa
              por RomHack Hub.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-base">
            Con tu cuenta de RomHack Hub (opcional)
          </h3>
          <ul className="text-muted list-disc pl-5">
            <li>
              <strong>Inicio de sesión</strong>: tu correo y contraseña (y el
              código de verificación en dos pasos, si lo tienes activado) se
              envían por HTTPS a RomHack Hub. La app guarda solo un token de
              acceso, que caduca a los 90 días, cifrado con el almacén de
              credenciales del sistema (DPAPI en Windows); si el sistema no
              ofrece cifrado, no se guarda nada. La contraseña nunca se guarda.
            </li>
            <li>
              <strong>Guardados en la nube</strong>: el archivo de guardado o
              el estado, su ranura, el nombre del archivo y un identificador del
              juego (el sistema más el CRC32 de la ROM; en 3DS, el
              identificador del juego que lleva la propia ROM). En un juego de
              3DS el guardado es la carpeta de datos del juego, empaquetada en
              un zip. Con un juego de GBA, DS o 3DS abierto, el guardado se
              sube solo cada 45 segundos si cambió (en 3DS, también al salir
              del juego); en Game Boy, solo con el botón de subir. Nunca se
              suben ROMs.
            </li>
            <li>
              <strong>Comentarios</strong> enviados con la sesión iniciada
              quedan asociados a tu cuenta.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-base">
            Si usas la inalámbrica por internet de 3DS (opcional)
          </h3>
          <p className="text-muted mb-1">
            Es opcional: solo ocurre cuando eliges una sala (de la 1 a la 10)
            en el menú de pausa de un juego de 3DS. Sin hacerlo, la app nunca se
            conecta a ese servidor. Al entrar, la app se conecta por UDP al
            servidor de salas del proyecto (<code>160.34.211.121</code>, puertos
            24872 a 24881, alojado en Oracle Cloud, Querétaro, México) y le
            envía:
          </p>
          <ul className="text-muted list-disc pl-5">
            <li>Tu dirección IP, como en cualquier conexión de red.</li>
            <li>
              Un apodo aleatorio, distinto en cada entrada a una sala:{" "}
              <code>multiemu-</code> y seis caracteres hexadecimales.
            </li>
            <li>
              Un identificador aleatorio de sesión: 64 caracteres hexadecimales
              generados al azar en cada entrada a una sala. No se obtiene de tu
              equipo ni de tu instalación y es distinto cada vez, así que no
              permite reconocerte de una sesión a otra; el servidor lo usa solo
              para no admitir dos consolas con el mismo identificador en una
              sala.
            </li>
            <li>
              El nombre y el identificador del juego de 3DS que tienes abierto.
            </li>
            <li>
              El tráfico inalámbrico del juego: lo que el propio juego envía a
              los demás jugadores de la sala, por ejemplo en un intercambio o un
              combate.
            </li>
          </ul>
          <p className="text-muted mt-1">
            No envía datos de tu cuenta de RomHack Hub, tokens, contraseñas,
            ROMs ni mensajes de chat. Es el servidor de salas estándar de
            Azahar, que ejecuta el proyecto.
          </p>
          <p className="text-muted mt-1">
            El servidor registra cada entrada y salida de una sala con tu
            dirección IP y tu apodo, y qué juego está jugando cada apodo, en el
            registro del sistema del servidor. No registra el contenido del
            tráfico del juego, pero ese tráfico viaja sin cifrar entre tu
            consola y el servidor, que lo retransmite al resto de la sala, así
            que técnicamente puede verlo. Esos registros se conservan 7 días y
            luego se borran solos. No se copian a otros archivos del servidor,
            su cortafuegos no registra conexiones y no se envían a servicios de
            terceros.
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-base">Lo que no se envía</h3>
          <p className="text-muted">
            Tus ROMs, la lista o las rutas de tus archivos, identificadores de
            tu equipo o de su hardware, ni datos de uso.
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-medium text-base">Lo que registra el servidor</h3>
          <p className="text-muted mb-1">
            Como cualquier sitio web, RomHack Hub recibe la dirección IP y el
            agente de usuario de cada solicitud. Además guarda:
          </p>
          <ul className="text-muted list-disc pl-5">
            <li>
              Los intentos de inicio de sesión (correo, IP, agente de usuario,
              resultado y método), que cada persona puede ver en la sección de
              seguridad de su cuenta.
            </li>
            <li>
              Las descargas de archivos y parches del catálogo (IP, agente de
              usuario, fecha y, si la descarga se hizo con sesión iniciada en la
              web, la cuenta).
            </li>
            <li>Contadores de descargas de cada versión de la app, sin datos personales.</li>
          </ul>
          <p className="text-muted mt-2">
            Para funcionar, el servicio usa Vercel (alojamiento), Neon (base de
            datos), Cloudflare R2 (archivos) y Upstash (límite de solicitudes
            por IP). La app de Android usa los mismos servicios de RomHack Hub.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">Contacto</h2>
        <p className="text-muted">
          Para dudas sobre esta política o sobre la firma del programa,{" "}
          <Link href="/contact" className="text-accent underline">
            escríbenos
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
