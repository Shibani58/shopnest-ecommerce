import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { errorMessage } from '../../core/api';
import { Order, OrderStatus } from '../../core/models';
import { OrderService } from '../../core/order.service';
import { ToastService } from '../../core/toast.service';
import { ProductImage } from '../../shared/product-image';
import { StatusBadge } from '../../shared/status-badge';

const STEPS: OrderStatus[] = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, ProductImage],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetailPage {
  readonly id = input.required<string>();
  /** Present (as "1") right after checkout, to show a thank-you banner. */
  readonly placed = input<string>();

  private readonly orders = inject(OrderService);
  private readonly toast = inject(ToastService);

  protected readonly order = signal<Order | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cancelling = signal(false);
  protected readonly steps = STEPS;

  protected readonly stepIndex = computed(() => {
    const o = this.order();
    return o ? STEPS.indexOf(o.status) : -1;
  });
  protected readonly canCancel = computed(() => {
    const status = this.order()?.status;
    return status === 'PLACED' || status === 'CONFIRMED';
  });

  constructor() {
    toObservable(this.id)
      .pipe(switchMap((id) => this.orders.get(Number(id))))
      .subscribe({
        next: (o) => this.order.set(o),
        error: (err) => this.error.set(errorMessage(err)),
      });
  }

  cancel(order: Order): void {
    if (!confirm(`Cancel order #${order.id}? Items go back into stock.`)) {
      return;
    }
    this.cancelling.set(true);
    this.orders.cancel(order.id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.cancelling.set(false);
        this.toast.info(`Order #${o.id} cancelled`);
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
