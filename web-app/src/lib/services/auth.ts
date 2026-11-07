import { ApiError } from "@/lib/api/errors";
import { signToken } from "@/lib/auth/jwt";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/auth/password";
import { newAccountNumber, reference } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";

/** Simulated opening balance, so a newly registered user can try banking straight away. */
export const OPENING_BALANCE_CENTS = 100_000;

type UserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: Date;
};

export function toUserDto(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUser(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        bankAccounts: {
          create: {
            accountNumber: newAccountNumber(),
            name: "Everyday Checking",
            type: "CHECKING",
            balanceCents: OPENING_BALANCE_CENTS,
            transactions: {
              create: {
                reference: reference("TXN"),
                type: "DEPOSIT",
                amountCents: OPENING_BALANCE_CENTS,
                balanceAfterCents: OPENING_BALANCE_CENTS,
                description: "Simulated opening balance",
              },
            },
          },
        },
      },
    });
    return toUserDto(user);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", [
        { field: "email", message: "An account with this email already exists." },
      ]);
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = user
    ? await verifyPassword(input.password, user.passwordHash)
    : await burnPasswordCheck(input.password).then(() => false);

  if (!user || !passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
  }
  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "ACCOUNT_DISABLED", "This account has been disabled.");
  }

  const { token, expiresIn } = await signToken(user.id, user.role);
  return { token, expiresIn, user: toUserDto(user) };
}

/** Ends one token, leaving other sessions for the same user active. */
export async function revokeToken(jti: string, expiresAt: Date) {
  await prisma.revokedToken.upsert({
    where: { jti },
    create: { jti, expiresAt },
    update: {},
  });
  await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
