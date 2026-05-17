SET search_path TO public;

-- AlterTable: add installment plan storage to courses
ALTER TABLE "courses"
  ADD COLUMN "installments_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "installment_plans" JSONB DEFAULT '[]';
