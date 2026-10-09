/**
 * NON-BLOCKING TOAST NOTIFICATION SYSTEM (Feature 47)
 * Eliminates disruptive browser alert() and confirm() dialogs.
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastEngine {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.toasts);
    return () => this.listeners.delete(listener);
  }

  notify(message: string, type: ToastType = 'info', duration = 3500): void {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, message, type, duration };
    this.toasts = [...this.toasts, item];
    this.emit();

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach(fn => fn(this.toasts));
  }
}

export const toast = new ToastEngine();
