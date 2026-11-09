import type { Loan, LoanApplication, LoanInstalment, Prisma } from "@/generated/prisma/client";
import { ApiError, forbidden, notFound } from "@/lib/api/errors";
import { formatDateOnly, parseDateOnly, todayUtc } from "@/lib/dates";
import { reference } from "@/lib/ids";
import { creditCheck, loanSchedule, quoteLoan } from "@/lib/loans";
import { prisma } from "@/lib/prisma";
import {
  accountNotFound,
  assertActive,
  assertNotLocked,
  assertNotTimeDepositInflow,
  assertSufficientFunds,
  type Idempotent,
  lockAccounts,
  ownedAccount,
  toTransactionDto,
} from "@/lib/services/bank";
import { withIdempotency } from "@/lib/services/idempotency";
import { ageOn } from "@/lib/validation/bank-onboarding";
import type { AcceptOfferInput, LoanApplicationInput, LoanPaymentInput } from "@/lib/validation/loans";

type Actor = { id: string; role: string };
type Tx = Prisma.TransactionClient;
type LoanWithInstalments = Loan & { instalments: LoanInstalment[] };

export function toApplicationDto(application: LoanApplication & { loan?: { id: string } | null }) {
  const guarantor = application.guarantor as { firstName?: string; lastName?: string; relationship?: string } | null;
  const offered = application.offeredAmountCents;
  return {
    id: application.id,
    referenceNumber: application.referenceNumber,
    status: application.status,
    requestedAmountCents: application.requestedAmountCents,
    termMonths: application.termMonths,
    purpose: application.purpose,
    creditScore: application.creditScore,
    debtToIncomePercent: application.debtToIncomePercent,
    decisionReasons: application.decisionReasons,
    offeredAmountCents: offered,
    counterOffer: offered !== null && offered < application.requestedAmountCents,
    offer: offered !== null ? quoteLoan(offered, application.termMonths) : null,
    withGuarantor: guarantor !== null,
    guarantorName: guarantor ? `${guarantor.firstName} ${guarantor.lastName}` : null,
    guarantorRelationship: guarantor?.relationship ?? null,
    loanId: application.loan?.id ?? null,
    createdAt: application.createdAt.toISOString(),
    closedAt: application.closedAt?.toISOString() ?? null,
  };
}

function toInstalmentDto(instalment: LoanInstalment, today: string) {
  const dueDate = formatDateOnly(instalment.dueDate);
  return {
    number: instalment.number,
    dueDate,
    principalCents: instalment.principalCents,
    interestCents: instalment.interestCents,
    amountCents: instalment.amountCents,
    status: instalment.paidAt ? "PAID" : dueDate < today ? "OVERDUE" : "UNPAID",
    paidAt: instalment.paidAt?.toISOString() ?? null,
    paymentReference: instalment.paymentReference,
  };
}

export function toLoanDto(loan: LoanWithInstalments) {
  const today = todayUtc();
  const instalments = [...loan.instalments].sort((a, b) => a.number - b.number).map((item) => toInstalmentDto(item, today));
  const next = instalments.find((item) => item.status !== "PAID") ?? null;
  return {
    id: loan.id,
    loanNumber: loan.loanNumber,
    applicationId: loan.applicationId,
    status: loan.status,
    principalCents: loan.principalCents,
    termMonths: loan.termMonths,
    monthlyRateBps: loan.monthlyRateBps,
    processingFeeCents: loan.processingFeeCents,
    netProceedsCents: loan.netProceedsCents,
    monthlyInstalmentCents: loan.monthlyInstalmentCents,
    totalPayableCents: loan.totalPayableCents,
    outstandingCents: loan.outstandingCents,
    disbursementAccountId: loan.disbursementAccountId,
    releasedOn: formatDateOnly(loan.releasedOn),
    paidOffAt: loan.paidOffAt?.toISOString() ?? null,
    instalmentsPaid: instalments.filter((item) => item.status === "PAID").length,
    nextInstalment: next,
    instalments,
  };
}

export type LoanApplicationDto = ReturnType<typeof toApplicationDto>;
export type LoanDto = ReturnType<typeof toLoanDto>;

function assertOwner(actor: Actor, ownerId: string, what: string) {
  if (ownerId !== actor.id && actor.role !== "ADMIN") throw forbidden(`This ${what} belongs to another user.`);
}

