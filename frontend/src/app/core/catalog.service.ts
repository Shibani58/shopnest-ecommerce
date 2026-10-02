import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { API, toParams } from './api';
import { Category, Page, Product, ProductQuery, Review } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private categories$?: Observable<Category[]>;

  products(query: ProductQuery): Observable<Page<Product>> {
    return this.http.get<Page<Product>>(`${API}/products`, { params: toParams(query) });
  }

  newArrivals(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API}/products/new-arrivals`);
  }

  product(id: number): Observable<Product> {
    return this.http.get<Product>(`${API}/products/${id}`);
  }

  /** Cached for the session; call refreshCategories() after an admin edits them. */
  categories(): Observable<Category[]> {
    this.categories$ ??= this.http.get<Category[]>(`${API}/categories`).pipe(shareReplay(1));
    return this.categories$;
  }

  refreshCategories(): void {
    this.categories$ = undefined;
  }

  reviews(productId: number, page = 0): Observable<Page<Review>> {
    return this.http.get<Page<Review>>(`${API}/products/${productId}/reviews`, { params: toParams({ page, size: 5 }) });
  }

  saveReview(productId: number, rating: number, comment: string): Observable<Review> {
    return this.http.post<Review>(`${API}/products/${productId}/reviews`, { rating, comment });
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${API}/reviews/${reviewId}`);
  }
}
