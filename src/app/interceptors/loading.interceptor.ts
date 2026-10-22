import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Optional: ignore background polling or analytics if needed (e.g. heartbeat)
  const isSilent = req.headers.has('X-Silent-Loading');

  if (!isSilent) {
    loadingService.startRequest();
  }

  return next(req).pipe(
    finalize(() => {
      if (!isSilent) {
        loadingService.stopRequest();
      }
    })
  );
};
