import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Photo, SceneArt, ShipArt } from "@/components/art";
import { SailingCard, seaButton, seaInput } from "@/components/travel";
import { requirePageUser } from "@/lib/auth/session";
import { addDays, formatDisplayDate, todayUtc } from "@/lib/dates";
import { cityImageUrl } from "@/lib/images";
import { formatCents } from "@/lib/money";
import { pathWithQuery, type SearchParams } from "@/lib/page-helpers";
import { listCruiseFilters, listSailings, listShips } from "@/lib/services/cruises";
import { listHotelCities } from "@/lib/services/hotels";
import { cruiseQuerySchema } from "@/lib/validation/cruises";

export const metadata: Metadata = { title: "Travel & Cruise" };

/** Hotel searches used to live at /travel, so old links with hotel filters are sent on. */
const HOTEL_QUERY_KEYS = ["destination", "checkIn", "checkOut", "guests", "minStars", "maxPrice", "amenity", "sort", "page", "pageSize"];

const CATEGORIES = [
  { id: "cruises", label: "All cruises", href: "/travel/cruises" },
  { id: "island-cruises", label: "Philippine island cruises", href: "/travel/cruises?destination=Philippine%20Islands" },
  { id: "asia-cruises", label: "Southeast Asia cruises", href: "/travel/cruises?destination=Southeast%20Asia" },
  { id: "short-cruises", label: "Short breaks (3 to 4 nights)", href: "/travel/cruises?minNights=3&maxNights=4" },
  { id: "hotels", label: "All hotels", href: "/travel/hotels" },
  { id: "pool-hotels", label: "Hotels with a pool", href: "/travel/hotels?amenity=Pool" },
  { id: "pet-hotels", label: "Pet-friendly hotels", href: "/travel/hotels?amenity=Pet%20friendly" },
];

