import { expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { acceptLoanOffer, declineLoanOffer, getLoan, listLoanActivity, payLoanInstalment, submitLoanApplication } from "@/lib/services/loans";
import { loanApplicationSchema } from "@/lib/validation/loans";
import { alice, balance, bob, describeWithDatabase, failure, key } from "../helpers";

const address = { addressLine: "12 Mabini St", barangay: "San Isidro", city: "Makati", province: "Metro Manila", postalCode: "1234" };

const application = (overrides: { amount?: number; term?: number; income?: number; missed?: boolean; guarantor?: boolean; years?: number } = {}) =>
  loanApplicationSchema.parse({
    loan: { amountCents: overrides.amount ?? 100_000_00, termMonths: overrides.term ?? 12, purpose: "HOME_IMPROVEMENT" },
    borrower: { firstName: "Alice", lastName: "Tester", birthDate: "1995-06-15", civilStatus: "SINGLE", mobileNumber: "09171234567", idType: "NATIONAL_ID", idNumber: "1234-5678-9012" },
    addresses: {
      current: { ...address, yearsAtAddress: overrides.years ?? 5, residenceType: "OWNED" },
      ...(overrides.years !== undefined && overrides.years < 2 ? { previous: { ...address, addressLine: "7 Rizal Ave" } } : {}),
    },
    employment: { employmentType: "EMPLOYED", employerName: "Sample Corp", position: "Engineer", employmentMonths: 36, monthlyIncomeCents: overrides.income ?? 80_000_00 },
    interview: { monthlyExpensesCents: 25_000_00, otherLoanPaymentsCents: 0, dependents: 1, repaymentSource: "SALARY", missedPayments: overrides.missed ?? false, legalIssues: false, hasOtherBankLoans: false },
    withGuarantor: overrides.guarantor ?? false,
    ...(overrides.guarantor
      ? {
          guarantor: {
            firstName: "Grace", lastName: "Tester", relationship: "PARENT", birthDate: "1965-03-01", mobileNumber: "09181234567", email: "grace@qualitylab.test",
            idType: "PASSPORT", idNumber: "P7654321", addresses: { current: { ...address, yearsAtAddress: 1, residenceType: "OWNED" }, previous: address },
            employmentType: "EMPLOYED", employerName: "Sample Corp", monthlyIncomeCents: 60_000_00, missedPayments: false, consents: true,
          },
        }
      : {}),
    consents: { authorizesCreditCheck: true, confirmsTruthful: true, acceptsPrivacy: true },
  });

const ALICE_CHECKING = "acct_alice_chk"; // ₱2,500.00
const ALICE_SAVINGS = "acct_alice_sav"; // ₱10,000.00
const as = (actor: { id: string; role: string }) => ({ actor, idempotencyKey: key() });

describeWithDatabase("loan applications and the credit check", () => {
  it("approves, stores the full details, and blocks a second application while the offer is open", async () => {
    const result = await submitLoanApplication(alice, application({ years: 1 }));
    expect(result).toMatchObject({ status: "OFFERED", requestedAmountCents: 100_000_00, offeredAmountCents: 100_000_00, counterOffer: false, withGuarantor: false });
    expect(result.referenceNumber).toMatch(/^LNA-/);
    expect(result.offer).toMatchObject({ monthlyInstalmentCents: 9_533_33, netProceedsCents: 98_500_00 });

    const stored = await prisma.loanApplication.findUniqueOrThrow({ where: { id: result.id } });
    expect((stored.addresses as { previous: { addressLine: string } }).previous.addressLine).toBe("7 Rizal Ave");
    expect(await failure(submitLoanApplication(alice, application()))).toMatchObject({ status: 409, code: "OPEN_LOAN_OFFER" });
  });

  it("counter-offers and declines with reasons, and records a guarantor", async () => {
    const counter = await submitLoanApplication(alice, application({ amount: 300_000_00, income: 40_000_00 }));
    expect(counter).toMatchObject({ status: "OFFERED", counterOffer: true, offeredAmountCents: 167_000_00 });
    await declineLoanOffer(alice, counter.id);

    const declined = await submitLoanApplication(alice, application({ missed: true }));
    expect(declined).toMatchObject({ status: "DECLINED", offeredAmountCents: null, offer: null });
    expect(declined.decisionReasons[0]).toContain("no guarantor");

    const guaranteed = await submitLoanApplication(alice, application({ missed: true, guarantor: true }));
    expect(guaranteed).toMatchObject({ status: "OFFERED", withGuarantor: true, guarantorName: "Grace Tester", guarantorRelationship: "PARENT" });
  });

  it("refuses to accept or decline a closed offer, and keeps other people out", async () => {
    const result = await submitLoanApplication(alice, application());
    await declineLoanOffer(alice, result.id);
    expect(await failure(declineLoanOffer(alice, result.id))).toMatchObject({ status: 409, code: "OFFER_NOT_OPEN" });
    expect(await failure(acceptLoanOffer(as(alice), result.id, { disbursementAccountId: ALICE_CHECKING, acceptsDisclosure: true }))).toMatchObject({ code: "OFFER_NOT_OPEN" });
    expect(await failure(declineLoanOffer(bob, result.id))).toMatchObject({ status: 403 });
  });
});

describeWithDatabase("availment and settlement", () => {
  it("releases the loan less the fee, then settles it instalment by instalment", async () => {
    const offer = await submitLoanApplication(alice, application({ amount: 20_000_00, term: 6 }));
    const { data } = await acceptLoanOffer(as(alice), offer.id, { disbursementAccountId: ALICE_CHECKING, acceptsDisclosure: true });

    expect(data.loan).toMatchObject({ status: "ACTIVE", principalCents: 20_000_00, netProceedsCents: 18_500_00, totalPayableCents: 21_440_00, outstandingCents: 21_440_00, instalmentsPaid: 0 });
    expect(data.loan.instalments).toHaveLength(6);
    expect(data.transaction).toMatchObject({ type: "LOAN_DISBURSEMENT", amountCents: 18_500_00 });
    expect(await balance(ALICE_CHECKING)).toBe(21_000_00);
    expect((await listLoanActivity("user_alice")).applications[0].status).toBe("AVAILED");

    // ₱21,000.00 in checking cannot cover ₱21,440.00, so the last instalment comes from savings.
    for (let number = 1; number <= 6; number += 1) {
      const { data: paid } = await payLoanInstalment(as(alice), data.loan.id, { fromAccountId: number < 6 ? ALICE_CHECKING : ALICE_SAVINGS });
      expect(paid.transaction).toMatchObject({ type: "LOAN_PAYMENT" });
      expect(paid.loan.instalmentsPaid).toBe(number);
    }
    const loan = await getLoan(alice, data.loan.id);
    expect(loan).toMatchObject({ status: "PAID_OFF", outstandingCents: 0, nextInstalment: null });
    expect(await balance(ALICE_CHECKING)).toBe(21_000_00 - 5 * 3_573_33);
    expect(await balance(ALICE_SAVINGS)).toBe(10_000_00 - 3_573_35);
    expect(await failure(payLoanInstalment(as(alice), data.loan.id, { fromAccountId: ALICE_CHECKING }))).toMatchObject({ status: 409, code: "LOAN_ALREADY_PAID_OFF" });
  });

  it("refuses payments without enough money, from frozen accounts, or by other people", async () => {
    const offer = await submitLoanApplication(alice, application({ amount: 20_000_00, term: 6 }));
    const { data } = await acceptLoanOffer(as(alice), offer.id, { disbursementAccountId: ALICE_SAVINGS, acceptsDisclosure: true });
    await prisma.bankAccount.update({ where: { id: ALICE_CHECKING }, data: { balanceCents: 100 } });

    expect(await failure(payLoanInstalment(as(alice), data.loan.id, { fromAccountId: ALICE_CHECKING }))).toMatchObject({ code: "INSUFFICIENT_FUNDS" });
    expect(await failure(payLoanInstalment(as(bob), data.loan.id, { fromAccountId: "acct_bob_chk" }))).toMatchObject({ status: 403 });
    expect(await failure(getLoan(bob, data.loan.id))).toMatchObject({ status: 403 });
    await prisma.bankAccount.update({ where: { id: ALICE_CHECKING }, data: { status: "FROZEN", balanceCents: 1_000_000_00 } });
    expect(await failure(payLoanInstalment(as(alice), data.loan.id, { fromAccountId: ALICE_CHECKING }))).toMatchObject({ code: "ACCOUNT_FROZEN" });
  });

  it("counts this bank's own loan payments in the next credit check", async () => {
    const first = await submitLoanApplication(alice, application({ amount: 300_000_00, term: 12, income: 80_000_00 }));
    await acceptLoanOffer(as(alice), first.id, { disbursementAccountId: ALICE_CHECKING, acceptsDisclosure: true });
    const second = await submitLoanApplication(alice, application({ amount: 300_000_00, term: 12, income: 80_000_00 }));
    expect(second.debtToIncomePercent).toBeGreaterThan(first.debtToIncomePercent);
    expect(second.counterOffer).toBe(true);
  });
});
