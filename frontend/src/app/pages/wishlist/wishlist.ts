import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { Product } from '../../core/models';
import { WishlistService } from '../../core/wishlist.service';
import { ProductCard } from '../../shared/product-card';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, ProductCard],
  template: `
    <div class="container section">
      <h1>Wishlist</h1>
      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else if (products(); as products) {
        @if (products.length) {
          <div class="product-grid">
            @for (p of products; track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
        } @else {
          <div class="empty panel">
            <h2>Nothing saved yet</h2>
            <p>Tap the heart on any product to keep it here for later.</p>
            <a routerLink="/products" class="btn btn-primary">Browse products</a>
          </div>
        }
      } @else {
        <div class="spinner" aria-label="Loading"></div>
      }
    </div>
  `,
})
export class WishlistPage {
  private readonly wishlist = inject(WishlistService);
  private readonly loaded = signal<Product[] | null>(null);
  protected readonly error = signal<string | null>(null);

  /** Un-hearting a product on this page removes it straight away. */
  protected readonly products = computed(() => {
    const ids = this.wishlist.ids();
    return this.loaded()?.filter((p) => ids.has(p.id)) ?? null;
  });

  constructor() {
    this.wishlist.list().subscribe({
      next: (products) => this.loaded.set(products),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
