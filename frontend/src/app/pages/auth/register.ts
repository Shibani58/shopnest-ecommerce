import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <form class="panel auth-card stack" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <h1>Create your account</h1>
          <p class="muted">It takes less than a minute.</p>
        </div>
        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }
        <div class="field">
          <label for="fullName">Full name</label>
          <input id="fullName" formControlName="fullName" autocomplete="name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="new-password" />
          <span class="small muted">At least 8 characters.</span>
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <span class="field-error">Password must be 8-64 characters.</span>
          }
        </div>
        <button type="submit" class="btn btn-primary btn-block" [disabled]="loading()">
          {{ loading() ? 'Creating account…' : 'Create account' }}
        </button>
        <p class="small muted center">
          Already have an account? <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl() }">Log in</a>
        </p>
      </form>
    </div>
  `,
  styleUrl: './auth.css',
})
export class RegisterPage {
  readonly returnUrl = input<string>('/');

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fix the highlighted fields.');
      return;
    }
    const { fullName, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.auth.register(fullName, email, password).subscribe({
      next: () => {
        this.toast.success('Account created. Happy shopping!');
        this.router.navigateByUrl(this.returnUrl() || '/');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
