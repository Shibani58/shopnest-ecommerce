import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [attr.data-kind]="t.kind" role="status">
          <span>{{ t.text }}</span>
          <button type="button" (click)="toasts.dismiss(t.id)" aria-label="Dismiss">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; bottom: 1rem; right: 1rem; left: 1rem; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; z-index: 100; pointer-events: none; }
    .toast { pointer-events: auto; display: flex; align-items: center; gap: 0.75rem; max-width: 420px; padding: 0.75rem 0.9rem 0.75rem 1rem; border-radius: var(--radius); background: var(--text); color: var(--surface); box-shadow: var(--shadow-md); font-size: 0.92rem; border-left: 4px solid var(--info); animation: slide 0.18s ease-out; }
    .toast[data-kind='success'] { border-left-color: var(--success); }
    .toast[data-kind='error'] { border-left-color: var(--danger); }
    button { background: none; border: 0; color: inherit; font-size: 1.2rem; cursor: pointer; opacity: 0.7; }
    @keyframes slide { from { transform: translateY(8px); opacity: 0; } }
  `,
})
export class ToastContainer {
  protected readonly toasts = inject(ToastService);
}
