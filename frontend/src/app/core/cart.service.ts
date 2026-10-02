import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from './api';
import { AuthService } from './auth.service';
import { Cart } from './models';

/** Holds the signed-in user's cart so the navbar badge and cart page stay in sync. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly cart = signal<Cart | null>(null);
  readonly count = computed(() => this.cart()?.itemCount ?? 0);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.refresh();
      } else {
        this.cart.set(null);
      }
    });
  }

  refresh(): void {
    this.http.get<Cart>(`${API}/cart`).subscribe({ next: (cart) => this.cart.set(cart), error: () => {} });
  }

  add(productId: number, quantity = 1): Observable<Cart> {
    return this.http.post<Cart>(`${API}/cart/items`, { productId, quantity }).pipe(tap((c) => this.cart.set(c)));
  }

  setQuantity(productId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${API}/cart/items/${productId}`, { quantity }).pipe(tap((c) => this.cart.set(c)));
  }

  remove(productId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${API}/cart/items/${productId}`).pipe(tap((c) => this.cart.set(c)));
  }
}