export default async function TravelPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  if (HOTEL_QUERY_KEYS.some((key) => raw[key] !== undefined)) redirect(pathWithQuery("/travel/hotels", raw));
  await requirePageUser(pathWithQuery("/travel", raw));

  const tab = raw.tab === "hotels" ? "hotels" : "cruises";
  const [filters, ships, upcoming, cheapest, cities] = await Promise.all([
    listCruiseFilters(),
    listShips(),
    listSailings(cruiseQuerySchema.parse({ pageSize: "3" })),
    listSailings(cruiseQuerySchema.parse({ pageSize: "1", sort: "price_asc" })),
    listHotelCities(),
  ]);
  const lowestFare = cheapest.items[0]?.fromPricePerGuestCents;
  const today = todayUtc();
  const cityCards = cities.map((city) => ({
    ...city,
    slug: city.city.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    imageUrl: cityImageUrl(city.city),
  }));

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 -mt-8 overflow-hidden sm:-mx-6" data-testid="travel-hero">
        <Photo src="/images/cities/palawan.jpg" alt="" className="h-80 sm:h-96" priority testId="travel-hero-image" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">QualityLab Voyages</p>
          <h1 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-5xl" data-testid="travel-title">
            Sail somewhere new
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-200 sm:text-base">
            Fictional cruises across Asia and hotel stays in twelve cities. Every booking is simulated.
          </p>
        </div>
      </section>

      <section aria-label="Search" className="relative -mt-20 rounded-2xl bg-surface p-4 shadow-xl ring-1 ring-line sm:mx-6 sm:p-6" data-testid="travel-search-panel">
        <div role="tablist" aria-label="What to search" className="mb-4 flex gap-2">
          {(["cruises", "hotels"] as const).map((name) => (
            <Link
              key={name}
              role="tab"
              aria-selected={tab === name}
              href={name === "cruises" ? "/travel" : "/travel?tab=hotels"}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === name ? "bg-slate-900 text-white" : "bg-canvas text-muted hover:text-ink"}`}
              data-testid={`travel-tab-${name}`}
            >
              {name === "cruises" ? "Cruises" : "Hotels"}
            </Link>
          ))}
        </div>

        {tab === "cruises" ? (
          <form method="get" action="/travel/cruises" role="tabpanel" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="cruise-search-form">
            <div className="lg:col-span-2">
              <label htmlFor="cruise-destination" className="mb-1 block text-xs font-semibold">Cruising to</label>
              <select id="cruise-destination" name="destination" className={seaInput} data-testid="cruise-search-destination-select">
                <option value="">Any destination</option>
                {filters.destinations.map((destination) => (
                  <option key={destination} value={destination}>{destination}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cruise-port" className="mb-1 block text-xs font-semibold">Leaving from</label>
              <select id="cruise-port" name="departurePort" className={seaInput} data-testid="cruise-search-port-select">
                <option value="">Any port</option>
                {filters.departurePorts.map((port) => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cruise-month" className="mb-1 block text-xs font-semibold">Month</label>
              <input id="cruise-month" name="month" type="month" min={today.slice(0, 7)} className={seaInput} data-testid="cruise-search-month-input" />
            </div>
            <div className="flex items-end">
              <button type="submit" className={`${seaButton} w-full`} data-testid="cruise-search-submit">Find cruises</button>
            </div>
          </form>
        ) : (
          <form method="get" action="/travel/hotels" role="tabpanel" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="hotel-search-form">
            <div className="lg:col-span-2">
              <label htmlFor="hotel-destination" className="mb-1 block text-xs font-semibold">Destination</label>
              <input id="hotel-destination" name="destination" type="search" placeholder="City, country, or hotel" className={seaInput} data-testid="hotel-search-destination-input" />
            </div>
            <div>
              <label htmlFor="hotel-check-in" className="mb-1 block text-xs font-semibold">Check-in</label>
              <input id="hotel-check-in" name="checkIn" type="date" min={today} className={seaInput} data-testid="hotel-search-check-in-input" />
            </div>
            <div>
              <label htmlFor="hotel-check-out" className="mb-1 block text-xs font-semibold">Check-out</label>
              <input id="hotel-check-out" name="checkOut" type="date" min={addDays(today, 1)} className={seaInput} data-testid="hotel-search-check-out-input" />
            </div>
            <div className="flex items-end">
              <button type="submit" className={`${seaButton} w-full`} data-testid="hotel-search-submit">Find hotels</button>
            </div>
          </form>
        )}
      </section>

      {lowestFare !== undefined ? (
        <Link
          href="/travel/cruises?sort=price_asc"
          className="flex flex-col items-start justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-800 px-6 py-5 text-white sm:flex-row sm:items-center"
          data-testid="travel-promo-strip"
        >
          <p className="text-lg font-bold">2030 and 2031 sailings are open. Cabins from {formatCents(lowestFare)} per guest.</p>
          <span className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900">See the lowest fares</span>
        </Link>
      ) : null}

      <section aria-labelledby="categories-heading" data-testid="travel-categories">
        <h2 id="categories-heading" className="mb-3 text-xl font-bold">Explore by type</h2>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <li key={category.id}>
              <Link href={category.href} className="block rounded-full border border-slate-300 bg-surface px-4 py-2 text-sm font-medium hover:border-slate-900" data-testid={`travel-category-${category.id}`}>
                {category.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ships-heading" data-testid="featured-ships">
        <h2 id="ships-heading" className="mb-3 text-xl font-bold">Our ships</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {ships.map((ship) => (
            <li key={ship.id}>
              <Link href={`/travel/cruises?ship=${ship.id}`} className="group relative block overflow-hidden rounded-2xl" data-testid={`ship-card-${ship.id}`}>
                {ship.imageUrl ? (
                  <Photo
                    src={ship.imageUrl}
                    alt=""
                    className="h-52 transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width: 640px) 50vw, 100vw"
                    testId={`ship-image-${ship.id}`}
                  />
                ) : (
                  <ShipArt seed={ship.id} className="h-52 transition-transform duration-300 group-hover:scale-105" testId={`ship-image-placeholder-${ship.id}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-2xl font-extrabold uppercase tracking-wide">{ship.name}</p>
                  <p className="text-sm text-slate-200">
                    {ship.departurePorts.length > 0 ? `Sails from ${ship.departurePorts.join(" · ")}` : "No upcoming sailings"}
                  </p>
                  {ship.nextDeparture ? (
                    <p className="text-xs text-slate-300">Next departure {formatDisplayDate(ship.nextDeparture)}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="upcoming-heading" data-testid="upcoming-sailings">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="upcoming-heading" className="text-xl font-bold">Next sailings</h2>
          <Link href="/travel/cruises" className="text-sm font-semibold text-blue-800 hover:underline" data-testid="upcoming-sailings-view-all">
            See all cruises
          </Link>
        </div>
        <div className="space-y-4">
          {upcoming.items.map((sailing) => (
            <SailingCard key={sailing.id} sailing={sailing} />
          ))}
        </div>
      </section>

      <section aria-labelledby="cities-heading" data-testid="hotel-destinations">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="cities-heading" className="text-xl font-bold">Hotel destinations</h2>
          <Link href="/travel/hotels" className="text-sm font-semibold text-blue-800 hover:underline" data-testid="hotel-destinations-view-all">
            See all hotels
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cityCards.map((city) => (
            <li key={city.city}>
              <Link
                href={`/travel/hotels?destination=${encodeURIComponent(city.city)}`}
                className="group relative block overflow-hidden rounded-xl"
                data-testid={`destination-card-${city.slug}`}
              >
                {city.imageUrl ? (
                  <Photo src={city.imageUrl} alt="" className="h-32" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" testId={`destination-image-${city.slug}`} />
                ) : (
                  <SceneArt seed={city.city} className="h-32" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="font-bold">{city.city}</p>
                  <p className="text-xs text-slate-200">
                    {city.country} · {city.hotels} {city.hotels === 1 ? "hotel" : "hotels"} · from {formatCents(city.fromPriceCents)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
