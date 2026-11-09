-- AlterEnum
ALTER TYPE "BankAccountType" ADD VALUE 'TIME_DEPOSIT';

-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN     "interestRateBps" INTEGER,
ADD COLUMN     "maturityDate" DATE,
ADD COLUMN     "product" TEXT,
ADD COLUMN     "termMonths" INTEGER,
ALTER COLUMN "currency" SET DEFAULT 'PHP';

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "userId" TEXT NOT NULL,
    "middleName" TEXT,
    "suffix" TEXT,
    "birthDate" DATE NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "civilStatus" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "mothersMaidenName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL,
    "employerName" TEXT,
    "occupation" TEXT NOT NULL,
    "sourceOfFunds" TEXT NOT NULL,
    "monthlyIncome" TEXT NOT NULL,
    "tin" TEXT,
    "idType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idExpiry" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Banking now runs in Philippine pesos. Existing accounts keep their amounts in centavos.
UPDATE "BankAccount" SET "currency" = 'PHP' WHERE "currency" = 'USD';

-- Give existing accounts a product, matching their type.
UPDATE "BankAccount" SET "product" = 'STARTER_SAVINGS' WHERE "product" IS NULL AND "type" = 'SAVINGS';
UPDATE "BankAccount" SET "product" = 'EVERYDAY_CHECKING' WHERE "product" IS NULL AND "type" = 'CHECKING';
