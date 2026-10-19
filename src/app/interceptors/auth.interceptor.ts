import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  let authReq = req;

  // Attach Bearer token to API requests if available and not already set
  const isApiUrl = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api') || !req.url.startsWith('http');
  if (token && isApiUrl && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized occurs on an authenticated route, redirect to login
      if (error.status === 401 && !req.url.includes('/login')) {
        console.warn('Session expired or unauthorized (401). Redirecting to login.');
        authService.logout();
        router.navigate(['/login'], { queryParams: { expired: 'true' } });
      }
      return throwError(() => error);
    })
  );
};
