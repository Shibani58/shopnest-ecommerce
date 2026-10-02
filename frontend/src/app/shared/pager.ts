import { Component, computed, input, output } from '@angular/core';

/** Previous / next pagination for a zero-based page index. */
@Component({
  selector: 'app-pager',
  template: `
    @if (totalPages() > 1) {
      <nav class="pager" aria-label="Pagination">
        <button type="button" class="btn btn-ghost" [disabled]="page() === 0" (click)="pageChange.emit(page() - 1)">← Previous</button>
        <span class="info">Page {{ page() + 1 }} of {{ totalPages() }}</span>
        <button type="button" class="btn btn-ghost" [disabled]="isLast()" (click)="pageChange.emit(page() + 1)">Next →</button>
      </nav>
    }
  `,
  styles: `
    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
    .info { color: var(--text-muted); font-size: 0.9rem; }
  `,
})
export class Pager {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
  protected readonly isLast = computed(() => this.page() >= this.totalPages() - 1);
}
