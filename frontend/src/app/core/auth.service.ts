import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { API } from './api';
import { AuthResponse, User } from './models';

interface Session {
  token: string;
  user: User;
  expiresAt: number;
}

const STORAGE_KEY = 'shopnest.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(restoreSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API}/auth/login`, { email, password })
      .pipe(tap((res) => this.store(res)), map((res) => res.user));
  }

  register(fullName: string, email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API}/auth/register`, { fullName, email, password })
      .pipe(tap((res) => this.store(res)), map((res) => res.user));
  }

  logout(redirectTo: string | null = '/'): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    if (redirectTo) {
      this.router.navigateByUrl(redirectTo);
    }
  }

  private store(res: AuthResponse): void {
    const session: Session = { token: res.token, user: res.user, expiresAt: Date.now() + res.expiresInMs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session.set(session);
  }
}

function restoreSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const session = JSON.parse(raw) as Session;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}
