import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from './api';
import { AuthService } from './auth.service';
import { Product } from './models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** Product ids on the wishlist, used to fill in the heart icons. */
  readonly ids = signal<ReadonlySet<number>>(new Set());

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.list().subscribe({ error: () => {} });
      } else {
        this.ids.set(new Set());
      }
    });
  }

  list(): Observable<Product[]> {
    return this.http
      .get<Product[]>(`${API}/wishlist`)
      .pipe(tap((products) => this.ids.set(new Set(products.map((p) => p.id)))));
  }

  has(productId: number): boolean {
    return this.ids().has(productId);
  }

  toggle(productId: number): Observable<void> {
    const adding = !this.has(productId);
    const request = adding
      ? this.http.put<void>(`${API}/wishlist/${productId}`, null)
      : this.http.delete<void>(`${API}/wishlist/${productId}`);
    return request.pipe(
      tap(() =>
        this.ids.update((ids) => {
          const next = new Set(ids);
          if (adding) {
            next.add(productId);
          } else {
            next.delete(productId);
          }
          return next;
        }),
      ),
    );
  }
}
