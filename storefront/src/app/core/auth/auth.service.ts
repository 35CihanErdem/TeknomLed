import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiErrorBody,
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from './auth.models';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiBase = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly bootstrappedSignal = signal(false);

  private refreshInFlight$: Observable<string | null> | null = null;

  readonly currentUser = this.userSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly bootstrapped = this.bootstrappedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() != null);
  readonly profileComplete = computed(
    () => this.userSignal()?.profileComplete ?? false
  );
  readonly roles = computed(() => this.userSignal()?.roles ?? []);
  readonly permissions = computed(() => this.userSignal()?.permissions ?? []);

  bootstrap(): Observable<AuthUser | null> {
    return this.refreshSession().pipe(
      switchMap((token) => {
        if (!token) {
          this.bootstrappedSignal.set(true);
          return of(null);
        }
        return this.loadCurrentUser().pipe(
          catchError(() => {
            this.clearClientSession();
            return of(null);
          }),
          finalize(() => this.bootstrappedSignal.set(true))
        );
      }),
      catchError(() => {
        this.clearClientSession();
        this.bootstrappedSignal.set(true);
        return of(null);
      })
    );
  }

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/api/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(map((res) => this.applyAuthResponse(res)));
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(`${this.apiBase}/api/auth/login`, payload, {
        withCredentials: true,
      })
      .pipe(map((res) => this.applyAuthResponse(res)));
  }

  loginWithGoogle(credential: string): Observable<AuthUser> {
    return this.http
      .post<AuthResponse>(
        `${this.apiBase}/api/auth/google`,
        { credential },
        { withCredentials: true }
      )
      .pipe(map((res) => this.applyAuthResponse(res)));
  }

  refreshSession(): Observable<string | null> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.http
      .post<AuthResponse>(`${this.apiBase}/api/auth/refresh`, {}, {
        withCredentials: true,
      })
      .pipe(
        map((res) => {
          this.applyAuthResponse(res);
          return res.accessToken;
        }),
        catchError(() => {
          this.clearClientSession();
          return of(null);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1)
      );

    return this.refreshInFlight$;
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiBase}/api/auth/logout`, {}, { withCredentials: true })
      .pipe(
        catchError(() => of(void 0)),
        tap(() => this.clearClientSession()),
        map(() => void 0)
      );
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.apiBase}/api/auth/me`, { withCredentials: true })
      .pipe(
        tap((user) => this.userSignal.set(user)),
        map((user) => user)
      );
  }

  updateProfile(payload: UpdateProfilePayload): Observable<AuthUser> {
    return this.http
      .put<AuthUser>(`${this.apiBase}/api/auth/profile`, payload, {
        withCredentials: true,
      })
      .pipe(tap((user) => this.userSignal.set(user)));
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  clearClientSession(): void {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
  }

  extractErrorMessage(error: unknown, fallback = 'İşlem tamamlanamadı.'): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiErrorBody | null;
      return body?.error?.message || fallback;
    }
    return fallback;
  }

  handlePostLoginNavigation(user: AuthUser, returnUrl?: string | null): void {
    if (!user.profileComplete) {
      void this.router.navigate(['/account/complete-profile'], {
        queryParams: returnUrl ? { returnUrl } : undefined,
      });
      return;
    }

    const target = this.sanitizeReturnUrl(returnUrl) ?? '/account';
    void this.router.navigateByUrl(target);
  }

  sanitizeReturnUrl(returnUrl?: string | null): string | null {
    if (!returnUrl) {
      return null;
    }
    if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
      return null;
    }
    if (returnUrl.startsWith('/account/login') || returnUrl.startsWith('/account/register')) {
      return '/account';
    }
    return returnUrl;
  }

  private applyAuthResponse(res: AuthResponse): AuthUser {
    this.accessTokenSignal.set(res.accessToken);
    this.userSignal.set(res.user);
    return res.user;
  }
}
