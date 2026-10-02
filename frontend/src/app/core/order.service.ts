import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API, toParams } from './api';
import { CheckoutRequest, Order, Page } from './models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  checkout(req: CheckoutRequest): Observable<Order> {
    return this.http.post<Order>(`${API}/orders`, req);
  }

  myOrders(page = 0): Observable<Page<Order>> {
    return this.http.get<Page<Order>>(`${API}/orders`, { params: toParams({ page, size: 10 }) });
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${API}/orders/${id}`);
  }

  cancel(id: number): Observable<Order> {
    return this.http.post<Order>(`${API}/orders/${id}/cancel`, null);
  }
}
