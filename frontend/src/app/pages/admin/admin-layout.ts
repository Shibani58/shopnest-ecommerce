import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="container admin">
      <nav class="side panel" aria-label="Admin">
        <a routerLink="dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="products" routerLinkActive="active">Products</a>
        <a routerLink="categories" routerLinkActive="active">Categories</a>
        <a routerLink="orders" routerLinkActive="active">Orders</a>
      </nav>
      <section><router-outlet /></section>
    </div>
  `,
  styles: `
    .admin { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 1.5rem; padding-block: 2rem; align-items: start; }
    .side { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 0.15rem; padding: 0.75rem; }
    .side a { padding: 0.5rem 0.65rem; border-radius: var(--radius); color: var(--text); font-weight: 500; }
    .side a:hover { background: var(--surface-muted); }
    .side a.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
    @media (max-width: 800px) {
      .admin { grid-template-columns: 1fr; }
      .side { position: static; flex-direction: row; flex-wrap: wrap; }
    }
  `,
})
export class AdminLayout {}
