import { Component, input } from '@angular/core';
import { OrderStatus } from '../core/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="status" [attr.data-status]="status()">{{ status() }}</span>`,
  styles: `
    .status { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; background: var(--surface-muted); color: var(--text-muted); }
    [data-status='PLACED'] { background: var(--info-soft); color: var(--info); }
    [data-status='CONFIRMED'] { background: var(--primary-soft); color: var(--primary); }
    [data-status='SHIPPED'] { background: var(--warning-soft); color: var(--warning); }
    [data-status='DELIVERED'] { background: var(--success-soft); color: var(--success); }
    [data-status='CANCELLED'] { background: var(--danger-soft); color: var(--danger); }
  `,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();
}
