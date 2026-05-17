// DB-sourced course type (mirrors Prisma Course model)
export interface InstallmentPayment {
  amount: number;
  label: string;
}

export interface InstallmentPlan {
  label: string;
  payments: InstallmentPayment[];
  totalAmount: number;
  badge?: string;
}

export interface DbCourse {
  id: string;
  categoryId: string;
  name: string;
  shortName: string | null;
  slug: string;
  duration: string;
  mode: string;
  price: number;
  currency: string;
  description: string;
  longDescription: string | null;
  level: string;
  audience: string | null;
  stack: string | null;
  coverImage: string | null;
  outcomes: string[];
  prerequisites: string[];
  careerPaths: string[];
  includes: string[];
  featured: boolean;
  isActive: boolean;
  installmentsEnabled: boolean;
  installmentPlans: InstallmentPlan[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
