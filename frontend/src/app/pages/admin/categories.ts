import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/api';
import { CatalogService } from '../../core/catalog.service';
import { Category } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  template: `
    <h1>Categories</h1>
    <form class="panel add" (ngSubmit)="save()">
      <div class="form-grid">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" name="name" maxlength="60" [(ngModel)]="name" />
        </div>
        <div class="field">
          <label for="description">Description</label>
          <input id="description" name="description" maxlength="255" [(ngModel)]="description" />
        </div>
      </div>
      <div class="row">
        <button type="submit" class="btn btn-primary" [disabled]="!name.trim()">{{ editing() ? 'Save' : 'Add category' }}</button>
        @if (editing()) {
          <button type="button" class="btn btn-ghost" (click)="reset()">Cancel</button>
        }
      </div>
    </form>
    <div class="panel table-wrap">
      <table class="table">
        <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
        <tbody>
          @for (c of categories(); track c.id) {
            <tr>
              <td><strong>{{ c.name }}</strong></td>
              <td class="muted">{{ c.description }}</td>
              <td class="actions">
                <button type="button" class="btn btn-ghost btn-sm" (click)="edit(c)">Edit</button>
                <button type="button" class="btn btn-danger btn-sm" (click)="remove(c)">Delete</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .add { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .actions { white-space: nowrap; text-align: right; }
    .actions .btn + .btn { margin-left: 0.4rem; }
  `,
})
export class AdminCategoriesPage {
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly editing = signal<Category | null>(null);
  protected name = '';
  protected description = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.catalog.refreshCategories();
    this.catalog.categories().subscribe({
      next: (list) => this.categories.set(list),
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  edit(c: Category): void {
    this.editing.set(c);
    this.name = c.name;
    this.description = c.description ?? '';
  }

  reset(): void {
    this.editing.set(null);
    this.name = '';
    this.description = '';
  }

  save(): void {
    const current = this.editing();
    const request = current
      ? this.admin.updateCategory(current.id, this.name.trim(), this.description.trim())
      : this.admin.createCategory(this.name.trim(), this.description.trim());
    request.subscribe({
      next: (c) => {
        this.toast.success(`Saved ${c.name}`);
        this.reset();
        this.load();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  remove(c: Category): void {
    if (!confirm(`Delete category "${c.name}"?`)) {
      return;
    }
    this.admin.deleteCategory(c.id).subscribe({
      next: () => {
        this.toast.info(`Deleted ${c.name}`);
        this.load();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}
