"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

type Stay = { roomId: string; checkIn: string; checkOut: string; guests: number };

/** Collects the lead guest's name, then books the stay. */
export function BookRoomButton(stay: Stay) {
  const router = useRouter();
  const { ready, pending, error, fieldErrors, submit } = useSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const leadGuestName = String(new FormData(event.currentTarget).get("leadGuestName") ?? "");
    await submit(
      () => apiRequest<{ id: string }>("/bookings", { method: "POST", body: { ...stay, leadGuestName } }),
      (booking) => {
        router.push(`/bookings/${booking.id}?booked=1`);
        router.refresh();
      },
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-3" data-testid="booking-form">
      {error ? <Alert tone="error" testId="booking-error">{error}</Alert> : null}
      <Field
        label="Lead guest name"
        name="leadGuestName"
        autoComplete="name"
        hint="The name the booking is under."
        testId="booking-lead-guest"
        error={fieldErrors.leadGuestName}
      />
      <button type="submit" disabled={!ready || pending} className={`${buttonStyles.primary} w-full`} data-testid="booking-submit-button">
        {pending ? "Booking..." : "Confirm booking"}
      </button>
    </form>
  );
}
