"use client";

import { useRouter } from "next/navigation";
import { Alert, buttonStyles } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

type Stay = { roomId: string; checkIn: string; checkOut: string; guests: number };

export function BookRoomButton(stay: Stay) {
  const router = useRouter();
  const { pending, error, submit } = useSubmit();

  const book = () =>
    submit(
      () => apiRequest<{ id: string }>("/bookings", { method: "POST", body: stay }),
      (booking) => {
        router.push(`/bookings/${booking.id}?booked=1`);
        router.refresh();
      },
    );

  return (
    <div className="space-y-2">
      {error ? <Alert tone="error" testId="booking-error">{error}</Alert> : null}
      <button type="button" disabled={pending} onClick={book} className={buttonStyles.primary} data-testid="booking-submit-button">
        {pending ? "Booking..." : "Confirm booking"}
      </button>
    </div>
  );
}
