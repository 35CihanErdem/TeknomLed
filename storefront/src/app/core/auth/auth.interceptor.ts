import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBase = environment.apiBaseUrl.replace(/\/$/, '');
  const isApiRequest = apiBase
    ? req.url.startsWith(apiBase)
    : req.url.startsWith('/api');
  const isAuthRefresh = req.url.includes('/api/auth/refresh');
  const isAuthLogin =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register') ||
    req.url.includes('/api/auth/google');

  let outgoing = req;
  if (isApiRequest) {
    const token = auth.getAccessToken();
    const headers = token
      ? req.headers.set('Authorization', `Bearer ${token}`)
      : req.headers;
    outgoing = req.clone({
      headers,
      withCredentials: true,
    });
  }

  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        !isApiRequest ||
        isAuthRefresh ||
        isAuthLogin
      ) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap((token) => {
          if (!token) {
            auth.clearClientSession();
            return throwError(() => error);
          }

          const retry = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          return next(retry);
        })
      );
    })
  );
};
