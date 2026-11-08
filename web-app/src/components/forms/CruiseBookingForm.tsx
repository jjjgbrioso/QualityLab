"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { seaButton } from "@/components/travel";
import { Alert } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";
import { formatCents } from "@/lib/money";
import type { SailingDetailDto } from "@/lib/services/cruises";

type Cabin = SailingDetailDto["cabins"][number];

/** Choose a cabin type, guests, and the lead guest, then book. The server re-checks everything. */
export function CruiseBookingForm({ cabins }: { cabins: Cabin[] }) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit, setFieldErrors, reset } = useSubmit();
  const firstAvailable = cabins.find((cabin) => cabin.available);
  const [cabinId, setCabinId] = useState(firstAvailable?.id ?? "");
  const [guests, setGuests] = useState(2);

  const selected = cabins.find((cabin) => cabin.id === cabinId);
  const total = selected && guests >= 1 ? selected.pricePerGuestCents * guests : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();
    if (!cabinId) {
      setFieldErrors({ cabinId: "Choose a cabin type." });
      return;
    }
    const leadGuestName = String(new FormData(event.currentTarget).get("leadGuestName") ?? "");
    await submit(
      () => apiRequest<{ id: string }>("/cruise-bookings", { method: "POST", body: { cabinId, guests, leadGuestName } }),
      (booking) => {
        router.push(`/bookings/cruises/${booking.id}?booked=1`);
        router.refresh();
      },
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-5" data-testid="cruise-booking-form">
      {error ? <Alert tone="error" testId="cruise-booking-error">{error}</Alert> : null}

      <fieldset>
        <legend className="mb-2 font-semibold">1. Choose a cabin</legend>
        {fieldErrors.cabinId ? (
          <p className="mb-2 text-xs text-red-700" data-testid="cruise-cabin-error">{fieldErrors.cabinId}</p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {cabins.map((cabin) => {
            const key = cabin.type.toLowerCase().replace("_", "-");
            return (
              <label
                key={cabin.id}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 ${
                  cabin.id === cabinId ? "border-blue-800 bg-blue-50" : "border-line bg-surface"
                } ${cabin.available ? "" : "cursor-not-allowed opacity-60"}`}
                data-testid={`cabin-option-${key}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold">
                    <input
                      type="radio"
                      name="cabin"
                      value={cabin.id}
                      checked={cabin.id === cabinId}
                      disabled={!cabin.available}
                      onChange={() => setCabinId(cabin.id)}
                      aria-label={`${cabin.name}, ${formatCents(cabin.pricePerGuestCents)} per guest, ${cabin.available ? `${cabin.cabinsLeft} left` : "sold out"}`}
                      data-testid={`cabin-radio-${key}`}
                    />
                    {cabin.name}
                  </span>
                  {cabin.available ? (
                    <span className="text-xs text-emerald-700" data-testid={`cabin-left-${key}`}>{cabin.cabinsLeft} left</span>
                  ) : (
                    <span className="text-xs font-semibold text-red-700" data-testid={`cabin-sold-out-${key}`}>Sold out</span>
                  )}
                </span>
                <span className="text-lg font-bold text-blue-900" data-testid={`cabin-price-${key}`}>
                  {formatCents(cabin.pricePerGuestCents)} <span className="text-xs font-normal text-muted">per guest</span>
                </span>
                <span className="text-xs text-muted">Sleeps up to {cabin.maxGuests}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-semibold">2. Guest information</legend>
        <Field
          label="Guests"
          name="guests"
          type="number"
          min={1}
          max={10}
          value={guests}
          onChange={(event) => setGuests(Number(event.target.value))}
          testId="cruise-guests"
          hint={selected ? `This cabin sleeps up to ${selected.maxGuests}.` : undefined}
          error={fieldErrors.guests}
        />
        <Field label="Lead guest name" name="leadGuestName" autoComplete="name" testId="cruise-lead-guest" error={fieldErrors.leadGuestName} />
      </fieldset>

      <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-300">Total for {guests >= 1 ? guests : 0} {guests === 1 ? "guest" : "guests"}</p>
          <p className="text-2xl font-bold" data-testid="cruise-booking-total">{total === null ? "-" : formatCents(total)}</p>
        </div>
        <button type="submit" disabled={!ready || pending || !firstAvailable} className={seaButton} data-testid="cruise-booking-submit-button">
          {pending ? "Booking..." : "Book this cruise"}
        </button>
      </div>
    </form>
  );
}
