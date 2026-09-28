// src/app/components/all-teams/all-teams.component.ts
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, FantasyTeam, Rider, ChampionshipRider, StandingsRow } from '../../services/dashboard.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChampionshipService } from '../../services/championship.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { RaceDetailService, RaceDetails, LineupsResult } from '../../services/race-detail.service';
import { LineupModalComponent } from '../bets/lineup-modal/lineup-modal.component';

interface StatTile {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}

interface TeamRiderView {
  roleKey: string;
  tier: string;
  rider: Rider;
  lineups: number;
  qualifying: number;
  race: number;
}

interface TeamView {
  team: FantasyTeam;
  rank: number | null;
  score: number | null;
  riders: TeamRiderView[];
}

@Component({
  selector: 'app-all-teams',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './all-teams.component.scss',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslatePipe
  ],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'teams.title' | t }}</h1>
      </header>

      <main class="main-content">
        <!-- ═══════════ Loading ═══════════ -->
        <div *ngIf="loading" class="ux-state loading-container">
          <div class="ux-state-card">
            <mat-spinner diameter="34"></mat-spinner>
            <p>{{ 'common.loading' | t }}</p>
          </div>
        </div>

        <!-- ═══════════ Retryable error state ═══════════ -->
        <div *ngIf="!loading && loadError" class="ux-state">
          <div class="ux-state-card">
            <i class="fa-solid fa-triangle-exclamation ux-state-icon"></i>
            <p>Impossibile caricare le squadre.</p>
            <button mat-raised-button color="accent" class="retry-btn" (click)="reload()">
              <i class="fa-solid fa-arrows-rotate"></i>
              Riprova
            </button>
          </div>
        </div>

        <div *ngIf="!loading && !loadError" class="teams-layout">
          <!-- ═══════════ Riepilogo campionato ═══════════ -->
          <section class="stats-strip" *ngIf="tiles.length" aria-label="Riepilogo campionato">
            <article class="stat-tile" *ngFor="let t of tiles">
              <i [class]="t.icon"></i>
              <div class="stat-copy">
                <span class="stat-label">{{ t.label }}</span>
                <strong class="stat-value" [title]="t.value">{{ t.value }}</strong>
                <span class="stat-sub" *ngIf="t.sub" [title]="t.sub">{{ t.sub }}</span>
              </div>
            </article>
          </section>

          <!-- ═══════════ Griglia squadre (ordinata per classifica) ═══════════ -->
          <section class="teams-grid" *ngIf="viewTeams.length" aria-label="Elenco squadre">
            <article
              class="team-card"
              *ngFor="let v of viewTeams"
              [class.rank-1]="v.rank === 1"
              [class.rank-2]="v.rank === 2"
              [class.rank-3]="v.rank === 3"
            >
              <!-- Testata: posizione + logo + identità + punteggio -->
              <div class="team-top">
                <span
                  class="rank-badge"
                  [class]="'rank-' + (v.rank != null ? v.rank : 'none')"
                  [attr.aria-label]="v.rank != null ? ('dashboard.standings.rank' | t) + ': ' + v.rank : ''"
                >
                  <ng-container *ngIf="v.rank != null; else rankDash">{{ v.rank }}</ng-container>
                  <ng-template #rankDash>–</ng-template>
                </span>

                <div class="team-logo">
                  <img *ngIf="v.team.team_image" [src]="v.team.team_image" [alt]="v.team.name" />
                  <span *ngIf="!v.team.team_image" class="logo-ph"><mat-icon>groups</mat-icon></span>
                </div>

                <div class="team-ident">
                  <h2 class="team-name" [title]="v.team.name">{{ v.team.name }}</h2>
                  <div class="user-chips">
                    <span class="chip">
                      <mat-icon>person</mat-icon>
                      {{ v.team.user_id.first_name }} {{ v.team.user_id.last_name }}
                    </span>
                    <span class="chip chip-id">
                      <mat-icon>fingerprint</mat-icon>
                      {{ v.team.user_id.id }}
                    </span>
                  </div>
                </div>

                <div class="score-box" *ngIf="v.score != null">
                  <strong class="score-value">{{ v.score }}</strong>
                  <span class="score-label">{{ 'dashboard.standings.score' | t }}</span>
                </div>
              </div>

              <!-- Piloti con utilizzo schieramenti -->
              <div class="rider-grid">
                <mat-expansion-panel
                  *ngFor="let r of v.riders"
                  class="rider-panel app-expansion-panel"
                  [ngClass]="r.tier"
                >
                  <mat-expansion-panel-header class="rider-header">
                    <div class="rider-header-main">
                      <span class="rider-role">{{ r.roleKey | t }}</span>
                      <div class="rider-name-row">
                        <span class="rider-name">{{ r.rider.first_name }} {{ r.rider.last_name }}</span>
                        <span class="rider-header-number">#{{ r.rider.number }}</span>
                        <span
                          class="maker-chip"
                          *ngIf="makerFor(r.rider)"
                          [style.--maker]="makerColor(makerFor(r.rider))"
                          [attr.title]="makerFullFor(r.rider)"
                        >
                          <i class="fa-solid fa-circle"></i><span class="maker-name">{{ makerFor(r.rider) }}</span>
                        </span>
                      </div>
                    </div>
                    <span
                      class="usage-pill"
                      [attr.title]="'dashboard.team.lineupsUsed' | t"
                      [attr.aria-label]="('dashboard.team.lineupsUsed' | t) + ': ' + r.lineups"
                    >
                      <i class="fa-solid fa-clipboard-list"></i>{{ r.lineups }}
                    </span>
                  </mat-expansion-panel-header>
                  <div class="rider-info">
                    <div class="rider-stats">
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.lineupsUsed' | t }}</span>
                        <span class="stat-value">{{ r.lineups }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.qualifyingRider' | t }}</span>
                        <span class="stat-value">{{ r.qualifying }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.raceRider' | t }}</span>
                        <span class="stat-value">{{ r.race }}</span>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>
              </div>

              <footer class="team-card-actions">
                <button
                  mat-button
                  color="primary"
                  class="view-button"
                  [disabled]="!hasLineups(v.team)"
                  (click)="openLineupModal(v.team)"
                >
                  <mat-icon>visibility</mat-icon>
                  {{ 'teams.viewTeam' | t }}
                </button>
              </footer>
            </article>
          </section>

          <!-- ═══════════ Empty state ═══════════ -->
          <div *ngIf="!viewTeams.length" class="no-teams">
            <p>{{ 'teams.empty' | t }}</p>
          </div>
        </div>
      </main>
    </div>
  `
})
export class AllTeamsComponent implements OnInit {
  teams: FantasyTeam[] = [];
  viewTeams: TeamView[] = [];
  tiles: StatTile[] = [];
  loading = true;
  loadError = false;

  private champId = 0;
  private racesDetails?: RaceDetails;
  private standingsRows: StandingsRow[] = [];
  private champRiders: ChampionshipRider[] = [];

  private ridersLineupsCount: Map<string, number> = new Map<string, number>();
  private ridersQualifyingCount: Map<string, number> = new Map<string, number>();
  private ridersRaceCount: Map<string, number> = new Map<string, number>();

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;
      this.champId = champId;
      this.loadAll();
    });
  }

  reload(): void {
    this.loadAll();
  }

  private loadAll(): void {
    if (!this.champId) return;
    const champId = this.champId;

    this.loading = true;
    this.loadError = false;
    this.teams = [];
    this.viewTeams = [];
    this.tiles = [];
    this.racesDetails = undefined;
    this.standingsRows = [];
    this.champRiders = [];

    let pending = 4;
    const finish = () => {
      if (--pending > 0 || this.loadError) return;
      this.loading = false;
      this.buildView();
    };

    // 1) Squadre fantasy (essenziale)
    this.dashboardService.getAllFantasyTeams(champId).subscribe({
      next: (data: FantasyTeam[]) => {
        this.teams = data ?? [];
        finish();
      },
      error: (err) => {
        console.error('Error fetching all fantasy teams:', err);
        this.teams = [];
        this.loadError = true;
        this.loading = false;
      }
    });

    // 2) Schieramenti di tutti gli utenti/tutte le gare (conteggi + riepilogo)
    this.raceDetailService.getRaceDetails(champId, '0', { allCalendar: true, allUsers: true }).subscribe({
      next: (data: RaceDetails) => {
        this.racesDetails = data;
        finish();
      },
      error: (err) => {
        console.error('Error fetching race details for all teams:', err);
        this.racesDetails = undefined;
        finish();
      }
    });

    // 3) Classifica campionato (posizione + punteggio)
    this.dashboardService.getClassification(champId).subscribe({
      next: (rows: StandingsRow[]) => {
        this.standingsRows = rows ?? [];
        finish();
      },
      error: (err) => {
        console.error('Error fetching standings:', err);
        this.standingsRows = [];
        finish();
      }
    });

    // 4) Piloti del campionato (costruttore per ogni pilota)
    this.dashboardService.getAllRiders(champId).subscribe({
      next: (rows: ChampionshipRider[]) => {
        this.champRiders = rows ?? [];
        finish();
      },
      error: (err) => {
        console.error('Error fetching championship riders:', err);
        this.champRiders = [];
        finish();
      }
    });
  }

  /* ═══════════════ View-model ═══════════════ */

  private buildView(): void {
    this.computeTeamRiderCounts();

    const rankByUser = new Map<string, StandingsRow>();
    const rankByUserName = new Map<string, StandingsRow>();
    this.standingsRows.forEach((row) => {
      rankByUser.set(String(this.extractId(row.user_id) ?? ''), row);
      rankByUserName.set(this.getUserNameKey(row.user_id), row);
    });

    const constructorByRider = new Map<number, string>();
    this.champRiders.forEach((cr) => {
      const id = cr?.rider_id?.id;
      const name = cr?.constructor_id?.name;
      if (id != null && name) constructorByRider.set(Number(id), String(name).trim());
    });
    this.constructorByRider = constructorByRider;

    this.viewTeams = this.teams
      .map((team) => {
        const row =
          rankByUser.get(String(this.extractId(team.user_id) ?? '')) ??
          rankByUserName.get(this.getUserNameKey(team.user_id)) ??
          null;

        const riders: TeamRiderView[] = [];
        this.pushRiderView(riders, team, team.official_rider_1, 'dashboard.team.firstTierPilot', 'first-tier');
        if (team.official_rider_2) {
          this.pushRiderView(riders, team, team.official_rider_2, 'dashboard.team.secondTierPilot', 'second-tier');
        }
        this.pushRiderView(riders, team, team.reserve_rider, 'dashboard.team.thirdTierPilot', 'third-tier');

        return {
          team,
          rank: row && row.position != null ? Number(row.position) : null,
          score: row && row.score != null ? Number(row.score) : null,
          riders
        } as TeamView;
      })
      .sort((a, b) => {
        if (a.rank != null && b.rank != null) return a.rank - b.rank;
        if (a.rank != null) return -1;
        if (b.rank != null) return 1;
        return a.team.name.localeCompare(b.team.name);
      });

    this.tiles = this.buildTiles();
  }

  private pushRiderView(
    acc: TeamRiderView[],
    team: FantasyTeam,
    rider: Rider | null | undefined,
    roleKey: string,
    tier: string
  ): void {
    if (!rider || rider.id == null) return;
    acc.push({
      roleKey,
      tier,
      rider,
      lineups: this.getTeamRiderLineupsCount(team, rider.id),
      qualifying: this.getTeamRiderQualifyingCount(team, rider.id),
      race: this.getTeamRiderRaceCount(team, rider.id)
    });
  }

  private buildTiles(): StatTile[] {
    const tiles: StatTile[] = [];

    tiles.push({
      icon: 'fa-solid fa-people-group',
      label: 'Squadre',
      value: String(this.viewTeams.length)
    });

    const racesCount = new Set(
      (this.racesDetails?.lineups ?? []).map((l) => String(this.extractId(l.calendar_id) ?? ''))
    ).size;
    if (racesCount > 0) {
      tiles.push({
        icon: 'fa-solid fa-calendar-check',
        label: 'Gare schierate',
        value: String(racesCount)
      });
    }

    const lineupsTotal = this.racesDetails?.lineups?.length ?? 0;
    if (lineupsTotal > 0) {
      tiles.push({
        icon: 'fa-solid fa-clipboard-list',
        label: 'Schieramenti totali',
        value: String(lineupsTotal)
      });
    }

    const leader = this.standingsRows.find((r) => Number(r.position) === 1) ?? this.standingsRows[0];
    if (leader) {
      tiles.push({
        icon: 'fa-solid fa-crown',
        label: 'Leader',
        value: `${leader.user_id?.first_name ?? ''} ${leader.user_id?.last_name ?? ''}`.trim(),
        sub: leader.score != null ? `${leader.score} Punti` : undefined
      });
    }

    return tiles;
  }

  private constructorByRider = new Map<number, string>();

  /** Nome breve del team GP del pilota (es. "BK8 Gresini Racing" da "... MotoGP"). */
  makerFor(rider: Rider): string {
    if (!rider || rider.id == null) return '';
    const full = this.constructorByRider.get(Number(rider.id)) ?? '';
    return full
      .replace(/\s+MotoGP(\s+Team)?$/i, '')
      .replace(/\s+Team$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Nome completo del team (per title/tooltip). */
  makerFullFor(rider: Rider): string {
    if (!rider || rider.id == null) return '';
    return this.constructorByRider.get(Number(rider.id)) ?? '';
  }

  makerColor(name?: string): string {
    const m = (name || '').toLowerCase();
    if (m.includes('ducati')) return '#d50f2a';
    if (m.includes('aprilia')) return '#f4c300';
    if (m.includes('ktm')) return '#ff8f00';
    if (m.includes('honda')) return '#ff5252';
    if (m.includes('yamaha')) return '#2979ff';
    if (m.includes('suzuki')) return '#e53935';
    return '#78909c';
  }

  /* ═══════════════ Lineup modal ═══════════════ */

  private teamLineups(team: FantasyTeam): LineupsResult[] {
    return (this.racesDetails?.lineups ?? []).filter((lineup) => {
      const lineupUserId = this.extractId(lineup.user_id);
      const teamUserId = this.extractId(team.user_id);
      if (lineupUserId != null && teamUserId != null) {
        return String(lineupUserId) === String(teamUserId);
      }
      return this.getUserNameKey(lineup.user_id) === this.getUserNameKey(team.user_id);
    });
  }

  hasLineups(team: FantasyTeam): boolean {
    return this.teamLineups(team).length > 0;
  }

  openLineupModal(team: FantasyTeam): void {
    const lineups = this.teamLineups(team)
      .slice()
      .sort(
        (a, b) =>
          (a.calendar_id?.race_order ?? Number.MAX_SAFE_INTEGER) -
          (b.calendar_id?.race_order ?? Number.MAX_SAFE_INTEGER)
      );
    if (!lineups.length) return;

    this.dialog.open(LineupModalComponent, {
      width: '640px',
      data: { lineups, riders: this.champRiders, title: team.name }
    });
  }

  /* ═══════════════ Counts per team/rider ═══════════════ */

  private getTeamRiderKey(team: FantasyTeam, riderId: number): string {
    return `${String(team.user_id?.id ?? '')}-${String(riderId ?? '')}`;
  }

  private extractId(value: any): string | number | undefined {
    if (value == null) return undefined;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object' && 'id' in value) return value.id;
    return undefined;
  }

  private normalizeText(value: any): string {
    return String(value ?? '').trim().toLowerCase();
  }

  private getUserNameKey(user: any): string {
    const firstName = this.normalizeText(user?.first_name);
    const lastName = this.normalizeText(user?.last_name);
    return `${firstName}|${lastName}`;
  }

  private incrementCount(map: Map<string, number>, key: string): void {
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  private computeTeamRiderCounts(): void {
    this.ridersLineupsCount.clear();
    this.ridersQualifyingCount.clear();
    this.ridersRaceCount.clear();

    if (!this.teams.length || !this.racesDetails?.lineups?.length) {
      return;
    }

    const teamByUserId = new Map(this.teams.map((team) => [String(this.extractId(team.user_id) ?? ''), team]));
    const teamByUserName = new Map(this.teams.map((team) => [this.getUserNameKey(team.user_id), team]));

    this.racesDetails.lineups.forEach((lineup) => {
      const userId = this.extractId(lineup.user_id);
      const team = userId
        ? teamByUserId.get(String(userId))
        : teamByUserName.get(this.getUserNameKey(lineup.user_id));

      if (!team) return;

      const riderIds = [team.official_rider_1?.id, team.official_rider_2?.id, team.reserve_rider?.id].filter(
        (id): id is number => !!id
      );

      riderIds.forEach((riderId) => {
        const key = this.getTeamRiderKey(team, riderId);
        const qualifyingRiderId = this.extractId(lineup.qualifying_rider_id);
        const raceRiderId = this.extractId(lineup.race_rider_id);

        if (String(qualifyingRiderId ?? '') === String(riderId)) {
          this.incrementCount(this.ridersQualifyingCount, key);
          this.incrementCount(this.ridersLineupsCount, key);
        }

        if (String(raceRiderId ?? '') === String(riderId)) {
          this.incrementCount(this.ridersRaceCount, key);
          this.incrementCount(this.ridersLineupsCount, key);
        }
      });
    });
  }

  getTeamRiderLineupsCount(team: FantasyTeam, riderId: number): number {
    return this.ridersLineupsCount.get(this.getTeamRiderKey(team, riderId)) ?? 0;
  }

  getTeamRiderQualifyingCount(team: FantasyTeam, riderId: number): number {
    return this.ridersQualifyingCount.get(this.getTeamRiderKey(team, riderId)) ?? 0;
  }

  getTeamRiderRaceCount(team: FantasyTeam, riderId: number): number {
    return this.ridersRaceCount.get(this.getTeamRiderKey(team, riderId)) ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
