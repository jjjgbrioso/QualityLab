import { buttonStyles, inputStyles } from "@/components/ui";

/** Plain GET form, so the chosen dates live in the URL and work without JavaScript. */
export function StayFilter({
  action,
  checkIn,
  checkOut,
  guests,
}: {
  action: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3" data-testid="stay-filter-form">
      <div>
        <label htmlFor="checkIn" className="mb-1 block text-xs font-medium">Check-in</label>
        <input id="checkIn" name="checkIn" type="date" defaultValue={checkIn ?? ""} className={inputStyles} data-testid="stay-check-in-input" />
      </div>
      <div>
        <label htmlFor="checkOut" className="mb-1 block text-xs font-medium">Check-out</label>
        <input id="checkOut" name="checkOut" type="date" defaultValue={checkOut ?? ""} className={inputStyles} data-testid="stay-check-out-input" />
      </div>
      <div className="w-24">
        <label htmlFor="guests" className="mb-1 block text-xs font-medium">Guests</label>
        <input id="guests" name="guests" type="number" min={1} max={10} defaultValue={guests ?? 2} className={inputStyles} data-testid="stay-guests-input" />
      </div>
      <button type="submit" className={buttonStyles.primary} data-testid="stay-check-availability-button">
        Check availability
      </button>
    </form>
  );
}
