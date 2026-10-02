import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/api';
import { CatalogService } from '../../core/catalog.service';
import { Page, Product } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Pager } from '../../shared/pager';

@Component({
  selector: 'app-admin-products',
  imports: [RouterLink, FormsModule, CurrencyPipe, Pager],
  template: `
    <div class="row-between">
      <h1>Products</h1>
      <a routerLink="/admin/products/new" class="btn btn-primary">+ Add product</a>
    </div>
    <form class="row filters" (ngSubmit)="load(0)">
      <input class="input" type="search" name="q" placeholder="Search by name" [(ngModel)]="q" />
      <select class="input" name="category" [(ngModel)]="categoryId" (ngModelChange)="load(0)">
        <option [ngValue]="null">All categories</option>
        @for (c of categories(); track c.id) {
          <option [ngValue]="c.id">{{ c.name }}</option>
        }
      </select>
      <button type="submit" class="btn btn-ghost">Search</button>
    </form>
    @if (error()) {
      <div class="alert alert-error">{{ error() }}</div>
    }
    @if (page(); as page) {
      <div class="panel table-wrap">
        <table class="table">
          <thead><tr><th>Name</th><th>Category</th><th class="num">Price</th><th class="num">Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            @for (p of page.content; track p.id) {
              <tr [class.inactive]="!p.active">
                <td><a [routerLink]="['/admin/products', p.id]">{{ p.name }}</a></td>
                <td class="muted">{{ p.categoryName }}</td>
                <td class="num">{{ p.sellingPrice | currency: 'INR' : 'symbol' : '1.0-0' }}</td>
                <td class="num" [class.low]="p.stock < 5">{{ p.stock }}</td>
                <td><span class="badge" [class.badge-success]="p.active" [class.badge-muted]="!p.active">{{ p.active ? 'Live' : 'Hidden' }}</span></td>
                <td class="actions">
                  <a [routerLink]="['/admin/products', p.id]" class="btn btn-ghost btn-sm">Edit</a>
                  @if (p.active) {
                    <button type="button" class="btn btn-danger btn-sm" (click)="hide(p)">Hide</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="muted">No products found.</td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pager [page]="page.page" [totalPages]="page.totalPages" (pageChange)="load($event)" />
    }
  `,
  styles: `
    .filters { margin: 0.5rem 0 1rem; flex-wrap: wrap; }
    .filters .input { width: auto; flex: 1; min-width: 180px; }
    .inactive td { opacity: 0.6; }
    .low { color: var(--danger); font-weight: 700; }
    .actions { white-space: nowrap; text-align: right; }
    .actions .btn + .btn { margin-left: 0.4rem; }
  `,
})
export class AdminProductsPage {
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  protected readonly categories = toSignal(this.catalog.categories().pipe(catchError(() => of([]))), { initialValue: [] });
  protected readonly page = signal<Page<Product> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected q = '';
  protected categoryId: number | null = null;

  constructor() {
    this.load(0);
  }

  load(page: number): void {
    this.admin.products(this.q.trim(), this.categoryId, page).subscribe({
      next: (p) => this.page.set(p),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  hide(product: Product): void {
    if (!confirm(`Hide "${product.name}" from the shop? It stays in past orders.`)) {
      return;
    }
    this.admin.hideProduct(product.id).subscribe({
      next: () => {
        this.toast.info(`${product.name} is now hidden`);
        this.load(this.page()?.page ?? 0);
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
