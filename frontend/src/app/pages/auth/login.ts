import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <form class="panel auth-card stack" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <h1>Welcome back</h1>
          <p class="muted">Log in to see your cart, orders and wishlist.</p>
        </div>
        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
          {{ loading() ? 'Logging in…' : 'Log in' }}
        </button>
        <p class="small muted center">
          New to ShopNest? <a routerLink="/register" [queryParams]="{ returnUrl: returnUrl() }">Create an account</a>
        </p>
        <div class="demo small">
          <strong>Trying the demo?</strong>
          <button type="button" class="link-btn" (click)="fillDemo('customer@shopnest.dev', 'Customer@123')">Use the customer account</button>
          <span class="muted">or create your own.</span>
        </div>
      </form>
    </div>
  `,
  styleUrl: './auth.css',
})
export class LoginPage {
  /** Where to go after logging in (set by the auth guard). */
  readonly returnUrl = input<string>('/');

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please enter your email and password.');
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
        this.router.navigateByUrl(this.returnUrl() || '/');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
