-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "notified_at" TIMESTAMP(3),
ADD COLUMN     "student_user_id" TEXT,
ADD COLUMN     "total_amount" INTEGER;

-- CreateTable
CREATE TABLE "student_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_schedules" (
    "id" BIGSERIAL NOT NULL,
    "enrollment_id" BIGINT NOT NULL,
    "installment_no" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMP(3),
    "payment_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_users_email_key" ON "student_users"("email");

-- CreateIndex
CREATE INDEX "student_users_email_idx" ON "student_users"("email");

-- CreateIndex
CREATE INDEX "installment_schedules_enrollment_id_idx" ON "installment_schedules"("enrollment_id");

-- CreateIndex
CREATE INDEX "installment_schedules_due_date_idx" ON "installment_schedules"("due_date");

-- CreateIndex
CREATE INDEX "installment_schedules_status_idx" ON "installment_schedules"("status");

-- CreateIndex
CREATE INDEX "enrollments_student_user_id_idx" ON "enrollments"("student_user_id");

-- CreateIndex
CREATE INDEX "site_users_role_idx" ON "site_users"("role");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "student_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_schedules" ADD CONSTRAINT "installment_schedules_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
