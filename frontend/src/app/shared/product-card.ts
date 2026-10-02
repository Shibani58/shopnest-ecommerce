import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../core/api';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { Product } from '../core/models';
import { ToastService } from '../core/toast.service';
import { WishlistService } from '../core/wishlist.service';
import { ProductImage } from './product-image';
import { StarRating } from './star-rating';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, CurrencyPipe, StarRating, ProductImage],
  template: `
    @let p = product();
    <article class="card">
      <a class="media" [routerLink]="['/products', p.id]">
        <app-product-image [src]="p.imageUrl" [alt]="p.name" />
        @if (p.discountPercent > 0) {
          <span class="badge badge-sale">-{{ p.discountPercent }}%</span>
        }
        @if (p.stock === 0) {
          <span class="badge badge-muted sold-out">Sold out</span>
        }
      </a>
      <button
        type="button"
        class="wish"
        [class.on]="wished()"
        (click)="toggleWishlist()"
        [attr.aria-label]="wished() ? 'Remove from wishlist' : 'Add to wishlist'"
        [attr.aria-pressed]="wished()"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" [attr.fill]="wished() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </button>
      <div class="body">
        <span class="category">{{ p.categoryName }}</span>
        <a class="name" [routerLink]="['/products', p.id]">{{ p.name }}</a>
        <app-star-rating [value]="p.averageRating" [count]="p.reviewCount" />
        <div class="price-row">
          <span class="price">{{ p.sellingPrice | currency: 'INR' : 'symbol' : '1.0-0' }}</span>
          @if (p.discountPercent > 0) {
            <span class="mrp">{{ p.price | currency: 'INR' : 'symbol' : '1.0-0' }}</span>
          }
        </div>
        <button type="button" class="btn btn-primary btn-block" [disabled]="p.stock === 0 || adding()" (click)="addToCart()">
          {{ p.stock === 0 ? 'Out of stock' : adding() ? 'Adding…' : 'Add to cart' }}
        </button>
      </div>
    </article>
  `,
  styles: `
    .card { position: relative; display: flex; flex-direction: column; height: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow 0.15s, transform 0.15s; }
    .card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .media { position: relative; display: block; aspect-ratio: 1; background: var(--surface-muted); padding: 1rem; }
    .badge { position: absolute; top: 0.6rem; left: 0.6rem; }
    .sold-out { left: auto; right: 0.6rem; top: auto; bottom: 0.6rem; }
    .wish { position: absolute; top: 0.5rem; right: 0.5rem; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); display: grid; place-items: center; cursor: pointer; }
    .wish:hover, .wish.on { color: var(--danger); }
    .body { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.9rem 1rem 1rem; flex: 1; }
    .category { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
    .name { font-weight: 600; color: var(--text); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em; }
    .name:hover { color: var(--primary); }
    .price-row { display: flex; align-items: baseline; gap: 0.5rem; margin: 0.15rem 0 0.5rem; }
    .price { font-size: 1.1rem; font-weight: 700; }
    .mrp { color: var(--text-muted); text-decoration: line-through; font-size: 0.85rem; }
    .btn-block { margin-top: auto; }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();

  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly adding = signal(false);
  protected readonly wished = computed(() => this.wishlist.ids().has(this.product().id));

  addToCart(): void {
    if (!this.requireLogin()) {
      return;
    }
    this.adding.set(true);
    this.cart.add(this.product().id).subscribe({
      next: () => {
        this.adding.set(false);
        this.toast.success(`Added ${this.product().name} to your cart`);
      },
      error: (err) => {
        this.adding.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  toggleWishlist(): void {
    if (!this.requireLogin()) {
      return;
    }
    this.wishlist.toggle(this.product().id).subscribe({ error: (err) => this.toast.error(errorMessage(err)) });
  }

  private requireLogin(): boolean {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    this.toast.info('Please log in first');
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }
}
