// ======================================================
// Layout del panel interno (components/AppShell.tsx)
// Barra superior azul con logo, navegación con efecto gota y
// usuario (layout/TopNav.tsx), y el contenido de la página en
// el <Outlet />. El margen superior deja lugar a la gota de la
// sección activa, que cuelga por debajo de la barra.
// ======================================================
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { TopNav } from "./layout/TopNav";
import { Loading } from "./ui/spinner";

export default function AppShell() {
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1280px] px-6 pt-14 pb-14 md:px-10 md:pt-16">
          {/* El encabezado queda visible mientras se descarga la pantalla. */}
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
