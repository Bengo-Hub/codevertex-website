// Centralized toast hook — thin wrapper over sonner so every admin page
// imports from one place. The <Toaster> is already mounted in the root layout.
import { toast } from 'sonner';

export { toast };

export const toastSuccess = (message: string, description?: string) =>
  toast.success(message, { description });

export const toastError = (message: string, description?: string) =>
  toast.error(message, { description });

export const toastInfo = (message: string, description?: string) =>
  toast.info(message, { description });

export const toastLoading = (message: string) =>
  toast.loading(message);
