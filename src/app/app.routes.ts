import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { UserInfoComponent } from './components/user-info/user-info.component';
import { CalendarComponent } from './components/calendar/calendar.component';

export const routes: Routes = [
  // The login route shows the login form.
  { path: 'login', component: LoginComponent },
  // The profile route shows the user information.
  { path: 'profile', component: UserInfoComponent, canActivate: [AuthGuard] },
  // The root route shows the dashboard.
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  // A route for a race detail/bet page.
  { path: 'race/:id', loadComponent: () => import('./components/race/race.component').then(m => m.RaceComponent), canActivate: [AuthGuard] },
  // A route for a calendar page.
  { path: 'calendar', component: CalendarComponent }

];
