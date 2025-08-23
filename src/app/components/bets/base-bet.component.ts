import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router, ActivatedRoute } from "@angular/router";
import { ChampionshipService, ChampionshipConfig } from "../../services/championship.service";
import { ChampionshipRider, DashboardService } from "../../services/dashboard.service";
import { HttpService } from "../../services/http.service";
import { BetResult, LineupsResult, RaceDetailService } from "../../services/race-detail.service";
import { ExistingBetsModalComponent } from "./existing-bets-modal/existing-bets-modal.component";
import { LineupModalComponent } from "./lineup-modal/lineup-modal.component";
import { NotificationServiceService } from "../../services/notification.service";

@Component({
  template: ''
})
export abstract class BaseBetComponent implements OnInit {
  abstract betForm: FormGroup;
  abstract betType: 'sprint' | 'race';
  abstract get betEndpoint(): string;
  abstract get maxPointsPerBet(): number;
  abstract get maxBetsPerRace(): number;
  abstract get maxBetsPerPilot(): number;
  abstract get formTitle(): string;
  abstract get formSubtitle(): string;
  abstract get removeRaceRider(): boolean;

  raceTitle = '';
  loading = false;
  riders: ChampionshipRider[] = [];
  protected champId = 0;
  protected raceId: string | null = '';
  protected championshipConfig: ChampionshipConfig | null = null;
  existingBetsCurrentRace: any[] = [];
  existingBetsAllCalendar: any[] = [];
  existingLineup: LineupsResult|null = null;
  existingBetsPointsSum = 0;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected dashboardService: DashboardService,
    protected championshipService: ChampionshipService,
    protected httpService: HttpService,
    protected route: ActivatedRoute,
    protected raceDetailService: RaceDetailService,
    protected notificationService: NotificationServiceService,
    protected dialog: MatDialog
  ) {
    this.initForm();
  }

  protected initForm() {
    this.betForm = this.fb.group({
      rider_id: ['', Validators.required],
      position: ['', Validators.required],
      points: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId > 0) {
        this.champId = champId;
        this.loadChampionshipConfiguration(champId);
        this.loadRiders(champId);
        this.loadCalendarRace(champId);
      }
    });
  }

  onSubmit(): void {
    if (this.maxBetsPerRace && this.existingBetsCurrentRace.length >= this.maxBetsPerRace) {
      this.notificationService.showError('bets.maxBetsReached', { count: this.maxBetsPerRace });
      return;
    }
    if (this.betForm.valid && this.champId && this.raceId) {
      this.loading = true;
      const payload = {
        ...this.betForm.value,
        calendar_id: this.raceId
      };

      this.httpService.genericPut(`championship/${this.champId}/${this.betEndpoint}`, payload).subscribe({
        next: () => {
          this.loading = false;
          this.notificationService.showSuccess('bets.submitSuccess');
          this.loadRaceBetsAndUpdateValidations();
          this.loadAllCalendarBetsAndUpdateRiders();
          //this.router.navigate(['/race-detail', this.raceId]);
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed', err);
          this.notificationService.showError('bets.submitFail');
        }
      });
    }
  }

  protected loadRaceBetsAndUpdateValidations() {
    this.httpService.genericGet<BetResult[]>(`championship/${this.champId}/${this.betEndpoint}/${this.raceId}?allCalendar=false`).subscribe({
      next: (existingBets) => {
        this.existingBetsCurrentRace = existingBets;
        this.existingBetsPointsSum = existingBets.reduce((acc, bet) => acc + bet.points, 0);
        this.updatePointsValidation();
        this.betType === 'race' && this.updateMaxBetsValidation();
      },
      error: (err) => console.error('Error loading existing bets', err)
    });
  }

  protected loadAllCalendarBetsAndUpdateRiders() {
    this.httpService.genericGet<BetResult[]>(`championship/${this.champId}/${this.betEndpoint}/0?allCalendar=true`).subscribe({
      next: (existingBets) => {
        this.existingBetsAllCalendar = existingBets;
        this.updateRiders();
      },
      error: (err) => console.error('Error loading existing bets', err)
    });
  }

  private updateRiders() {
    const ridersToRemove: number[] = [];

    this.riders.forEach(rider => {
      // Count bets for current rider
      const countBetsPerRider = this.existingBetsAllCalendar.reduce((acc, bet) => {
        return (bet.rider_id == rider.rider_id.id) ? acc + 1 : acc;
      }, 0);

      // Check if exceeds max bets per pilot
      if (countBetsPerRider > this.maxBetsPerPilot) {
        ridersToRemove.push(rider.rider_id.id);
      }
    });

    /**Remove the race rider setted in the current lineup */
    if (this.removeRaceRider && this.existingLineup) {
      const raceRider: any = (this.existingLineup as any).race_rider_id;
      if (raceRider !== undefined && raceRider !== null) {
        const raceRiderId: number = typeof raceRider === 'object' ? raceRider.id : raceRider;
        ridersToRemove.push(raceRiderId);
      }
    }

    // Filter out riders that reached max bets using Array.filter
    this.riders = this.riders.filter(rider =>
      !ridersToRemove.includes(rider.rider_id.id)
    );
  }

  loadLineupRace(): void {
    this.raceDetailService.getLineupRace(this.champId, this.raceId ?? '0').subscribe({
      next: (existingLineup: LineupsResult) => {
        this.existingLineup = existingLineup;
        // update the riders list once lineup is loaded
        if (this.removeRaceRider) {
          this.updateRiders();
        }
      },
      error: (err) => console.error('Error loading existing lineup', err)
    });
  }

  loadRiders(championshipId: number): void {
    this.dashboardService.getAllRiders(championshipId).subscribe({
      next: (riders) => {
        this.riders = riders;
        this.loadRaceBetsAndUpdateValidations();
        this.loadAllCalendarBetsAndUpdateRiders();
        this.loadLineupRace();
        const positionControl = this.betForm.get('position');
        if (positionControl) {
          positionControl.addValidators(Validators.max(this.riders.length));
          positionControl.updateValueAndValidity();
        }
      },
      error: (err) => console.error('Failed to load riders', err)
    });
  }

  loadCalendarRace(championshipId: number) {
    this.raceDetailService.getCalendarRace(championshipId, this.raceId!).subscribe({
      next: (race) => {
        this.raceTitle = race.race_id.name;
      },
      error: (err) => console.error('Failed to load race details', err)
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private loadChampionshipConfiguration(champId: number): void {
    this.championshipService.getChampionshipConfig(champId).subscribe({
      next: (config) => {
        this.championshipConfig = config;
        this.updatePointsValidation();
        this.updateMaxBetsValidation();
      },
      error: (err) => console.error('Failed to load championship configuration', err)
    });
  }

  private updatePointsValidation(): void {
    const pointsControl = this.betForm.get('points');
    if (pointsControl && this.maxPointsPerBet) {
      const maxPoints = this.maxPointsPerBet - this.existingBetsPointsSum;
      pointsControl.setValidators([
        Validators.required,
        Validators.max(maxPoints),
        Validators.min(1) // minimum of 1 point required
      ]);
      pointsControl.updateValueAndValidity();
    }
  }

  private updateMaxBetsValidation(): void {
    if (this.maxBetsPerRace) {
      const maxReached = this.existingBetsCurrentRace.length >= this.maxBetsPerRace;
      const currentErrors = this.betForm.errors || {};

      if (maxReached) {
        this.betForm.setErrors({ ...currentErrors, maxBetsReached: true });
        this.betForm.disable();
      } else {
        const { maxBetsReached, ...remainingErrors } = currentErrors;
        this.betForm.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
        this.betForm.enable();
      }
    }
  }

  openExistingBetsModal(): void {
    const dialogRef = this.dialog?.open(ExistingBetsModalComponent, {
      width: '500px',
      data: {
        bets: this.existingBetsCurrentRace,
        riders: this.riders,
        champId: this.champId,
        raceId: this.raceId,
        betEndpoint: this.betEndpoint   // 'race_bet' or 'sprint_bet'
      }
    });

    dialogRef?.afterClosed().subscribe(() => {
      this.loadRaceBetsAndUpdateValidations();
      this.loadAllCalendarBetsAndUpdateRiders();
    });
  }


  openLineupModal(): void {
    this.dialog?.open(LineupModalComponent, {
      width: '500px',
      data: { lineups: [this.existingLineup], riders: this.riders }
    });
  }
}
