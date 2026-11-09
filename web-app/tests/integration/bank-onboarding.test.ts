import { expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { loginUser } from "@/lib/services/auth";
import { deposit, listAccounts, openAccount, recentTransactions, transfer, withdraw } from "@/lib/services/bank";
import { submitApplication, verifyOtp } from "@/lib/services/bank-onboarding";
import { bankApplicationSchema } from "@/lib/validation/bank-onboarding";
import { alice, balance, describeWithDatabase, failure, key } from "../helpers";

const application = (overrides: Record<string, unknown> = {}) =>
  bankApplicationSchema.parse({
    consent: { isAdult: true, isResident: true, hasValidId: true, acceptsTerms: true },
    contact: { mobileNumber: "0917 123 4567", email: "maria.santos@qualitylab.test" },
    otp: "123456",
    personal: {
      firstName: "Maria",
      lastName: "Santos",
      birthDate: "1995-06-15",
      birthPlace: "Quezon City",
      sex: "FEMALE",
      civilStatus: "SINGLE",
      nationality: "Filipino",
      mothersMaidenName: "Reyes",
    },
    address: { addressLine: "12 Mabini St", barangay: "San Isidro", city: "Makati", province: "Metro Manila", postalCode: "1234" },
    work: { employmentStatus: "EMPLOYED", employerName: "Sample Corp", occupation: "Engineer", sourceOfFunds: "SALARY", monthlyIncome: "20K_50K" },
    identification: { idType: "NATIONAL_ID", idNumber: "1234-5678-9012", selfieVerified: true },
    account: { product: "STARTER_SAVINGS", openingDepositCents: 1_000_00 },
    password: "Banking@123",
    ...overrides,
  });

const ALICE_CHECKING = "acct_alice_chk"; // ₱2,500.00
const ALICE_SAVINGS = "acct_alice_sav"; // ₱10,000.00
const asAlice = () => ({ actor: alice, idempotencyKey: key() });

describeWithDatabase("online account application", () => {
  it("checks the simulated one-time PIN", () => {
    expect(verifyOtp("123456")).toEqual({ verified: true });
    expect(() => verifyOtp("000000")).toThrowError(expect.objectContaining({ code: "INVALID_OTP" }));
  });

  it("opens the account, creates the login, and stores the profile", async () => {
    const result = await submitApplication(application());

    expect(result.applicationNumber).toMatch(/^APP-/);
    expect(result.account).toMatchObject({ name: "Starter Savings", type: "SAVINGS", product: "STARTER_SAVINGS", currency: "PHP", balanceCents: 1_000_00 });
    expect(result.account.accountNumber).toMatch(/^2\d{9}$/);

    const profile = await prisma.customerProfile.findUniqueOrThrow({ where: { userId: result.user.id } });
    expect(profile).toMatchObject({ mobileNumber: "+639171234567", city: "Makati", idType: "NATIONAL_ID" });
    const opening = await prisma.bankTransaction.findFirstOrThrow({ where: { accountId: result.account.id } });
    expect(opening).toMatchObject({ type: "DEPOSIT", amountCents: 1_000_00, description: "Opening deposit (simulated)" });

    await expect(loginUser({ email: "maria.santos@qualitylab.test", password: "Banking@123", module: "banking" })).resolves.toMatchObject({ module: "banking" });
  });

  it("refuses a wrong PIN, an ID that fails verification, and a low opening deposit", async () => {
    expect(await failure(submitApplication(application({ otp: "654321" })))).toMatchObject({ status: 422, code: "INVALID_OTP" });
    const badId = await failure(submitApplication(application({ identification: { idType: "UMID", idNumber: "CRN-0111-0000", idExpiry: "2035-01-01", selfieVerified: true } })));
    expect(badId).toMatchObject({ status: 422, code: "ID_VERIFICATION_FAILED" });
    expect(badId.details?.[0].field).toBe("identification.idNumber");
    const low = await failure(submitApplication(application({ account: { product: "EVERYDAY_CHECKING", openingDepositCents: 1_000_00 } })));
    expect(low).toMatchObject({ status: 422, code: "BELOW_MINIMUM_DEPOSIT" });
    expect(low.details?.[0].field).toBe("account.openingDepositCents");
    await expect(prisma.user.count({ where: { email: "maria.santos@qualitylab.test" } })).resolves.toBe(0);
  });

  it("refuses an email that already has a login", async () => {
    const error = await failure(submitApplication(application({ contact: { mobileNumber: "09171234567", email: "alice@qualitylab.test" } })));
    expect(error).toMatchObject({ status: 409, code: "EMAIL_ALREADY_REGISTERED" });
    expect(error.details?.[0].field).toBe("contact.email");
  });
});

describeWithDatabase("opening another account", () => {
  it("opens a savings account funded from checking", async () => {
    const { data } = await openAccount(asAlice(), { product: "STARTER_SAVINGS", sourceAccountId: ALICE_CHECKING, openingDepositCents: 500_00, nickname: "Travel fund" });
    expect(data.account).toMatchObject({ name: "Travel fund", type: "SAVINGS", balanceCents: 500_00, maturityDate: null, locked: false });
    expect(data.transaction).toMatchObject({ type: "TRANSFER_OUT", amountCents: 500_00, counterparty: data.account.accountNumber });
    expect(await balance(ALICE_CHECKING)).toBe(2_000_00);
    expect((await listAccounts("user_alice")).length).toBe(3);
  });

  it("opens a locked time deposit that refuses deposits, withdrawals, and transfers", async () => {
    const { data } = await openAccount(asAlice(), { product: "TIME_DEPOSIT", sourceAccountId: ALICE_SAVINGS, openingDepositCents: 10_000_00, termMonths: 6 });
    expect(data.account).toMatchObject({ type: "TIME_DEPOSIT", termMonths: 6, interestRateBps: 325, locked: true });
    expect(data.account.maturityDate! > new Date().toISOString().slice(0, 10)).toBe(true);
    expect(await balance(ALICE_SAVINGS)).toBe(0);

    const td = data.account.id;
    expect(await failure(withdraw(asAlice(), { accountId: td, amountCents: 100 }))).toMatchObject({ code: "TIME_DEPOSIT_LOCKED" });
    expect(await failure(deposit(asAlice(), { accountId: td, amountCents: 100 }))).toMatchObject({ code: "TIME_DEPOSIT_LOCKED" });
    expect(await failure(transfer(asAlice(), { fromAccountId: td, toAccountNumber: "1000000003", amountCents: 100 }))).toMatchObject({ code: "TIME_DEPOSIT_LOCKED" });
    expect(await failure(transfer(asAlice(), { fromAccountId: ALICE_CHECKING, toAccountNumber: data.account.accountNumber, amountCents: 100 }))).toMatchObject({ code: "TIME_DEPOSIT_LOCKED" });
  });

  it("refuses low deposits, missing funds, frozen sources, and other people's accounts", async () => {
    expect(await failure(openAccount(asAlice(), { product: "EVERYDAY_CHECKING", sourceAccountId: ALICE_SAVINGS, openingDepositCents: 4_999_00 }))).toMatchObject({ code: "BELOW_MINIMUM_DEPOSIT" });
    expect(await failure(openAccount(asAlice(), { product: "TIME_DEPOSIT", sourceAccountId: ALICE_CHECKING, openingDepositCents: 10_000_00, termMonths: 3 }))).toMatchObject({ code: "INSUFFICIENT_FUNDS" });
    const bob = { actor: { id: "user_bob", role: "CUSTOMER" }, idempotencyKey: key() };
    expect(await failure(openAccount(bob, { product: "STARTER_SAVINGS", sourceAccountId: "acct_bob_frz", openingDepositCents: 100_00 }))).toMatchObject({ code: "ACCOUNT_FROZEN" });
    expect(await failure(openAccount(bob, { product: "STARTER_SAVINGS", sourceAccountId: ALICE_CHECKING, openingDepositCents: 100_00 }))).toMatchObject({ status: 403 });
  });

  it("lists recent activity across accounts, newest first", async () => {
    await deposit(asAlice(), { accountId: ALICE_CHECKING, amountCents: 1_23 });
    const recent = await recentTransactions("user_alice", 3);
    expect(recent).toHaveLength(3);
    expect(recent[0]).toMatchObject({ amountCents: 1_23, accountNumber: "1000000001" });
  });
});
