import { Component, input, signal } from '@angular/core';

/** Product photo with a neutral placeholder when the URL is missing or fails to load. */
@Component({
  selector: 'app-product-image',
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="alt()" loading="lazy" (error)="failed.set(true)" />
    } @else {
      <div class="placeholder" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="m21 16-5-5-9 9" />
        </svg>
      </div>
    }
  `,
  styles: `
    :host { display: block; width: 100%; height: 100%; }
    img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--text-muted); background: var(--surface-muted); }
  `,
})
export class ProductImage {
  readonly src = input<string | null>(null);
  readonly alt = input('');
  protected readonly failed = signal(false);
}
