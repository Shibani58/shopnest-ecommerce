import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { CatalogService } from '../../core/catalog.service';
import { Product, Review } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { WishlistService } from '../../core/wishlist.service';
import { ProductImage } from '../../shared/product-image';
import { StarRating } from '../../shared/star-rating';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; product: Product };

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, StarRating, ProductImage],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailPage {
  /** Bound from the :id route parameter. */
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private readonly loaded = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.catalog.product(Number(id)).pipe(
          map((product): Load => ({ state: 'ready', product })),
          catchError((err) => of<Load>({ state: 'error', message: errorMessage(err) })),
          startWith<Load>({ state: 'loading' }),
        ),
      ),
    ),
    { initialValue: { state: 'loading' } as Load },
  );

  /** Updated locally after a review changes the product's rating. */
  private readonly override = signal<Product | null>(null);
  protected readonly load = computed<Load>(() => {
    const o = this.override();
    const l = this.loaded();
    return o && l.state === 'ready' && o.id === l.product.id ? { state: 'ready', product: o } : l;
  });

  protected quantity = 1;
  protected readonly adding = signal(false);
  protected readonly wished = computed(() => {
    const l = this.load();
    return l.state === 'ready' && this.wishlist.ids().has(l.product.id);
  });

  // Reviews
  protected readonly reviews = signal<Review[]>([]);
  protected readonly reviewsPage = signal(0);
  protected readonly reviewsLast = signal(true);
  protected readonly myReview = computed(() => this.reviews().find((r) => r.reviewerId === this.auth.user()?.id));
  protected rating = 5;
  protected comment = '';
  protected readonly savingReview = signal(false);

  constructor() {
    toObservable(this.id).subscribe(() => this.loadReviews(0));
  }

  addToCart(product: Product): void {
    if (!this.requireLogin()) {
      return;
    }
    this.adding.set(true);
    this.cart.add(product.id, this.quantity).subscribe({
      next: () => {
        this.adding.set(false);
        this.toast.success('Added to cart');
      },
      error: (err) => {
        this.adding.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  buyNow(product: Product): void {
    if (!this.requireLogin()) {
      return;
    }
    this.cart.add(product.id, this.quantity).subscribe({
      next: () => this.router.navigate(['/checkout']),
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  toggleWishlist(product: Product): void {
    if (this.requireLogin()) {
      this.wishlist.toggle(product.id).subscribe({ error: (err) => this.toast.error(errorMessage(err)) });
    }
  }

  loadReviews(page: number): void {
    this.catalog.reviews(Number(this.id()), page).subscribe({
      next: (res) => {
        this.reviews.update((list) => (page === 0 ? res.content : [...list, ...res.content]));
        this.reviewsPage.set(res.page);
        this.reviewsLast.set(res.last);
      },
      error: () => this.reviews.set([]),
    });
  }

  submitReview(): void {
    const productId = Number(this.id());
    this.savingReview.set(true);
    this.catalog.saveReview(productId, this.rating, this.comment.trim()).subscribe({
      next: () => {
        this.savingReview.set(false);
        this.comment = '';
        this.toast.success('Thanks for your review!');
        this.loadReviews(0);
        this.catalog.product(productId).subscribe((p) => this.override.set(p));
      },
      error: (err) => {
        this.savingReview.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  deleteReview(review: Review): void {
    this.catalog.deleteReview(review.id).subscribe({
      next: () => {
        this.toast.info('Review deleted');
        this.loadReviews(0);
        this.catalog.product(Number(this.id())).subscribe((p) => this.override.set(p));
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  maxQuantity(product: Product): number[] {
    return Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1);
  }

  private requireLogin(): boolean {
    if (this.auth.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }
}
