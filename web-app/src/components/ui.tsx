import Link from "next/link";
import type { ReactNode } from "react";
import type { PageMeta } from "@/lib/api/pagination";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";
const BUTTON_BASE = `inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;

export const buttonStyles = {
  primary: `${BUTTON_BASE} bg-brand-700 text-white hover:bg-brand-800`,
  secondary: `${BUTTON_BASE} border border-line bg-surface text-ink hover:bg-canvas`,
  danger: `${BUTTON_BASE} bg-red-700 text-white hover:bg-red-800`,
};

export const inputStyles = `w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-slate-400 aria-[invalid=true]:border-red-600 ${FOCUS}`;

export const linkStyles = `font-medium text-brand-700 underline-offset-2 hover:underline ${FOCUS}`;

export function PageHeader({
  title,
  description,
  actions,
  testId,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  testId: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid={`${testId}-title`}>
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = "", testId }: { children: ReactNode; className?: string; testId?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-surface ${className}`} data-testid={testId}>
      {children}
    </div>
  );
}

const ALERT_TONES = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function Alert({
  tone = "info",
  children,
  testId,
}: {
  tone?: keyof typeof ALERT_TONES;
  children: ReactNode;
  testId: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${ALERT_TONES[tone]}`}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
};

export function Badge({
  tone = "neutral",
  children,
  testId,
}: {
  tone?: keyof typeof BADGE_TONES;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`} data-testid={testId}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, keyof typeof BADGE_TONES> = {
  PAID: "info",
  SHIPPED: "warning",
  DELIVERED: "success",
  CANCELLED: "danger",
  CONFIRMED: "success",
  ACTIVE: "success",
  FROZEN: "danger",
  DISABLED: "danger",
  ADMIN: "info",
  CUSTOMER: "neutral",
};

export function StatusBadge({ status, testId }: { status: string; testId?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} testId={testId}>
      {status}
    </Badge>
  );
}

export function EmptyState({ title, children, testId }: { title: string; children?: ReactNode; testId: string }) {
  return (
    <Card className="p-8 text-center" testId={testId}>
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-2 text-sm text-muted">{children}</div> : null}
    </Card>
  );
}

const PALETTES = [
  ["#0f766e", "#5eead4"],
  ["#1d4ed8", "#93c5fd"],
  ["#7c3aed", "#c4b5fd"],
  ["#b45309", "#fcd34d"],
  ["#be123c", "#fda4af"],
  ["#334155", "#cbd5e1"],
];

/** Generated artwork, so the app ships no third-party product or hotel photos. */
export function Thumb({ seed, label, className = "h-40" }: { seed: string; label: string; className?: string }) {
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [from, to] = PALETTES[hash % PALETTES.length];
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center text-2xl font-semibold text-white/90 ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {label}
    </div>
  );
}

export function Pagination({
  meta,
  basePath,
  query,
  testId,
}: {
  meta: PageMeta;
  basePath: string;
  query: Record<string, string | number | boolean | undefined>;
  testId: string;
}) {
  if (meta.totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "" && key !== "page") params.set(key, String(value));
    }
    params.set("page", String(page));
    return `${basePath}?${params}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3" data-testid={testId}>
      {meta.hasPrevious ? (
        <Link href={hrefFor(meta.page - 1)} className={buttonStyles.secondary} data-testid={`${testId}-previous`}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted" data-testid={`${testId}-status`}>
        Page {meta.page} of {meta.totalPages} ({meta.totalItems} items)
      </span>
      {meta.hasNext ? (
        <Link href={hrefFor(meta.page + 1)} className={buttonStyles.secondary} data-testid={`${testId}-next`}>
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function SummaryRow({ label, value, testId, strong }: { label: string; value: string; testId: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1 text-sm ${strong ? "font-semibold" : ""}`}>
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span data-testid={testId}>{value}</span>
    </div>
  );
}
