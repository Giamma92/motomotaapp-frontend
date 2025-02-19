import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { RaceDetailService } from '../services/race-detail.service';
import { ChampionshipService } from '../services/championship.service';
import { RaceScheduleService } from '../services/race-schedule.service';


@Injectable({
  providedIn: 'root'
})
export class RaceAccessGuard implements CanActivate {

  constructor(
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private raceScheduleService: RaceScheduleService,
    private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    try {
      const raceId = route.params['id'];

      const champ = await firstValueFrom(this.championshipService.getDefaultChampionship());

      if (!champ) return  this.router.parseUrl('/');

      const race = await firstValueFrom(this.raceDetailService.getCalendarRace(champ.id, raceId));

      if (!race) return this.router.parseUrl('/');

      let result;
      if (route.routeConfig?.path?.includes('race-bet')) {
        result = this.raceScheduleService.canShowRaceBet(race);
      } else if (route.routeConfig?.path?.includes('sprint-bet')) {
        result = this.raceScheduleService.canShowSprintBet(race);
      } else if (route.routeConfig?.path?.includes('lineups')) {
        result = this.raceScheduleService.canShowLineups(race);
      }

      return result || this.router.parseUrl('/');
    } catch (error) {
      return this.router.parseUrl('/');
    }
  }
}
