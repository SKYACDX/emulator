import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos un mensaje sobre RomHack Hub o multiemu.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-base">Contacto</h1>
        <p className="text-muted mt-1">
          ¿Preguntas, un reporte que no encaja en el botón de la página de
          archivos, o algo sobre la app multiemu? Escríbenos.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
