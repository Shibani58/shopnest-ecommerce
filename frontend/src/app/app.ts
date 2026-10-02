import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar';
import { ToastContainer } from './shared/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Navbar, ToastContainer],
  template: `
    <app-navbar />
    <main class="page">
      <router-outlet />
    </main>
    <footer class="footer">
      <div class="container footer-inner">
        <a routerLink="/" class="footer-brand">ShopNest</a>
        <span>Built with Angular &amp; Spring Boot · Demo store, no real payments</span>
      </div>
    </footer>
    <app-toast-container />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .page { flex: 1; }
    .footer { border-top: 1px solid var(--border); background: var(--surface); padding: 1.5rem 0; color: var(--text-muted); font-size: 0.85rem; }
    .footer-inner { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; justify-content: space-between; align-items: center; }
    .footer-brand { font-weight: 800; color: var(--primary); }
  `,
})
export class App {}
