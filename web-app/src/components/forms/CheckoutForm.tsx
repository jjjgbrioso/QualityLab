"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Field } from "@/components/forms/fields";
import { Alert, buttonStyles, Card } from "@/components/ui";
import { apiRequest } from "@/lib/client/api";
import { useSubmit } from "@/lib/client/use-submit";

export function CheckoutForm() {
  const router = useRouter();
  const { pending, error, fieldErrors, submit } = useSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "");
    const body = {
      shipping: {
        fullName: value("fullName"),
        address: value("address"),
        city: value("city"),
        postcode: value("postcode"),
        country: value("country"),
      },
      payment: {
        cardholderName: value("cardholderName"),
        cardNumber: value("cardNumber"),
        expiry: value("expiry"),
        cvv: value("cvv"),
      },
    };
    await submit(
      () => apiRequest<{ id: string }>("/orders", { method: "POST", body }),
      (order) => {
        router.push(`/orders/${order.id}?placed=1`);
        router.refresh();
      },
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="checkout-form">
      {error ? <Alert tone="error" testId="checkout-error">{error}</Alert> : null}

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Shipping details</h2>
        <Field label="Full name" name="fullName" autoComplete="off" testId="checkout-full-name" error={fieldErrors["shipping.fullName"]} />
        <Field label="Address" name="address" autoComplete="off" testId="checkout-address" error={fieldErrors["shipping.address"]} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" name="city" autoComplete="off" testId="checkout-city" error={fieldErrors["shipping.city"]} />
          <Field label="Postcode" name="postcode" autoComplete="off" testId="checkout-postcode" error={fieldErrors["shipping.postcode"]} />
          <Field label="Country" name="country" autoComplete="off" testId="checkout-country" error={fieldErrors["shipping.country"]} />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Simulated payment</h2>
        <Alert tone="warning" testId="checkout-test-card-notice">
          No real payment is made. Only test cards are accepted: 4242 4242 4242 4242 (approved), 4000 0000 0000 0002
          (declined), or 4000 0000 0000 9995 (insufficient funds).
        </Alert>
        <Field label="Cardholder name" name="cardholderName" autoComplete="off" testId="checkout-card-name" error={fieldErrors["payment.cardholderName"]} />
        <Field label="Card number" name="cardNumber" inputMode="numeric" autoComplete="off" testId="checkout-card-number" error={fieldErrors["payment.cardNumber"]} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiry (MM/YY)" name="expiry" placeholder="12/30" autoComplete="off" testId="checkout-card-expiry" error={fieldErrors["payment.expiry"]} />
          <Field label="CVV" name="cvv" inputMode="numeric" autoComplete="off" testId="checkout-card-cvv" error={fieldErrors["payment.cvv"]} />
        </div>
      </Card>

      <button type="submit" disabled={pending} className={`${buttonStyles.primary} w-full`} data-testid="checkout-submit-button">
        {pending ? "Placing order..." : "Place order"}
      </button>
    </form>
  );
}
