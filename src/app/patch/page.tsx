import PatcherTool from "@/components/PatcherTool";

export default function PatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-base">
          Aplicar un parche
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Todo ocurre localmente en tu navegador: ni tu ROM ni el archivo
          resultante se envían a ningún servidor. Necesitas tu propia copia
          legal del juego original y el archivo de parche (.ips, .bps o .ups)
          descargado desde la página del hack.
        </p>
      </div>
      <PatcherTool />
    </div>
  );
}
