import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/api';
import { CatalogService } from '../../core/catalog.service';
import { ProductInput } from '../../core/models';
import { ToastService } from '../../core/toast.service';

/** Used for both /admin/products/new and /admin/products/:id. */
@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a routerLink="/admin/products" class="small">← All products</a>
    <h1>{{ isNew() ? 'Add product' : 'Edit product' }}</h1>
    <form class="panel form-grid" [formGroup]="form" (ngSubmit)="save()">
      <div class="field full">
        <label for="name">Name</label>
        <input id="name" formControlName="name" />
      </div>
      <div class="field full">
        <label for="description">Description</label>
        <textarea id="description" rows="4" formControlName="description"></textarea>
      </div>
      <div class="field">
        <label for="category">Category</label>
        <select id="category" formControlName="categoryId">
          <option [ngValue]="null" disabled>Choose…</option>
          @for (c of categories(); track c.id) {
            <option [ngValue]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label for="stock">Stock</label>
        <input id="stock" type="number" min="0" formControlName="stock" />
      </div>
      <div class="field">
        <label for="price">Price (MRP, ₹)</label>
        <input id="price" type="number" min="1" step="0.01" formControlName="price" />
      </div>
      <div class="field">
        <label for="discount">Discount (%)</label>
        <input id="discount" type="number" min="0" max="90" formControlName="discountPercent" />
      </div>
      <div class="field full">
        <label for="imageUrl">Image URL</label>
        <input id="imageUrl" type="url" formControlName="imageUrl" placeholder="https://…" />
      </div>
      <label class="full row"><input type="checkbox" formControlName="active" /> Visible in the shop</label>
      @if (error()) {
        <div class="alert alert-error full">{{ error() }}</div>
      }
      <div class="full">
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Saving…' : isNew() ? 'Create product' : 'Save changes' }}
        </button>
      </div>
    </form>
  `,
})
export class AdminProductFormPage implements OnInit {
  /** Route parameter; undefined on the "new" route. */
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly categories = toSignal(this.catalog.categories().pipe(catchError(() => of([]))), { initialValue: [] });
  protected readonly isNew = computed(() => !this.id());
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    description: this.fb.nonNullable.control('', Validators.maxLength(2000)),
    categoryId: this.fb.control<number | null>(null, Validators.required),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    discountPercent: this.fb.nonNullable.control(0, [Validators.min(0), Validators.max(90)]),
    stock: this.fb.nonNullable.control(10, [Validators.required, Validators.min(0)]),
    imageUrl: this.fb.nonNullable.control('', Validators.maxLength(500)),
    active: this.fb.nonNullable.control(true),
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      return;
    }
    this.admin.product(Number(id)).subscribe({
      next: (p) =>
        this.form.reset({
          name: p.name,
          description: p.description ?? '',
          categoryId: p.categoryId,
          price: p.price,
          discountPercent: p.discountPercent,
          stock: p.stock,
          imageUrl: p.imageUrl ?? '',
          active: p.active,
        }),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill in the name, category, price and stock.');
      return;
    }
    const v = this.form.getRawValue();
    const body: ProductInput = {
      name: v.name,
      description: v.description || null,
      categoryId: v.categoryId!,
      price: v.price!,
      discountPercent: v.discountPercent,
      stock: v.stock,
      imageUrl: v.imageUrl || null,
      active: v.active,
    };
    const id = this.id();
    this.saving.set(true);
    (id ? this.admin.updateProduct(Number(id), body) : this.admin.createProduct(body)).subscribe({
      next: (p) => {
        this.toast.success(`Saved ${p.name}`);
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
