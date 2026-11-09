import { ApiError } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import { BANK_PRODUCTS } from "@/lib/bank-products";
import { parseDateOnly } from "@/lib/dates";
import { newAccountNumber, reference } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { toUserDto } from "@/lib/services/auth";
import { belowMinimum, toAccountDto } from "@/lib/services/bank";
import { type BankApplicationInput, FAILING_ID_SUFFIX, TEST_OTP } from "@/lib/validation/bank-onboarding";

const invalidOtp = (field: string) =>
  new ApiError(422, "INVALID_OTP", "The one-time PIN is incorrect. In this demo it is always 123456.", [
    { field, message: "Incorrect PIN." },
  ]);

/** Simulates checking the PIN sent to the applicant's mobile and email. Nothing is actually sent. */
export function verifyOtp(otp: string) {
  if (otp !== TEST_OTP) throw invalidOtp("otp");
  return { verified: true };
}

/**
 * Opens a new customer's first account: creates their login, their profile, and the account,
 * with the opening deposit simulated as already received.
 */
export async function submitApplication(input: BankApplicationInput) {
  if (input.otp !== TEST_OTP) throw invalidOtp("otp");
  if (input.identification.idNumber.endsWith(FAILING_ID_SUFFIX)) {
    throw new ApiError(422, "ID_VERIFICATION_FAILED", "We could not verify this ID. Check the details or use another ID.", [
      { field: "identification.idNumber", message: "This ID could not be verified." },
    ]);
  }
  const product = BANK_PRODUCTS[input.account.product];
  if (input.account.openingDepositCents < product.minimumOpeningCents) {
    const error = belowMinimum(product.minimumOpeningCents);
    throw new ApiError(error.status, error.code, error.message, [{ field: "account.openingDepositCents", message: error.details![0].message }]);
  }

  const { personal, address, work, identification, contact, account } = input;
  const passwordHash = await hashPassword(input.password);
  const deposit = account.openingDepositCents;

  try {
    const user = await prisma.user.create({
      data: {
        email: contact.email,
        firstName: personal.firstName,
        lastName: personal.lastName,
        passwordHash,
        profile: {
          create: {
            middleName: personal.middleName,
            suffix: personal.suffix,
            birthDate: parseDateOnly(personal.birthDate),
            birthPlace: personal.birthPlace,
            sex: personal.sex,
            civilStatus: personal.civilStatus,
            nationality: personal.nationality,
            mothersMaidenName: personal.mothersMaidenName,
            mobileNumber: contact.mobileNumber,
            ...address,
            employmentStatus: work.employmentStatus,
            employerName: work.employerName,
            occupation: work.occupation,
            sourceOfFunds: work.sourceOfFunds,
            monthlyIncome: work.monthlyIncome,
            tin: work.tin,
            idType: identification.idType,
            idNumber: identification.idNumber,
            idExpiry: identification.idExpiry ? parseDateOnly(identification.idExpiry) : null,
          },
        },
        bankAccounts: {
          create: {
            accountNumber: newAccountNumber(),
            name: product.name,
            type: product.type,
            product: product.code,
            balanceCents: deposit,
            interestRateBps: product.ratesBps[0],
            transactions: {
              create: {
                reference: reference("TXN"),
                type: "DEPOSIT",
                amountCents: deposit,
                balanceAfterCents: deposit,
                description: "Opening deposit (simulated)",
              },
            },
          },
        },
      },
      include: { bankAccounts: true },
    });
    return {
      applicationNumber: reference("APP"),
      user: toUserDto(user),
      account: toAccountDto(user.bankAccounts[0]),
    };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists. Sign in instead.", [
        { field: "contact.email", message: "An account with this email already exists." },
      ]);
    }
    throw error;
  }
}
