import * as React from "react";
import { toast as sonnerToast } from "sonner";

// The app used to run two toast stacks at once: shadcn's Radix toaster behind
// this hook, and Sonner behind the `toast.*` imports. They differed in
// position, stacking and motion. This hook keeps its old call shape, so the
// existing `toast({ title, description, variant })` calls do not change, but
// every toast now lands in Sonner (mounted once in App.tsx).

export interface ToastInput {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | null;
  duration?: number;
}

type ToastId = string | number;

function show({ title, description, variant, duration }: ToastInput, id?: ToastId): ToastId {
  // Sonner needs a message. A toast that only has a description uses it as the message.
  const message = title || description || "";
  const options = { id, duration, description: title ? description : undefined };
  return variant === "destructive" ? sonnerToast.error(message, options) : sonnerToast(message, options);
}

function toast(input: ToastInput) {
  const id = show(input);
  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: ToastInput) => {
      show(next, id);
    },
  };
}

function dismiss(toastId?: ToastId) {
  sonnerToast.dismiss(toastId);
}

// One stable object, so `useToast()` can sit in a dependency array without
// re-running effects on every render.
const api = { toast, dismiss };

function useToast() {
  return api;
}

export { useToast, toast };
