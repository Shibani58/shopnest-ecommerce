import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API, toParams } from './api';
import { Category, Dashboard, Order, OrderStatus, Page, Product, ProductInput } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${API}/admin/dashboard`);
  }

  products(q: string, categoryId: number | null, page: number): Observable<Page<Product>> {
    return this.http.get<Page<Product>>(`${API}/admin/products`, {
      params: toParams({ q, categoryId, page, size: 15 }),
    });
  }

  product(id: number): Observable<Product> {
    return this.http.get<Product>(`${API}/admin/products/${id}`);
  }

  createProduct(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(`${API}/products`, input);
  }

  updateProduct(id: number, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${API}/products/${id}`, input);
  }

  hideProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/products/${id}`);
  }

  createCategory(name: string, description: string): Observable<Category> {
    return this.http.post<Category>(`${API}/categories`, { name, description });
  }

  updateCategory(id: number, name: string, description: string): Observable<Category> {
    return this.http.put<Category>(`${API}/categories/${id}`, { name, description });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/categories/${id}`);
  }

  orders(status: OrderStatus | null, page: number): Observable<Page<Order>> {
    return this.http.get<Page<Order>>(`${API}/admin/orders`, { params: toParams({ status, page, size: 15 }) });
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${API}/admin/orders/${id}/status`, { status });
  }
}
