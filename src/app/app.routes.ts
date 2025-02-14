import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { UserInfoComponent } from './components/user-info/user-info.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AllTeamsComponent } from './components/all-teams/all-teams.component';

export const routes: Routes = [
  // The login route shows the login form.
  { path: 'login', component: LoginComponent },
  // The profile route shows the user information.
  { path: 'profile', component: UserInfoComponent, canActivate: [AuthGuard] },
  // The settings route shows the settings page.
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  // The root route shows the dashboard.
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  // A route for a bet race page.
  { path: 'race-bet/:id', loadComponent: () => import('./components/race-bet/race-bet.component').then(m => m.RaceBetComponent), canActivate: [AuthGuard] },
  // A route for a sprint bet page.
  { path: 'sprint-bet/:id', loadComponent: () => import('./components/sprint-bet/sprint-bet.component').then(m => m.SprintBetComponent), canActivate: [AuthGuard] },
  // A route for a lineups page.
  { path: 'lineups/:id', loadComponent: () => import('./components/lineups/lineups.component').then(m => m.LineupsComponent), canActivate: [AuthGuard] },
  // A route for a calendar page.
  { path: 'calendar', component: CalendarComponent },
  // A route for Race details page.
  { path: 'race-detail/:id', loadComponent: () => import('./components/race-detail/race-detail.component').then(m => m.RaceDetailComponent) },
  // A route for a teams page.
  { path: 'teams', component: AllTeamsComponent, canActivate: [AuthGuard] },
];
