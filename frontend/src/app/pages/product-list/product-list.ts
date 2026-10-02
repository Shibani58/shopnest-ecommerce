import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { errorMessage } from '../../core/api';
import { CatalogService } from '../../core/catalog.service';
import { Page, Product, ProductQuery } from '../../core/models';
import { Pager } from '../../shared/pager';
import { ProductCard } from '../../shared/product-card';

interface Result {
  loading: boolean;
  page: Page<Product> | null;
  error: string | null;
}

function toQuery(params: ParamMap): ProductQuery {
  const num = (key: string) => (params.get(key) ? Number(params.get(key)) : null);
  return {
    q: params.get('q') ?? '',
    categoryId: num('categoryId'),
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    inStock: params.get('inStock') === 'true',
    sort: params.get('sort') ?? 'newest',
    page: num('page') ?? 0,
    size: 12,
  };
}

/** The URL is the single source of truth for filters, so results can be bookmarked and shared. */
@Component({
  selector: 'app-product-list',
  imports: [FormsModule, ProductCard, Pager],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);

  protected readonly categories = toSignal(this.catalog.categories().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
  protected readonly query = toSignal(this.route.queryParamMap.pipe(map(toQuery)), {
    initialValue: toQuery(this.route.snapshot.queryParamMap),
  });
  protected readonly result = toSignal(
    this.route.queryParamMap.pipe(
      map(toQuery),
      switchMap((q) =>
        this.catalog.products(q).pipe(
          map((page): Result => ({ loading: false, page, error: null })),
          catchError((err) => of<Result>({ loading: false, page: null, error: errorMessage(err) })),
          startWith<Result>({ loading: true, page: null, error: null }),
        ),
      ),
    ),
    { initialValue: { loading: true, page: null, error: null } as Result },
  );

  protected readonly filtersOpen = signal(false);
  protected minPrice: number | null = this.query().minPrice ?? null;
  protected maxPrice: number | null = this.query().maxPrice ?? null;

  protected readonly heading = computed(() => {
    const q = this.query();
    if (q.q) {
      return `Results for “${q.q}”`;
    }
    const category = this.categories().find((c) => c.id === q.categoryId);
    return category?.name ?? 'All products';
  });

  protected readonly sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'rating', label: 'Top rated' },
    { value: 'name', label: 'Name A-Z' },
  ];

  update(changes: Record<string, string | number | boolean | null>): void {
    // Any filter change goes back to the first page.
    const queryParams = { page: null, ...changes };
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  applyPrice(): void {
    this.update({ minPrice: this.minPrice || null, maxPrice: this.maxPrice || null });
    this.filtersOpen.set(false);
  }

  clearAll(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  goToPage(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page || null },
      queryParamsHandling: 'merge',
    });
  }
}