/** Runs the credit check straight away and records the decision, with an offer when approved. */
export async function submitLoanApplication(actor: Actor, input: LoanApplicationInput) {
  const open = await prisma.loanApplication.findFirst({ where: { userId: actor.id, status: "OFFERED" } });
  if (open) {
    throw new ApiError(409, "OPEN_LOAN_OFFER", `Application ${open.referenceNumber} has an offer waiting. Accept or decline it first.`);
  }

  const [accounts, activeLoans] = await Promise.all([
    prisma.bankAccount.findMany({ where: { userId: actor.id, status: "ACTIVE" } }),
    prisma.loan.findMany({ where: { userId: actor.id, status: "ACTIVE" } }),
  ]);
  const decision = creditCheck({
    amountCents: input.loan.amountCents,
    termMonths: input.loan.termMonths,
    borrowerAge: ageOn(input.borrower.birthDate, todayUtc()),
    monthlyIncomeCents: input.employment.monthlyIncomeCents,
    // Payments on this bank's own loans count too, so a second loan cannot overstretch the borrower.
    otherLoanPaymentsCents: input.interview.otherLoanPaymentsCents + activeLoans.reduce((sum, loan) => sum + loan.monthlyInstalmentCents, 0),
    employmentMonths: input.employment.employmentMonths,
    missedPayments: input.interview.missedPayments,
    legalIssues: input.interview.legalIssues,
    residenceType: input.addresses.current.residenceType,
    dependents: input.interview.dependents,
    depositBalanceCents: accounts.reduce((sum, account) => sum + account.balanceCents, 0),
    guarantor: input.withGuarantor && input.guarantor ? { monthlyIncomeCents: input.guarantor.monthlyIncomeCents, missedPayments: input.guarantor.missedPayments } : null,
  });

  const quote = quoteLoan(input.loan.amountCents, input.loan.termMonths);
  const application = await prisma.loanApplication.create({
    data: {
      referenceNumber: reference("LNA"),
      userId: actor.id,
      status: decision.decision,
      requestedAmountCents: input.loan.amountCents,
      termMonths: input.loan.termMonths,
      purpose: input.loan.purpose,
      borrower: input.borrower,
      addresses: input.addresses,
      employment: input.employment,
      interview: { ...input.interview, purposeDetails: input.loan.purposeDetails ?? null },
      guarantor: input.withGuarantor && input.guarantor ? input.guarantor : undefined,
      creditScore: decision.score,
      debtToIncomePercent: decision.debtToIncomePercent,
      decisionReasons: decision.reasons,
      offeredAmountCents: decision.offeredAmountCents,
      monthlyRateBps: quote.monthlyRateBps,
      processingFeeCents: quote.processingFeeCents,
      closedAt: decision.decision === "DECLINED" ? new Date() : null,
    },
  });
  return toApplicationDto(application);
}

export async function listLoanActivity(userId: string) {
  const [applications, loans] = await Promise.all([
    prisma.loanApplication.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], include: { loan: { select: { id: true } } } }),
    prisma.loan.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], include: { instalments: true } }),
  ]);
  return { applications: applications.map(toApplicationDto), loans: loans.map(toLoanDto) };
}

export async function getLoanApplication(actor: Actor, id: string) {
  const application = await prisma.loanApplication.findUnique({ where: { id }, include: { loan: { select: { id: true } } } });
  if (!application) throw notFound("Loan application", "LOAN_APPLICATION_NOT_FOUND");
  assertOwner(actor, application.userId, "loan application");
  return toApplicationDto(application);
}

const offerNotOpen = (status: string) =>
  new ApiError(409, "OFFER_NOT_OPEN", `This application is ${status.toLowerCase()}, so its offer cannot be accepted or declined.`);

export async function declineLoanOffer(actor: Actor, id: string) {
  const application = await prisma.loanApplication.findUnique({ where: { id } });
  if (!application) throw notFound("Loan application", "LOAN_APPLICATION_NOT_FOUND");
  assertOwner(actor, application.userId, "loan application");
  const updated = await prisma.loanApplication.updateMany({ where: { id, status: "OFFERED" }, data: { status: "CANCELLED", closedAt: new Date() } });
  if (updated.count === 0) throw offerNotOpen(application.status);
  return getLoanApplication(actor, id);
}

async function lockRow(tx: Tx, table: "LoanApplication" | "Loan", id: string) {
  if (table === "LoanApplication") await tx.$queryRaw`SELECT id FROM "LoanApplication" WHERE id = ${id} FOR UPDATE`;
  else await tx.$queryRaw`SELECT id FROM "Loan" WHERE id = ${id} FOR UPDATE`;
}

