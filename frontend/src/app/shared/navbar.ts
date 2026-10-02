import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="nav">
      <div class="container nav-inner">
        <a routerLink="/" class="brand" (click)="menuOpen.set(false)">
          <img src="favicon.svg" alt="" width="28" height="28" />
          <span>Shop<strong>Nest</strong></span>
        </a>

        <form class="search" role="search" (ngSubmit)="search()">
          <input type="search" name="q" [(ngModel)]="query" placeholder="Search products, brands, categories…" aria-label="Search products" />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
        </form>

        <button type="button" class="menu-toggle" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-label="Menu">☰</button>

        <nav class="links" [class.open]="menuOpen()" (click)="menuOpen.set(false)">
          <a routerLink="/products" routerLinkActive="active">Shop</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active">Admin</a>
          }
          @if (auth.user(); as user) {
            <a routerLink="/wishlist" routerLinkActive="active">Wishlist</a>
            <a routerLink="/orders" routerLinkActive="active">Orders</a>
            <a routerLink="/cart" routerLinkActive="active" class="cart-link">
              Cart
              @if (cart.count() > 0) {
                <span class="count">{{ cart.count() }}</span>
              }
            </a>
            <span class="hello" [title]="user.email">Hi, {{ firstName(user.fullName) }}</span>
            <button type="button" class="btn btn-ghost btn-sm" (click)="auth.logout()">Log out</button>
          } @else {
            <a routerLink="/login" class="btn btn-ghost btn-sm">Log in</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Sign up</a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: `
    .nav { position: sticky; top: 0; z-index: 50; background: var(--surface); border-bottom: 1px solid var(--border); }
    .nav-inner { display: flex; align-items: center; gap: 1.25rem; height: 64px; }
    .brand { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: var(--text); flex-shrink: 0; }
    .brand strong { color: var(--primary); }
    .search { flex: 1; display: flex; max-width: 520px; border: 1px solid var(--border-strong); border-radius: 999px; overflow: hidden; background: var(--surface-muted); }
    .search:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
    .search input { flex: 1; min-width: 0; border: 0; background: transparent; padding: 0.55rem 1rem; outline: none; color: var(--text); }
    .search button { border: 0; background: transparent; padding: 0 0.9rem; color: var(--text-muted); cursor: pointer; }
    .links { display: flex; align-items: center; gap: 1rem; margin-left: auto; }
    .links > a:not(.btn) { color: var(--text-muted); font-weight: 500; }
    .links > a:not(.btn):hover, .links > a.active { color: var(--primary); }
    .cart-link { position: relative; }
    .count { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; margin-left: 2px; border-radius: 999px; background: var(--accent); color: #1f2937; font-size: 0.72rem; font-weight: 700; }
    .hello { color: var(--text-muted); font-size: 0.9rem; white-space: nowrap; }
    .menu-toggle { display: none; margin-left: auto; background: none; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.3rem 0.65rem; font-size: 1.1rem; color: var(--text); cursor: pointer; }
    @media (max-width: 900px) {
      .nav-inner { flex-wrap: wrap; height: auto; padding-block: 0.6rem; gap: 0.6rem 1rem; }
      .search { order: 3; flex-basis: 100%; max-width: none; }
      .menu-toggle { display: block; }
      .links { display: none; order: 4; flex-basis: 100%; flex-direction: column; align-items: flex-start; gap: 0.75rem; padding: 0.5rem 0 0.75rem; }
      .links.open { display: flex; }
    }
  `,
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected query = '';

  search(): void {
    const q = this.query.trim();
    this.router.navigate(['/products'], { queryParams: q ? { q } : {} });
  }

  firstName(fullName: string): string {
    return fullName.split(' ')[0];
  }
}
