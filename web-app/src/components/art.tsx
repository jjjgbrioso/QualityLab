import Image from "next/image";

/**
 * Photos, and the original SVG illustrations shown when a record has no photo.
 * The illustrations are decorative and hidden from assistive technology.
 */

/**
 * A photo that covers its box. Files in public/images are already resized and compressed,
 * so the image optimizer is skipped. Pass an empty `alt` when nearby text already names it.
 */
export function Photo({
  src,
  alt,
  className = "h-40",
  sizes = "100vw",
  priority = false,
  testId,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  testId?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`} data-testid={testId}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized className="object-cover" />
    </div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z",
  Home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  Books: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11",
  Sports: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 2.5 3 15.5 0 18M12 3c-3 2.5-3 15.5 0 18",
  Apparel: "M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z",
  Office: "M6 3h10l3 3v15H6zM9 8h6M9 12h6M9 16h4",
};
const DEFAULT_ICON = "M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0";

const CATEGORY_COLORS: Record<string, [string, string]> = {
  Electronics: ["#1e3a8a", "#60a5fa"],
  Home: ["#9a3412", "#fdba74"],
  Books: ["#581c87", "#c4b5fd"],
  Sports: ["#065f46", "#6ee7b7"],
  Apparel: ["#9f1239", "#fda4af"],
  Office: ["#334155", "#cbd5e1"],
};

export function CategoryIcon({ category, className = "h-6 w-6" }: { category: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CATEGORY_ICONS[category] ?? DEFAULT_ICON} />
    </svg>
  );
}

export function categoryColors(category: string): [string, string] {
  return CATEGORY_COLORS[category] ?? ["#475569", "#e2e8f0"];
}

/** Product artwork: a category gradient with a large line icon. */
export function ProductArt({ category, className = "h-40", testId }: { category: string; className?: string; testId?: string }) {
  const [from, to] = categoryColors(category);
  return (
    <div
      aria-hidden="true"
      data-testid={testId}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15" />
      <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10" />
      <CategoryIcon category={category} className="h-1/2 w-1/2 max-h-24 max-w-24 text-white/90" />
    </div>
  );
}

const SEA_PALETTES: [string, string, string][] = [
  ["#0b2545", "#13315c", "#38bdf8"],
  ["#1e1b4b", "#3730a3", "#a78bfa"],
  ["#083344", "#155e75", "#2dd4bf"],
  ["#172554", "#1d4ed8", "#fbbf24"],
];

function paletteFor(seed: string) {
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SEA_PALETTES[hash % SEA_PALETTES.length];
}

/** A cruise ship on the water at dusk. */
export function ShipArt({ seed, className = "h-48", testId }: { seed: string; className?: string; testId?: string }) {
  const [deep, mid, accent] = paletteFor(seed);
  const id = `sky-${seed.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={`block w-full ${className}`} aria-hidden="true" data-testid={testId}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={deep} />
          <stop offset="1" stopColor={mid} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#${id})`} />
      <circle cx="320" cy="52" r="22" fill={accent} opacity="0.85" />
      <g fill="#ffffff">
        <path d="M70 128h270l-28 34H98z" />
        <rect x="104" y="108" width="196" height="20" rx="3" opacity="0.95" />
        <rect x="124" y="92" width="150" height="16" rx="3" opacity="0.9" />
        <rect x="148" y="78" width="96" height="14" rx="3" opacity="0.85" />
      </g>
      <rect x="226" y="58" width="18" height="22" rx="2" fill={accent} />
      <g fill={mid} opacity="0.7">
        {Array.from({ length: 12 }, (_, index) => (
          <rect key={index} x={114 + index * 15} y="114" width="8" height="6" rx="1" />
        ))}
        {Array.from({ length: 9 }, (_, index) => (
          <rect key={index} x={134 + index * 15} y="97" width="8" height="6" rx="1" />
        ))}
      </g>
      <path d="M0 160c40-10 80 10 120 0s80-10 120 0 80 10 120 0 40-6 40-6v46H0z" fill={accent} opacity="0.35" />
      <path d="M0 172c40-8 80 8 120 0s80-8 120 0 80 8 120 0 40-4 40-4v32H0z" fill="#ffffff" opacity="0.2" />
    </svg>
  );
}

/** A simple coastal scene for destinations and hotels. */
export function SceneArt({ seed, className = "h-40", testId }: { seed: string; className?: string; testId?: string }) {
  const [deep, mid, accent] = paletteFor(seed);
  const id = `scene-${seed.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={`block w-full ${className}`} aria-hidden="true" data-testid={testId}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mid} />
          <stop offset="1" stopColor={accent} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#${id})`} />
      <circle cx="90" cy="70" r="26" fill="#ffffff" opacity="0.7" />
      <path d="M0 140l70-50 50 30 70-60 80 70 60-40 70 50v60H0z" fill={deep} opacity="0.55" />
      <path d="M0 165c50-10 100 10 150 0s100-10 150 0 100 10 100 0v35H0z" fill="#ffffff" opacity="0.35" />
    </svg>
  );
}
