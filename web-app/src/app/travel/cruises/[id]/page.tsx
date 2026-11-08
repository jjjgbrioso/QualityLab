import type { Metadata } from "next";
import Link from "next/link";
import { Photo, ShipArt } from "@/components/art";
import { CruiseBookingForm } from "@/components/forms/CruiseBookingForm";
import { Alert, Badge, Card } from "@/components/ui";
import { requirePageUser } from "@/lib/auth/session";
import { addDays, formatDisplayDate } from "@/lib/dates";
import { loadForPage } from "@/lib/page-helpers";
import { getSailing } from "@/lib/services/cruises";

export const metadata: Metadata = { title: "Sailing" };

export default async function SailingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePageUser(`/travel/cruises/${id}`);
  const sailing = await loadForPage(() => getSailing(id));

  return (
    <div className="space-y-8">
      <section className="relative -mx-4 -mt-8 overflow-hidden sm:-mx-6" data-testid="sailing-hero">
        {sailing.imageUrl ? (
          <Photo src={sailing.imageUrl} alt="" className="h-72" priority testId="sailing-detail-image" />
        ) : (
          <ShipArt seed={sailing.ship.id} className="h-72" testId="sailing-detail-image-placeholder" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 text-white sm:px-6">
          <Link href="/travel/cruises" className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300 hover:underline" data-testid="sailing-back-link">
            All cruises
          </Link>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight" data-testid="sailing-detail-title">{sailing.title}</h1>
          <p className="text-sm text-slate-200" data-testid="sailing-detail-summary">
            {sailing.ship.name} · {formatDisplayDate(sailing.departureDate)} to {formatDisplayDate(sailing.returnDate)} · {sailing.nights} nights from {sailing.departurePort}
          </p>
        </div>
      </section>

      {sailing.departed ? (
        <Alert tone="warning" testId="sailing-departed">This sailing has departed, so it can no longer be booked.</Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {sailing.departed ? null : (
            <Card className="p-4 sm:p-6">
              <CruiseBookingForm cabins={sailing.cabins} />
            </Card>
          )}

          <Card className="p-4 sm:p-6" testId="sailing-itinerary">
            <h2 className="mb-4 font-semibold">Itinerary</h2>
            <ol className="relative space-y-4 border-l-2 border-blue-200 pl-6">
              {sailing.ports.map((port, index) => {
                const last = index === sailing.ports.length - 1;
                const day = last ? sailing.nights + 1 : index + 1;
                return (
                  <li key={`${port}-${index}`} className="relative" data-testid={`itinerary-stop-${index + 1}`}>
                    <span className="absolute -left-[33px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-800 ring-4 ring-white" aria-hidden="true" />
                    <p className="text-xs font-semibold uppercase text-blue-800">
                      {last ? `Day ${day}, ${formatDisplayDate(sailing.returnDate)}` : `Day ${day}, ${formatDisplayDate(addDays(sailing.departureDate, index))}`}
                    </p>
                    <p className="font-medium">
                      {port}
                      {index === 0 ? " (departure)" : last ? " (return)" : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <Card className="h-fit space-y-3 overflow-hidden p-5" testId="ship-info">
          {sailing.ship.imageUrl ? (
            <Photo src={sailing.ship.imageUrl} alt={`On board ${sailing.ship.name}`} className="-mx-5 -mt-5 mb-4 h-40" sizes="(min-width: 1024px) 33vw, 100vw" testId="ship-info-image" />
          ) : null}
          <h2 className="font-semibold">About {sailing.ship.name}</h2>
          <p className="text-sm text-muted">{sailing.ship.description}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">Launched</dt>
            <dd>{sailing.ship.yearLaunched}</dd>
            <dt className="text-muted">Guests</dt>
            <dd>{sailing.ship.guestCapacity.toLocaleString("en-US")}</dd>
          </dl>
          <div className="flex flex-wrap gap-1">
            {sailing.ship.amenities.map((amenity) => (
              <Badge key={amenity}>{amenity}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted">
            Itinerary dates assume one port per day. Day {sailing.nights + 1} is the return to {sailing.departurePort}.
          </p>
        </Card>
      </div>
    </div>
  );
}
