import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
};

export function toastError(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  sonnerToast.error(message);
}
