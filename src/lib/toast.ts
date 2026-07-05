import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
};

export function toastError(err: unknown, fallback: string) {
  let message = fallback;
  
  if (err instanceof Error) {
    // Mask raw Next.js server digest errors and database errors
    if (err.message.includes("An error occurred in the Server Components render") || 
        err.message.includes("NEXT_REDIRECT") ||
        err.message.includes("PrismaClient")) {
      message = fallback;
    } else {
      message = err.message;
    }
  }

  sonnerToast.error(message);
}
