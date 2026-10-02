import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CatalogService } from '../../core/catalog.service';
import { Product } from '../../core/models';
import { ProductCard } from '../../shared/product-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <span class="eyebrow">Free delivery on orders over ₹999</span>
          <h1>Everything you need,<br />delivered to your nest.</h1>
          <p>Electronics, fashion, home essentials and more, with honest reviews from real buyers.</p>
          <div class="row">
            <a routerLink="/products" class="btn btn-primary">Start shopping</a>
            <a routerLink="/products" [queryParams]="{ sort: 'rating' }" class="btn btn-ghost">Top rated</a>
          </div>
        </div>
        <div class="hero-perks">
          <div class="perk"><strong>Secure checkout</strong><span>JWT-protected accounts</span></div>
          <div class="perk"><strong>Easy cancellations</strong><span>Before your order ships</span></div>
          <div class="perk"><strong>Verified reviews</strong><span>Badged when you bought it</span></div>
        </div>
      </div>
    </section>

    <section class="container section">
      <div class="row-between">
        <h2>Shop by category</h2>
        <a routerLink="/products">View all →</a>
      </div>
      <div class="categories">
        @for (c of categories(); track c.id) {
          <a class="category" [routerLink]="['/products']" [queryParams]="{ categoryId: c.id }">
            <strong>{{ c.name }}</strong>
            <span>{{ c.description }}</span>
          </a>
        }
      </div>
    </section>

    <section class="container section">
      <div class="row-between">
        <h2>New arrivals</h2>
        <a routerLink="/products">See more →</a>
      </div>
      @if (newArrivals(); as products) {
        @if (products.length) {
          <div class="product-grid">
            @for (p of products; track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
        } @else {
          <p class="alert alert-info">Products could not be loaded. The server may be waking up - refresh in a few seconds.</p>
        }
      } @else {
        <div class="product-grid">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="skeleton" style="height: 340px"></div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .hero { background: linear-gradient(135deg, var(--primary-soft), transparent 70%), var(--surface); border-bottom: 1px solid var(--border); }
    .hero-inner { display: grid; grid-template-columns: 1.4fr 1fr; gap: 2rem; align-items: center; padding-block: 3rem; }
    .eyebrow { display: inline-block; font-size: 0.8rem; font-weight: 700; color: var(--primary); background: var(--surface); border: 1px solid var(--primary-soft); padding: 0.25rem 0.7rem; border-radius: 999px; margin-bottom: 1rem; }
    h1 { font-size: clamp(1.8rem, 4vw, 2.75rem); letter-spacing: -0.02em; }
    .hero-copy p { color: var(--text-muted); font-size: 1.05rem; max-width: 46ch; margin-bottom: 1.5rem; }
    .hero-perks { display: grid; gap: 0.75rem; }
    .perk { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 0.9rem 1.1rem; box-shadow: var(--shadow-sm); }
    .perk span { color: var(--text-muted); font-size: 0.88rem; }
    .categories { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.9rem; }
    .category { display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem 1.1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); color: var(--text); transition: border-color 0.15s, transform 0.15s; }
    .category:hover { border-color: var(--primary); transform: translateY(-2px); }
    .category span { color: var(--text-muted); font-size: 0.82rem; }
    @media (max-width: 800px) { .hero-inner { grid-template-columns: 1fr; padding-block: 2rem; } }
  `,
})
export class HomePage {
  private readonly catalog = inject(CatalogService);

  protected readonly categories = toSignal(this.catalog.categories().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
  protected readonly newArrivals = toSignal<Product[] | undefined>(
    this.catalog.newArrivals().pipe(catchError(() => of([]))),
  );
}
