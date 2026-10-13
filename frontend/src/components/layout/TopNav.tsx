// ======================================================
// Barra superior (components/layout/TopNav.tsx)
// Barra azul fija arriba con el logo a la izquierda, la
// navegación por secciones con efecto gota al centro
// (layout/DropNav.tsx) y el menú de usuario a la derecha.
// ======================================================
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { homePathFor } from "../RoleRoute";
import { BrandMark } from "./BrandMark";
import { DropNav } from "./DropNav";
import { UserMenu } from "./UserMenu";

export function TopNav() {
  const { user } = useAuth();
  return (
    // overflow-x-clip: nada puede ensanchar la página en mobile, pero la gota
    // de la sección activa sigue colgando por debajo (el eje vertical no se recorta).
    <header className="sticky top-0 z-30 overflow-x-clip bg-navy-600">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-2 px-4 md:px-10">
        {/* Debajo de 400 px el logo se oculta para dejar lugar a las secciones (ver DropNav). */}
        <Link to={homePathFor(user?.roles)} aria-label="Ir al inicio" className="hidden shrink-0 min-[400px]:block">
          <BrandMark inverted hideNameOnMobile />
        </Link>
        <DropNav />
        <div className="shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
