// ======================================================
// Navegación con efecto gota (components/layout/DropNav.tsx)
// Grupo de íconos de sección dentro de la barra superior azul.
// La sección activa "cuelga" en un círculo que asoma por debajo
// de la barra, desde una muesca curva recortada en su borde
// inferior (efecto gota). Al cambiar de sección:
//   1. la muesca y el círculo se deslizan juntos hasta el nuevo
//      ícono (transición con curva elástica), y
//   2. el círculo vuelve a "caer" de la muesca (keyframes
//      `drop-fall` en index.css), como una gota.
// Cómo se dibuja la muesca: es una forma SVG del color del
// fondo de la página, apoyada sobre el borde inferior de la
// barra, así parece un recorte. Respeta la preferencia de
// "movimiento reducido" del sistema operativo.
// ======================================================
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { can } from "../../lib/permissions";
import { NAV_ITEMS } from "../../lib/nav-config";
import { cn } from "../../lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

/** Ancho de la muesca (px). */
const NOTCH_WIDTH = 96;
/** Alto de la muesca (px): cuánto "entra" en la barra desde abajo. */
const NOTCH_HEIGHT = 40;
/** Diámetro del círculo activo (px). */
const BUBBLE = 52;
/** Curva elástica compartida por la muesca y el círculo. */
const SLIDE = "transition-transform duration-500 ease-[cubic-bezier(.68,-0.35,.32,1.35)] motion-reduce:transition-none";

/**
 * Espacio de la barra que NO es navegación en mobile (px): márgenes
 * laterales (2 × 16), avatar (32) y separaciones (8 c/u). El logo
 * (32 + 8) sólo cuenta desde 400 px, porque debajo se oculta.
 * Debe coincidir con las clases de TopNav.tsx.
 */
function reservedWidth(viewport: number): number {
  return 32 + 32 + 8 + (viewport >= LOGO_MIN_WIDTH ? 32 + 8 : 0);
}

/** Desde este ancho de pantalla se muestra el logo (ver TopNav.tsx). */
export const LOGO_MIN_WIDTH = 400;

/**
 * Ancho de cada ítem. En desktop es fijo (72 px); en mobile se reparte el
 * espacio libre entre las secciones, para que la barra nunca desborde
 * (ej. Mobile S de 320 px con 6 secciones → 41 px por ítem).
 */
function useItemWidth(count: number): number {
  const [viewport, setViewport] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setViewport(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  if (viewport >= 768) return 72;
  const available = viewport - reservedWidth(viewport);
  return Math.max(36, Math.min(56, Math.floor(available / Math.max(1, count))));
}

export function DropNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = NAV_ITEMS.filter((item) => can(user?.roles, item.permission));
  const itemWidth = useItemWidth(items.length);

  // La sección activa incluye sus subrutas (ej. /surgeries/:id).
  const activeIndex = items.findIndex((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  const active = activeIndex >= 0 ? items[activeIndex]! : null;
  /** Centro horizontal del ítem activo dentro del grupo. */
  const center = activeIndex * itemWidth + itemWidth / 2;

  return (
    <nav aria-label="Navegación principal" className="relative h-full" style={{ width: items.length * itemWidth }}>
      {active && (
        <>
          {/* Muesca: forma del color del fondo que "recorta" el borde inferior de la barra. */}
          <svg
            aria-hidden
            width={NOTCH_WIDTH}
            height={NOTCH_HEIGHT + 2}
            viewBox="0 0 96 42"
            className={cn("absolute left-0", SLIDE)}
            style={{ bottom: -1, transform: `translateX(${center - NOTCH_WIDTH / 2}px)` }}
          >
            <path d="M0 42 C 16 42 22 36 28 24 C 35 9 41 2 48 2 C 55 2 61 9 68 24 C 74 36 80 42 96 42 Z" fill="#f8f9fa" />
          </svg>

          {/* Círculo del ítem activo: cuelga por debajo de la barra y "cae" al cambiar. */}
          <div
            aria-hidden
            className={cn("absolute left-0 z-10", SLIDE)}
            style={{ bottom: -(BUBBLE - NOTCH_HEIGHT + 12), transform: `translateX(${center - BUBBLE / 2}px)` }}
          >
            <span
              key={active.to}
              className="flex items-center justify-center rounded-full bg-navy-600 text-white shadow-lg animate-[drop-fall_550ms_cubic-bezier(.34,1.56,.64,1)] motion-reduce:animate-none"
              style={{ width: BUBBLE, height: BUBBLE }}
            >
              <active.icon className="h-6 w-6" strokeWidth={2.25} />
            </span>
          </div>
        </>
      )}

      <ul className="relative flex h-full items-center">
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <li key={item.to} style={{ width: itemWidth }} className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    {/* El ícono activo se muestra en el círculo; acá queda oculto. */}
                    <item.icon className={cn("h-[22px] w-[22px] transition-opacity duration-200", isActive && "opacity-0")} strokeWidth={2} />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={isActive ? 30 : 6}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
