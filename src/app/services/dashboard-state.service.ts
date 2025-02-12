// src/app/services/dashboard-state.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {
  // false means the dashboard has not been animated yet.
  animated = false;
}
