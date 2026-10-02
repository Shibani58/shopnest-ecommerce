import { CurrencyPipe, DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/api';
import { Dashboard } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, KeyValuePipe, StatusBadge],
  template: `
    <h1>Dashboard</h1>
    @if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    } @else if (data(); as d) {
      <div class="stats">
        <div class="panel stat"><span>Revenue</span><strong>{{ d.totalRevenue | currency: 'INR' : 'symbol' : '1.0-0' }}</strong></div>
        <div class="panel stat"><span>Orders</span><strong>{{ d.totalOrders | number }}</strong></div>
        <div class="panel stat"><span>Products in shop</span><strong>{{ d.activeProducts | number }}</strong></div>
        <div class="panel stat"><span>Customers</span><strong>{{ d.customers | number }}</strong></div>
      </div>

      <div class="grid">
        <section class="panel">
          <h2>Orders by status</h2>
          @for (entry of d.ordersByStatus | keyvalue: keepOrder; track entry.key) {
            <div class="bar-row">
              <span>{{ entry.key }}</span>
              <div class="bar"><div class="fill" [style.width.%]="(entry.value / maxStatus()) * 100"></div></div>
              <strong class="num">{{ entry.value }}</strong>
            </div>
          }
        </section>
        <section class="panel">
          <h2>Products by category</h2>
          @for (entry of d.productsByCategory | keyvalue; track entry.key) {
            <div class="bar-row">
              <span>{{ entry.key }}</span>
              <div class="bar"><div class="fill" [style.width.%]="(entry.value / maxCategory()) * 100"></div></div>
              <strong class="num">{{ entry.value }}</strong>
            </div>
          }
        </section>
      </div>

      <div class="grid">
        <section class="panel table-wrap">
          <h2>Recent orders</h2>
          <table class="table">
            <thead><tr><th>#</th><th>Customer</th><th>Date</th><th>Status</th><th class="num">Total</th></tr></thead>
            <tbody>
              @for (o of d.recentOrders; track o.id) {
                <tr>
                  <td>{{ o.id }}</td>
                  <td>{{ o.customerName }}</td>
                  <td class="muted">{{ o.createdAt | date: 'MMM d, h:mm a' }}</td>
                  <td><app-status-badge [status]="o.status" /></td>
                  <td class="num">{{ o.total | currency: 'INR' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">No orders yet.</td></tr>
              }
            </tbody>
          </table>
        </section>
        <section class="panel">
          <h2>Low stock</h2>
          @for (p of d.lowStockProducts; track p.id) {
            <div class="row-between low">
              <a [routerLink]="['/admin/products', p.id]">{{ p.name }}</a>
              <span class="badge badge-muted">{{ p.stock }} left</span>
            </div>
          } @empty {
            <p class="muted">Everything is well stocked.</p>
          }
        </section>
      </div>
    } @else {
      <div class="spinner" aria-label="Loading"></div>
    }
  `,
  styles: `
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .stat { display: flex; flex-direction: column; gap: 0.2rem; }
    .stat span { color: var(--text-muted); font-size: 0.85rem; }
    .stat strong { font-size: 1.6rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .bar-row { display: grid; grid-template-columns: 150px minmax(0, 1fr) 36px; gap: 0.75rem; align-items: center; margin-bottom: 0.55rem; font-size: 0.85rem; }
    .bar { height: 10px; border-radius: 999px; background: var(--surface-muted); overflow: hidden; }
    .fill { height: 100%; background: var(--primary); min-width: 2px; }
    .low { padding: 0.5rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  `,
})
export class AdminDashboardPage {
  private readonly admin = inject(AdminService);
  protected readonly data = signal<Dashboard | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly maxStatus = computed(() => Math.max(1, ...Object.values(this.data()?.ordersByStatus ?? {})));
  protected readonly maxCategory = computed(() => Math.max(1, ...Object.values(this.data()?.productsByCategory ?? {})));
  /** Keep the server's order (the order lifecycle) instead of sorting alphabetically. */
  protected readonly keepOrder = () => 0;

  constructor() {
    this.admin.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
