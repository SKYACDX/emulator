import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acerca de",
  description:
    "Qué es RomHack Hub, cómo funciona el modelo de solo-parches, y qué construye la comunidad aquí.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-base">Acerca de RomHack Hub</h1>

      <p className="text-muted">
        RomHack Hub es un sitio para publicar y descubrir ROM hacks de consolas
        retro (NES, SNES, N64, Game Boy, GBA, DS, 3DS, Switch). Nació como un
        lugar centrado en la comunidad: no solo para descargar parches, sino
        para compartir progresos, temas visuales, archivos de apoyo (guías,
        savestates, capturas) y conectar con otros jugadores.
      </p>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">
          Solo parches, nunca ROMs
        </h2>
        <p className="text-muted">
          Este sitio distribuye <strong>únicamente archivos de parche</strong>{" "}
          (<code>.ips</code>, <code>.bps</code>, <code>.ups</code>,{" "}
          <code>.xdelta</code>), nunca la ROM completa de un juego. Un parche
          es solo la diferencia entre el juego original y el hack — quien lo
          descarga necesita su propia copia legal del juego original para
          aplicarlo, usando la{" "}
          <Link href="/patch" className="text-accent underline">
            herramienta de parcheo
          </Link>{" "}
          que corre 100% en el navegador (nada se sube al servidor).
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">
          Qué más hay aquí
        </h2>
        <ul className="text-muted list-disc pl-5">
          <li>
            <Link href="/files" className="text-accent underline">
              Archivos de la comunidad
            </Link>
            : capturas, guías, savestates y otros archivos que no son parches,
            escaneados con VirusTotal antes de publicarse.
          </li>
          <li>
            <Link href="/communities" className="text-accent underline">
              Comunidades
            </Link>
            : grupos para compartir avances y progresos de un juego.
          </li>
          <li>
            <Link href="/themes" className="text-accent underline">
              Temas
            </Link>
            : cada quien elige o crea su propio esquema de colores para el
            sitio.
          </li>
          <li>
            <Link href="/app" className="text-accent underline">
              multiemu
            </Link>
            : la app de Android hermana de este sitio — emulador de GB/GBC/GBA/NDS
            que se conecta con tu cuenta para guardar partidas en la nube,
            aplicar temas y buscar HackRoms.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-base">Moderación</h2>
        <p className="text-muted">
          Los archivos reportados por la comunidad se revisan manualmente. Si
          ves algo que no debería estar aquí (una ROM completa disfrazada de
          otra cosa, contenido malicioso, etc.), repórtalo desde el botón
          &quot;Reportar&quot; en{" "}
          <Link href="/files" className="text-accent underline">
            /files
          </Link>
          , o{" "}
          <Link href="/contact" className="text-accent underline">
            contáctanos
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