/** Availment: the borrower accepts the offer, and the amount less the processing fee is released. */
export function acceptLoanOffer({ actor, idempotencyKey }: Idempotent, id: string, input: AcceptOfferInput) {
  return withIdempotency({ userId: actor.id, key: idempotencyKey, scope: "bank.loan-accept", payload: { id, ...input } }, async (tx) => {
    await lockRow(tx, "LoanApplication", id);
    const application = await tx.loanApplication.findUnique({ where: { id } });
    if (!application) throw notFound("Loan application", "LOAN_APPLICATION_NOT_FOUND");
    assertOwner(actor, application.userId, "loan application");
    if (application.status !== "OFFERED" || application.offeredAmountCents === null) throw offerNotOpen(application.status);

    await ownedAccount(actor, input.disbursementAccountId, tx).catch((error) => {
      if (error instanceof ApiError && error.status === 404) throw accountNotFound("disbursementAccountId");
      throw error;
    });
    const account = (await lockAccounts(tx, [input.disbursementAccountId])).get(input.disbursementAccountId)!;
    assertActive(account);
    assertNotTimeDepositInflow(account);

    const quote = quoteLoan(application.offeredAmountCents, application.termMonths);
    const releasedOn = todayUtc();
    const shared = reference("LND");
    const loan = await tx.loan.create({
      data: {
        loanNumber: reference("LN", 8),
        applicationId: application.id,
        userId: application.userId,
        principalCents: quote.amountCents,
        termMonths: quote.termMonths,
        monthlyRateBps: quote.monthlyRateBps,
        processingFeeCents: quote.processingFeeCents,
        netProceedsCents: quote.netProceedsCents,
        monthlyInstalmentCents: quote.monthlyInstalmentCents,
        totalPayableCents: quote.totalPayableCents,
        outstandingCents: quote.totalPayableCents,
        disbursementAccountId: account.id,
        releasedOn: parseDateOnly(releasedOn),
        instalments: {
          create: loanSchedule(quote.amountCents, quote.termMonths, releasedOn).map((item) => ({ ...item, dueDate: parseDateOnly(item.dueDate) })),
        },
      },
      include: { instalments: true },
    });

    const balanceAfterCents = account.balanceCents + quote.netProceedsCents;
    await tx.bankAccount.update({ where: { id: account.id }, data: { balanceCents: balanceAfterCents } });
    const transaction = await tx.bankTransaction.create({
      data: {
        reference: shared,
        accountId: account.id,
        type: "LOAN_DISBURSEMENT",
        amountCents: quote.netProceedsCents,
        balanceAfterCents,
        counterparty: loan.loanNumber,
        description: `Loan ${loan.loanNumber} released, less the processing fee`,
      },
    });
    await tx.loanApplication.update({ where: { id }, data: { status: "AVAILED", closedAt: new Date() } });
    return { loan: toLoanDto(loan), transaction: toTransactionDto(transaction) };
  });
}

export async function getLoan(actor: Actor, id: string) {
  const loan = await prisma.loan.findUnique({ where: { id }, include: { instalments: true } });
  if (!loan) throw notFound("Loan", "LOAN_NOT_FOUND");
  assertOwner(actor, loan.userId, "loan");
  return toLoanDto(loan);
}

/** Settlement: pays the next unpaid instalment from one of the borrower's accounts. */
export function payLoanInstalment({ actor, idempotencyKey }: Idempotent, id: string, input: LoanPaymentInput) {
  return withIdempotency({ userId: actor.id, key: idempotencyKey, scope: "bank.loan-payment", payload: { id, ...input } }, async (tx) => {
    await lockRow(tx, "Loan", id);
    const loan = await tx.loan.findUnique({ where: { id }, include: { instalments: true } });
    if (!loan) throw notFound("Loan", "LOAN_NOT_FOUND");
    assertOwner(actor, loan.userId, "loan");
    const next = [...loan.instalments].sort((a, b) => a.number - b.number).find((item) => !item.paidAt);
    if (loan.status === "PAID_OFF" || !next) throw new ApiError(409, "LOAN_ALREADY_PAID_OFF", `Loan ${loan.loanNumber} is already paid off.`);

    await ownedAccount(actor, input.fromAccountId, tx).catch((error) => {
      if (error instanceof ApiError && error.status === 404) throw accountNotFound("fromAccountId");
      throw error;
    });
    const account = (await lockAccounts(tx, [input.fromAccountId])).get(input.fromAccountId)!;
    assertActive(account);
    assertNotLocked(account);
    assertSufficientFunds(account, next.amountCents);

    const balanceAfterCents = account.balanceCents - next.amountCents;
    const paymentReference = reference("LNP");
    await tx.bankAccount.update({ where: { id: account.id }, data: { balanceCents: balanceAfterCents } });
    const transaction = await tx.bankTransaction.create({
      data: {
        reference: paymentReference,
        accountId: account.id,
        type: "LOAN_PAYMENT",
        amountCents: next.amountCents,
        balanceAfterCents,
        counterparty: loan.loanNumber,
        description: `Loan ${loan.loanNumber} payment ${next.number} of ${loan.termMonths}`,
      },
    });
    await tx.loanInstalment.update({
      where: { id: next.id },
      data: { paidAt: new Date(), paidFromAccountId: account.id, paymentReference },
    });
    const outstandingCents = loan.outstandingCents - next.amountCents;
    const paidOff = next.number === loan.termMonths;
    const updated = await tx.loan.update({
      where: { id },
      data: { outstandingCents, ...(paidOff ? { status: "PAID_OFF", paidOffAt: new Date() } : {}) },
      include: { instalments: true },
    });
    return { loan: toLoanDto(updated), transaction: toTransactionDto(transaction) };
  });
}
