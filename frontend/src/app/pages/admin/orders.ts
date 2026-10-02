import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/api';
import { NEXT_STATUSES, Order, OrderStatus, Page } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Pager } from '../../shared/pager';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule, CurrencyPipe, DatePipe, Pager, StatusBadge],
  template: `
    <div class="row-between">
      <h1>Orders</h1>
      <select class="input filter" [(ngModel)]="status" (ngModelChange)="load(0)" aria-label="Filter by status">
        <option [ngValue]="null">All statuses</option>
        @for (s of statuses; track s) {
          <option [ngValue]="s">{{ s }}</option>
        }
      </select>
    </div>
    @if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    }
    @if (page(); as page) {
      <div class="panel table-wrap">
        <table class="table">
          <thead><tr><th>#</th><th>Customer</th><th>Date</th><th>Items</th><th class="num">Total</th><th>Status</th><th>Update</th></tr></thead>
          <tbody>
            @for (o of page.content; track o.id) {
              <tr>
                <td>{{ o.id }}</td>
                <td>{{ o.customerName }}<div class="muted small">{{ o.customerEmail }}</div></td>
                <td class="muted">{{ o.createdAt | date: 'MMM d, h:mm a' }}</td>
                <td>{{ o.items.length }}</td>
                <td class="num">{{ o.total | currency: 'INR' }}</td>
                <td><app-status-badge [status]="o.status" /></td>
                <td>
                  @if (nextStatuses(o).length) {
                    <select class="input" [ngModel]="null" (ngModelChange)="update(o, $event)" [attr.aria-label]="'Update order ' + o.id">
                      <option [ngValue]="null" disabled>Move to…</option>
                      @for (s of nextStatuses(o); track s) {
                        <option [ngValue]="s">{{ s }}</option>
                      }
                    </select>
                  } @else {
                    <span class="muted small">Final</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="muted">No orders.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pager [page]="page.page" [totalPages]="page.totalPages" (pageChange)="load($event)" />
    }
  `,
  styles: `
    .filter { width: auto; min-width: 170px; }
    td .input { padding: 0.35rem 0.5rem; min-width: 130px; }
  `,
})
export class AdminOrdersPage {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly statuses: OrderStatus[] = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  protected readonly page = signal<Page<Order> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected status: OrderStatus | null = null;

  constructor() {
    this.load(0);
  }

  load(page: number): void {
    this.admin.orders(this.status, page).subscribe({
      next: (p) => this.page.set(p),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  nextStatuses(order: Order): OrderStatus[] {
    return NEXT_STATUSES[order.status];
  }

  update(order: Order, next: OrderStatus | null): void {
    if (!next) {
      return;
    }
    this.admin.updateOrderStatus(order.id, next).subscribe({
      next: (updated) => {
        this.toast.success(`Order #${updated.id} is now ${updated.status}`);
        this.load(this.page()?.page ?? 0);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
