import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RaceDetailService } from '../services/race-detail.service';
import { ChampionshipService } from '../services/championship.service';
import { RaceScheduleService } from '../services/race-schedule.service';


import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class RaceAccessGuard implements CanActivate {
  private snackBar = inject(MatSnackBar);

  constructor(
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private raceScheduleService: RaceScheduleService,
    private authService: AuthService,
    private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    try {
      const raceId = route.params['id'];

      const champ = await firstValueFrom(this.championshipService.getDefaultChampionship());

      if (!champ) return this.router.parseUrl('/');

      const config = await firstValueFrom(this.championshipService.getChampionshipConfig(champ.id));
      const race = await firstValueFrom(this.raceDetailService.getCalendarRace(champ.id, raceId));

      if (!race) return this.router.parseUrl('/');

      const timeZone = config?.timezone;
      let result = false;
      let sessionName = 'questa sessione';

      if (route.routeConfig?.path?.includes('race-bet')) {
        sessionName = 'la scommessa gara';
        result = this.raceScheduleService.canShowRaceBet(race, timeZone);
      } else if (route.routeConfig?.path?.includes('sprint-bet')) {
        sessionName = 'la scommessa sprint';
        result = this.raceScheduleService.canShowSprintBet(race, timeZone);
      } else if (route.routeConfig?.path?.includes('lineups')) {
        sessionName = 'lo schieramento';
        result = this.raceScheduleService.canShowLineups(race, timeZone);
      }

      if (route.queryParamMap.get('preview') === 'true' || this.authService.isCurrentUserAdmin()) {
        return true;
      }

      if (!result) {
        this.snackBar.open(`Finestra per ${sessionName} al momento chiusa.`, 'OK', {
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        return this.router.parseUrl('/');
      }

      return true;
    } catch (error) {
      return this.router.parseUrl('/');
    }
  }
}
