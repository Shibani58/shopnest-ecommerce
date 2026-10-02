import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { Order, Page } from '../../core/models';
import { OrderService } from '../../core/order.service';
import { Pager } from '../../shared/pager';
import { ProductImage } from '../../shared/product-image';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-order-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, Pager, ProductImage],
  template: `
    <div class="container section">
      <h1>My orders</h1>
      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else if (page(); as page) {
        @for (order of page.content; track order.id) {
          <a class="panel order" [routerLink]="['/orders', order.id]">
            <div class="row-between head">
              <div>
                <strong>Order #{{ order.id }}</strong>
                <span class="muted small"> · {{ order.createdAt | date: 'medium' }}</span>
              </div>
              <app-status-badge [status]="order.status" />
            </div>
            <div class="row-between">
              <div class="thumbs">
                @for (item of order.items.slice(0, 4); track $index) {
                  <span class="thumb"><app-product-image [src]="item.imageUrl" [alt]="item.productName" /></span>
                }
                @if (order.items.length > 4) {
                  <span class="more">+{{ order.items.length - 4 }}</span>
                }
              </div>
              <div class="total">
                <span class="muted small">{{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }}</span>
                <strong>{{ order.total | currency: 'INR' }}</strong>
              </div>
            </div>
          </a>
        } @empty {
          <div class="empty panel">
            <h2>No orders yet</h2>
            <p>When you place an order it will appear here.</p>
            <a routerLink="/products" class="btn btn-primary">Start shopping</a>
          </div>
        }
        <app-pager [page]="page.page" [totalPages]="page.totalPages" (pageChange)="load($event)" />
      } @else {
        <div class="spinner" aria-label="Loading"></div>
      }
    </div>
  `,
  styles: `
    .order { display: flex; flex-direction: column; gap: 0.9rem; margin-bottom: 0.9rem; color: var(--text); transition: border-color 0.15s; }
    .order:hover { border-color: var(--primary); }
    .thumbs { display: flex; gap: 0.5rem; align-items: center; }
    .thumb { width: 56px; height: 56px; padding: 0.25rem; border-radius: var(--radius); background: var(--surface-muted); }
    .more { color: var(--text-muted); font-size: 0.85rem; }
    .total { display: flex; flex-direction: column; align-items: flex-end; }
  `,
})
export class OrderListPage {
  private readonly orders = inject(OrderService);
  protected readonly page = signal<Page<Order> | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load(0);
  }

  load(page: number): void {
    this.orders.myOrders(page).subscribe({
      next: (p) => this.page.set(p),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
