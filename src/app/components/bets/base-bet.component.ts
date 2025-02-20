import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router, ActivatedRoute } from "@angular/router";
import { ChampionshipService } from "../../services/championship.service";
import { ChampionshipRider, ChampionshipConfig, DashboardService } from "../../services/dashboard.service";
import { HttpService } from "../../services/http.service";
import { BetResult, RaceDetailService } from "../../services/race-detail.service";
import { ExistingBetsModalComponent } from "./existing-bets-modal/existing-bets-modal.component";

@Component({
  template: ''
})
export abstract class BaseBetComponent implements OnInit {
  abstract betForm: FormGroup;
  abstract betType: 'sprint' | 'race';
  abstract get betEndpoint(): string;
  abstract get pointsLimit(): number;
  abstract get maxBets(): number;

  loading = false;
  riders: ChampionshipRider[] = [];
  protected champId = 0;
  protected raceId: string | null = '';
  raceTitle = '';
  protected championshipConfig: ChampionshipConfig | null = null;
  existingBets: BetResult[] = [];
  existingBetsPointsSum = 0;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected dashboardService: DashboardService,
    protected championshipService: ChampionshipService,
    protected httpService: HttpService,
    protected route: ActivatedRoute,
    protected raceDetailService: RaceDetailService,
    protected dialog?: MatDialog
  ) {
    this.initForm();
  }

  protected initForm() {
    this.betForm = this.fb.group({
      rider_id: ['', Validators.required],
      position: ['', Validators.required],
      points: ['', Validators.required]
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
    if (this.championshipConfig && this.existingBets.length >= this.maxBets) {
      alert(`Maximum ${this.championshipConfig.bets_limit_race} bets reached for this race`);
      return;
    }
    if (this.betForm.valid && this.champId && this.raceId) {
      this.loading = true;
      const payload = {
        ...this.betForm.value,
        calendar_id: this.raceId
      };

      this.httpService.genericPut(`/championship/${this.champId}/${this.betEndpoint}`, payload).subscribe({
        next: () => {
          this.loading = false;
          alert('race bet submitted successfully!');
          this.router.navigate(['/race-detail', this.raceId]);
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed', err);
          alert('Submission failed. Please try again.');
        }
      });
    }
  }

  protected loadBets(endpoint: string) {
    this.httpService.genericGet<BetResult[]>(`championship/${this.champId}/${endpoint}/${this.raceId}`).subscribe({
      next: (existingBets) => {
        this.existingBets = existingBets;
        this.existingBetsPointsSum = existingBets.reduce((acc, bet) => acc + bet.points, 0);
        this.updatePointsValidation();
        this.betType === 'race' && this.updateMaxBetsValidation();
      },
      error: (err) => console.error('Error loading existing bets', err)
    });
  }

  loadExistingRaceBet() {
    this.httpService.genericGet<BetResult[]>(`championship/${this.champId}/race_bet/${this.raceId}`).subscribe({
      next: (existingBets) => {
        this.existingBets = existingBets;
        this.existingBetsPointsSum = existingBets.reduce((acc, bet) => acc + bet.points, 0);
        this.updatePointsValidation();
        this.updateMaxBetsValidation();
      },
      error: (err) => console.error('Error loading existing bet', err)
    });
  }

  loadRiders(championshipId: number): void {
    this.dashboardService.getAllRiders(championshipId).subscribe({
      next: (riders) => {
        this.riders = riders;
        this.loadExistingRaceBet();
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
    this.dashboardService.getChampionshipConfig(champId).subscribe({
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
    if (pointsControl && this.championshipConfig) {
      const maxPoints = this.championshipConfig.bets_limit_points - this.existingBetsPointsSum;
      pointsControl.setValidators([
        Validators.required,
        Validators.max(maxPoints)
      ]);
      pointsControl.updateValueAndValidity();
    }
  }

  private updateMaxBetsValidation(): void {
    if (this.championshipConfig) {
      const maxReached = this.existingBets.length >= this.championshipConfig.bets_limit_race;
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
    this.dialog?.open(ExistingBetsModalComponent, {
      width: '500px',
      data: { bets: this.existingBets, riders: this.riders }
    });
  }
}
