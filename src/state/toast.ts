/**
 * Toast bus — transient messages (elevation declined, activation
 * success, session imported…). One active toast + a queue; the visual
 * language matches the overlay layer.
 */
import { create } from "zustand";

export interface Toast {
  id: number;
  icon: "info" | "success" | "warn" | "error";
  text: string;
}

let nextId = 1;

interface ToastStore {
  current: Toast | null;
  queue: Toast[];

  push(icon: Toast["icon"], text: string): void;
  dismiss(): void;
}

export const useToast = create<ToastStore>((set, get) => ({
  current: null,
  queue: [],

  push(icon, text) {
    const t: Toast = { id: nextId++, icon, text };
    if (get().current) {
      set((s) => ({ queue: [...s.queue, t] }));
    } else {
      set({ current: t });
      window.setTimeout(() => {
        if (useToast.getState().current?.id === t.id) get().dismiss();
      }, 4_200);
    }
  },

  dismiss() {
    const { queue } = get();
    const [next, ...rest] = queue;
    if (next) {
      set({ current: next, queue: rest });
      window.setTimeout(() => {
        if (useToast.getState().current?.id === next.id) useToast.getState().dismiss();
      }, 4_200);
    } else {
      set({ current: null });
    }
  },
}));

export function toast(icon: Toast["icon"], text: string): void {
  useToast.getState().push(icon, text);
}
