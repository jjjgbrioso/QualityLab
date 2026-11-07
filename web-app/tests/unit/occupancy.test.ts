import { describe, expect, it } from "vitest";
import { peakOccupancy } from "@/lib/services/hotels";

const stay = { checkIn: "2030-06-01", checkOut: "2030-06-05" };

describe("peakOccupancy", () => {
  it("is zero with no bookings", () => {
    expect(peakOccupancy([], stay)).toBe(0);
  });

  it("counts two overlapping bookings as two", () => {
    expect(
      peakOccupancy(
        [
          { checkIn: "2030-06-01", checkOut: "2030-06-03" },
          { checkIn: "2030-06-02", checkOut: "2030-06-04" },
        ],
        stay,
      ),
    ).toBe(2);
  });

  it("counts back-to-back bookings as one room, because check-out day is free", () => {
    expect(
      peakOccupancy(
        [
          { checkIn: "2030-06-01", checkOut: "2030-06-03" },
          { checkIn: "2030-06-03", checkOut: "2030-06-05" },
        ],
        stay,
      ),
    ).toBe(1);
  });

  it("ignores a booking that ends on the check-in day", () => {
    expect(peakOccupancy([{ checkIn: "2030-05-28", checkOut: "2030-06-01" }], stay)).toBe(0);
  });

  it("ignores a booking that starts on the check-out day", () => {
    expect(peakOccupancy([{ checkIn: "2030-06-05", checkOut: "2030-06-08" }], stay)).toBe(0);
  });
});
