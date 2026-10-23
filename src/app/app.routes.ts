import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RaceAccessGuard } from './guards/race-access.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // The login route shows the login form.
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  // The profile route shows the user information.
  { path: 'profile', loadComponent: () => import('./components/user-info/user-info.component').then(m => m.UserInfoComponent), canActivate: [AuthGuard] },
  // Reset password route
  { path: 'reset-password', loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent), canActivate: [AuthGuard] },
  // The settings route shows the settings page.
  { path: 'settings', loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent), canActivate: [AuthGuard] },
  // Translation management route (admin only)
  { path: 'translation', loadComponent: () => import('./components/translation/translation.component').then(m => m.TranslationComponent), canActivate: [AuthGuard, AdminGuard] },
  // Admin dashboard route (admin only)
  { path: 'admin', loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [AuthGuard, AdminGuard] },
  // The root route shows the dashboard.
  { path: '', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [AuthGuard] },
  { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
  { path: 'all-teams', redirectTo: 'teams', pathMatch: 'full' },
  // A route for a bet race page.
  { path: 'race-bet/:id', loadComponent: () => import('./components/bets/race-bet/race-bet.component').then(m => m.RaceBetComponent), canActivate: [AuthGuard, RaceAccessGuard] },
  // A route for a sprint bet page.
  { path: 'sprint-bet/:id', loadComponent: () => import('./components/bets/sprint-bet/sprint-bet.component').then(m => m.SprintBetComponent), canActivate: [AuthGuard, RaceAccessGuard] },
  // A route for a lineups page.
  { path: 'lineups/:id', loadComponent: () => import('./components/lineups/lineups.component').then(m => m.LineupsComponent), canActivate: [AuthGuard, RaceAccessGuard] },
  // A route for a calendar page.
  { path: 'calendar', loadComponent: () => import('./components/calendar/calendar.component').then(m => m.CalendarComponent) },
  // A route for Race details page.
  { path: 'race-detail/:id', loadComponent: () => import('./components/race-detail/race-detail.component').then(m => m.RaceDetailComponent) },
  // A route for MotoGP results page.
  { path: 'motogp-results', loadComponent: () => import('./components/motogp-results/motogp-results.component').then(m => m.MotoGPResultsComponent) },
  { path: 'motogp-results/:championshipId/:calendarId', loadComponent: () => import('./components/motogp-results/motogp-results.component').then(m => m.MotoGPResultsComponent) },
  // A route for championship standings breakdown page.
  { path: 'standings-breakdown', loadComponent: () => import('./components/standings-breakdown/standings-breakdown.component').then(m => m.StandingsBreakdownComponent), canActivate: [AuthGuard] },
  // Trophy History (Hall of Fame)
  { path: 'trophies', loadComponent: () => import('./components/trophies/trophy-history.component').then(m => m.TrophyHistoryComponent), canActivate: [AuthGuard] },
  // Achievements / Palmares (current user)
  { path: 'achievements', loadComponent: () => import('./components/achievements/achievements.component').then(m => m.AchievementsComponent), canActivate: [AuthGuard] },
  // Achievements of a specific user
  { path: 'achievements/:userId', loadComponent: () => import('./components/achievements/achievements.component').then(m => m.AchievementsComponent), canActivate: [AuthGuard] },
  // A route for a teams page.
  { path: 'teams', loadComponent: () => import('./components/all-teams/all-teams.component').then(m => m.AllTeamsComponent), canActivate: [AuthGuard] },
  // Wildcard redirect to home
  { path: '**', redirectTo: '' }
];
