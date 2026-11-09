-- CreateEnum
CREATE TYPE "LoanApplicationStatus" AS ENUM ('OFFERED', 'DECLINED', 'AVAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'PAID_OFF');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BankTransactionType" ADD VALUE 'LOAN_DISBURSEMENT';
ALTER TYPE "BankTransactionType" ADD VALUE 'LOAN_PAYMENT';

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "LoanApplicationStatus" NOT NULL,
    "requestedAmountCents" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "borrower" JSONB NOT NULL,
    "addresses" JSONB NOT NULL,
    "employment" JSONB NOT NULL,
    "interview" JSONB NOT NULL,
    "guarantor" JSONB,
    "creditScore" INTEGER NOT NULL,
    "debtToIncomePercent" INTEGER NOT NULL,
    "decisionReasons" TEXT[],
    "offeredAmountCents" INTEGER,
    "monthlyRateBps" INTEGER NOT NULL,
    "processingFeeCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "LoanApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "loanNumber" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "principalCents" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyRateBps" INTEGER NOT NULL,
    "processingFeeCents" INTEGER NOT NULL,
    "netProceedsCents" INTEGER NOT NULL,
    "monthlyInstalmentCents" INTEGER NOT NULL,
    "totalPayableCents" INTEGER NOT NULL,
    "outstandingCents" INTEGER NOT NULL,
    "disbursementAccountId" TEXT NOT NULL,
    "releasedOn" DATE NOT NULL,
    "paidOffAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanInstalment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "principalCents" INTEGER NOT NULL,
    "interestCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paidFromAccountId" TEXT,
    "paymentReference" TEXT,

    CONSTRAINT "LoanInstalment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoanApplication_referenceNumber_key" ON "LoanApplication"("referenceNumber");

-- CreateIndex
CREATE INDEX "LoanApplication_userId_idx" ON "LoanApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_loanNumber_key" ON "Loan"("loanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_applicationId_key" ON "Loan"("applicationId");

-- CreateIndex
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanInstalment_loanId_number_key" ON "LoanInstalment"("loanId", "number");

-- AddForeignKey
ALTER TABLE "LoanApplication" ADD CONSTRAINT "LoanApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "LoanApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanInstalment" ADD CONSTRAINT "LoanInstalment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
