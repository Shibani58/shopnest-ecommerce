import { Component, computed, input } from '@angular/core';

/** Read-only 0-5 star display that supports fractions (e.g. 4.3). */
@Component({
  selector: 'app-star-rating',
  template: `
    <span class="stars" [attr.aria-label]="value() + ' out of 5 stars'" role="img">
      <span class="stars-empty">★★★★★</span>
      <span class="stars-fill" [style.width.%]="percent()">★★★★★</span>
    </span>
    @if (count() !== null) {
      <span class="star-count">({{ count() }})</span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 0.35rem; font-size: var(--star-size, 0.95rem); }
    .stars { position: relative; display: inline-block; line-height: 1; letter-spacing: 1px; }
    .stars-empty { color: var(--border-strong); }
    .stars-fill { position: absolute; inset: 0 auto 0 0; overflow: hidden; white-space: nowrap; color: var(--star); }
    .star-count { color: var(--text-muted); font-size: 0.8rem; }
  `,
})
export class StarRating {
  readonly value = input(0);
  readonly count = input<number | null>(null);
  readonly percent = computed(() => Math.max(0, Math.min(100, (this.value() / 5) * 100)));
}
