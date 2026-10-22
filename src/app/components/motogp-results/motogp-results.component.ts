import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DashboardService, StandingsCalculationResponse, CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { AuthService } from '../../services/auth.service';
import { NotificationServiceService } from '../../services/notification.service';
import { I18nService } from '../../services/i18n.service';
import { NavigationService } from '../../services/navigation.service';
import { MotoGPAssetService } from '../../services/motogp-asset.service';
import { PullToRefreshComponent } from '../pull-to-refresh/pull-to-refresh.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

type SessionKey = 'Q1' | 'Q2' | 'SPR' | 'RAC';

interface MotoGPResult {
  id: string;
  position: number;
  rider: {
    id: string;
    full_name: string;
    country: {
      iso: string;
      name: string;
    };
    number: number;
  };
  constructor?: {
    id: string;
    name: string;
  };
  team_name: string;
  best_lap?: {
    number: number;
    time: string;
  };
  total_laps?: number;
  top_speed?: number;
  gap?: {
    first: string;
    prev: string;
  };
  average_speed?: number;
  time?: string;
  points?: number;
  status: string;
}

interface MotoGPResultsData {
  meta: {
    championshipId: number;
    calendarId: number;
    year: number;
    eventCode: string;
  };
  sessions: Partial<Record<SessionKey, MotoGPResult[]>>;
  merged: any[];
}

interface SessionDef {
  key: SessionKey;
  labelKey: string;
  icon: string;
  count: number;
}

interface ColDef {
  type: 'bestlap' | 'gap' | 'speed' | 'avg' | 'time' | 'points' | 'status';
  label: string;
}

interface StatTile {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}

@Component({
  selector: 'app-motogp-results',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslatePipe,
    PullToRefreshComponent
  ],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query('.results-hero, .admin-actions-card, .session-switch, .podium, .stats-strip, .results-panel', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(80, [
            animate('300ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'motogp.results.title' | t }}</h1>
      </header>

      <main class="main-content">
        <app-pull-to-refresh [isRefreshing]="loading" (refresh)="loadResults()"></app-pull-to-refresh>
        <!-- ═══════════ MotoGP Results Skeleton ═══════════ -->
        <div *ngIf="loading" class="results-container w-full space-y-4" aria-hidden="true">
          <div class="sk-racing-card p-6 rounded-3xl" style="height: 160px;">
            <span class="sk sk-badge mb-3"></span>
            <span class="sk sk-title mb-4" style="width: 50%; height: 26px;"></span>
            <div class="flex gap-2">
              <span class="sk sk-pill"></span>
              <span class="sk sk-pill"></span>
            </div>
          </div>

          <div class="sk-racing-card p-5">
            <span class="sk sk-title mb-4" style="width: 35%;"></span>
            <div class="grid grid-cols-3 gap-3 mb-6" style="height: 140px;">
              <span class="sk sk-box" style="height: 100%;"></span>
              <span class="sk sk-box" style="height: 100%;"></span>
              <span class="sk sk-box" style="height: 100%;"></span>
            </div>
            <div class="space-y-3">
              <span class="sk sk-row" style="height: 48px;"></span>
              <span class="sk sk-row" style="height: 48px;"></span>
              <span class="sk sk-row" style="height: 48px;"></span>
              <span class="sk sk-row" style="height: 48px;"></span>
            </div>
          </div>
        </div>

        <!-- Retryable error state -->
        <div *ngIf="!loading && loadError" class="ux-state">
          <div class="ux-state-card">
            <i class="fa-solid fa-triangle-exclamation ux-state-icon"></i>
            <p>Impossibile caricare i risultati MotoGP.</p>
            <button mat-raised-button color="accent" class="retry-btn" (click)="loadResults()">
              <i class="fa-solid fa-arrows-rotate"></i>
              Riprova
            </button>
          </div>
        </div>

        <div *ngIf="!loading && !loadError && results" class="results-container" @cardAnimation>
          <!-- ═══════════ ROUND PICKER STRIP ═══════════ -->
          <div class="round-picker-strip" *ngIf="calendarList.length > 1">
            <span class="round-picker-label"><i class="fa-solid fa-flag-checkered text-red-500"></i> GP:</span>
            <div class="round-picker-scroll">
              <button
                *ngFor="let r of calendarList"
                type="button"
                class="round-picker-pill"
                [class.round-picker-pill--active]="r.id === calendarId"
                (click)="onSelectRace(r)">
                <span class="pill-order">R{{ r.race_order }}</span>
                <span class="pill-name">{{ r.race_id.name }}</span>
              </button>
            </div>
          </div>

          <!-- ═══════════ HERO ═══════════ -->
          <section class="results-hero relative overflow-hidden">
            <!-- Ambient Circuit Track Layout Watermark -->
            <div
              *ngIf="raceInfo && assetService.getCircuitLayoutUrl(raceInfo.race_id?.country, raceInfo.race_id?.name) as trackUrl"
              class="hero-circuit-wrap">
              <img
                [src]="trackUrl"
                [alt]="heroTitle"
                class="hero-circuit-img"
                (error)="assetService.handleImageError($event, '/assets/images/circuit-placeholder.svg')">
            </div>
            <div class="hero-main">
              <span class="hero-kicker">
                MotoGP {{ results.meta.year }}<ng-container *ngIf="raceInfo"> · Round {{ raceInfo.race_order }}</ng-container>
              </span>
              <h2 class="hero-title">{{ heroTitle }}</h2>
              <div class="hero-sub">
                <span *ngIf="heroDate">
                  <i class="fa-solid fa-calendar-day"></i>{{ heroDate }}
                </span>
                <span *ngIf="heroLocation">
                  <i class="fa-solid fa-location-dot"></i>{{ heroLocation }}
                </span>
                <span>
                  <i class="fa-solid fa-flag"></i>{{ results.meta.eventCode }}
                </span>
              </div>
            </div>
            <div class="hero-side" *ngIf="sessionList.length">
              <span class="session-tag" *ngFor="let s of sessionList" [ngClass]="'tag-' + s.key">
                <i [class]="s.icon"></i>
                {{ s.labelKey | t }}
              </span>
            </div>
          </section>

          <!-- Admin actions available exclusively in /admin -->

          <!-- ═══════════ SESSION SWITCHER (segmented pills) ═══════════ -->
          <nav class="session-switch" role="tablist" aria-label="Sessioni">
            <button
              type="button"
              role="tab"
              class="session-tab"
              *ngFor="let s of sessionList"
              [class.active]="s.key === activeSession"
              [attr.aria-selected]="s.key === activeSession"
              (click)="selectSession(s.key)">
              <i [class]="s.icon"></i>
              <span>{{ s.labelKey | t }}</span>
              <span class="session-count">{{ s.count }}</span>
            </button>
          </nav>

          <!-- ═══════════ PODIUM ═══════════ -->
          <section class="podium" *ngIf="podiumRows.length === 3" aria-label="Podio">
            <article
              class="podium-card cursor-pointer select-none"
              *ngFor="let p of podiumRows"
              [ngClass]="'rank-' + p.position"
              (click)="toggleRiderExpand(p.rider.number)"
              [attr.aria-label]="'Posizione ' + p.position">
              
              <div class="podium-content-wrap">
                <!-- Left cluster: Rank icon + Photo + Rider & Team -->
                <div class="podium-left-cluster">
                  <span class="podium-rank">
                    <i *ngIf="p.position === 1" class="fa-solid fa-trophy"></i>
                    <i *ngIf="p.position === 2 || p.position === 3" class="fa-solid fa-medal"></i>
                  </span>

                  <div class="podium-rider-photo">
                    <img [src]="assetService.getRiderPhotoUrl(p.rider.number, p.rider.full_name)" [alt]="p.rider.full_name" class="podium-rider-img" (error)="assetService.handleImageError($event)">
                  </div>

                  <div class="podium-details">
                    <div class="podium-title-row">
                      <span class="podium-num">#{{ p.rider.number }}</span>
                      <span class="flag" *ngIf="p.rider.country?.iso">{{ countryFlag(p.rider.country.iso) }}</span>
                      <strong class="podium-rider-name">{{ p.rider.full_name }}</strong>
                    </div>
                    <div class="podium-team-row">
                      <span class="team-label">{{ p.team_name }}</span>
                      <span
                        class="maker-chip"
                        *ngIf="maker(p)"
                        [style.--maker]="makerColor(maker(p))">
                        <i class="fa-solid fa-circle"></i>{{ maker(p) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Right cluster: Time / Gap Stat -->
                <div class="podium-right-stat">
                  <strong class="stat-value-text">
                    {{ podiumValue(p) }}
                    <em class="fl-pill" *ngIf="isFastestLap(p, activeSession!)">FL</em>
                  </strong>
                  <span class="stat-caption-text">{{ podiumCaption(p) }}</span>
                </div>
              </div>

              <!-- Expanded Quick Details on Click -->
              <div *ngIf="expandedRiderNumber === p.rider.number"
                   class="mt-2.5 pt-2.5 border-t border-zinc-700/40 flex items-center justify-between text-xs text-zinc-300">
                <span class="text-zinc-400">Posizione Ufficiale: <strong class="text-white">P{{ p.position }}</strong></span>
                <span *ngIf="p.points !== undefined" class="font-bold text-red-400">+{{ p.points }} punti</span>
              </div>
            </article>
          </section>

          <!-- ═══════════ SESSION STATS ═══════════ -->
          <section class="stats-strip" *ngIf="statTiles.length" aria-label="Statistiche sessione">
            <article class="stat-tile" *ngFor="let t of statTiles">
              <i [class]="t.icon"></i>
              <div class="stat-copy">
                <span class="stat-label">{{ t.label }}</span>
                <strong class="stat-value" [title]="t.value">{{ t.value }}</strong>
                <span class="stat-sub" *ngIf="t.sub" [title]="t.sub">{{ t.sub }}</span>
              </div>
            </article>
          </section>

          <!-- ═══════════ RESULTS LIST ═══════════ -->
          <section class="results-panel" *ngIf="activeRows.length">
            <header class="panel-head">
              <h3><i [class]="activeIcon"></i> {{ activeLabel }}</h3>
              <span class="panel-meta">{{ panelMeta }}</span>
            </header>

            <!-- Column headers (desktop) -->
            <div class="res-row res-head" role="row">
              <span class="cell cell-pos">{{ 'motogp.results.position' | t }}</span>
              <span class="cell cell-rider">{{ 'motogp.results.rider' | t }}</span>
              <span class="cell" *ngFor="let c of activeColumns">{{ c.label }}</span>
            </div>

            <!-- Rows -->
            <div
              class="res-row"
              *ngFor="let r of activeRows"
              [ngClass]="{ 'is-winner': r.position === 1, 'is-out': r.status !== 'INSTND' }">
              <span class="cell cell-pos">
                <span class="pos-badge" [ngClass]="positionClass(r.position)">
                  <ng-container [ngSwitch]="r.position">
                    <i *ngSwitchCase="1" class="fa-solid fa-trophy"></i>
                    <i *ngSwitchCase="2" class="fa-solid fa-medal"></i>
                    <i *ngSwitchCase="3" class="fa-solid fa-medal"></i>
                    <span *ngSwitchDefault>{{ r.position || '–' }}</span>
                  </ng-container>
                </span>
              </span>

              <span class="cell cell-rider">
                <div class="rider-avatar-thumb">
                  <img [src]="assetService.getRiderPhotoUrl(r.rider.number, r.rider.full_name)" [alt]="r.rider.full_name" class="rider-avatar-img" (error)="assetService.handleImageError($event)">
                </div>
                <span class="rider-num">#{{ r.rider.number }}</span>
                <span class="rider-main">
                  <span class="rider-name">
                    <span class="flag" *ngIf="r.rider.country?.iso">{{ countryFlag(r.rider.country.iso) }}</span>
                    {{ r.rider.full_name }}
                  </span>
                  <span class="rider-team">
                    {{ r.team_name }}
                    <span
                      class="maker-chip"
                      *ngIf="maker(r)"
                      [style.--maker]="makerColor(maker(r))">
                      <i class="fa-solid fa-circle"></i>{{ maker(r) }}
                    </span>
                  </span>
                </span>
              </span>

              <span
                class="cell"
                [ngClass]="'cell-col-' + c.type"
                *ngFor="let c of activeColumns"
                [attr.data-label]="c.label"
                [ngSwitch]="c.type">
                <ng-container *ngSwitchCase="'bestlap'">
                  <span class="lap-time" [class.fastest]="isFastestLap(r, activeSession!)">
                    <ng-container *ngIf="r.best_lap; else noLap">{{ r.best_lap.time }}</ng-container>
                    <ng-template #noLap>–</ng-template>
                    <em class="fl-pill" *ngIf="r.best_lap && isFastestLap(r, activeSession!)">FL</em>
                  </span>
                  <span class="cell-sub" *ngIf="r.best_lap">{{ 'motogp.results.lap' | t }} {{ r.best_lap.number }}</span>
                </ng-container>

                <ng-container *ngSwitchCase="'gap'">
                  <span class="gap-val">{{ gapLabel(r) }}</span>
                </ng-container>

                <ng-container *ngSwitchCase="'speed'">
                  <span class="num-val">{{ r.top_speed ? r.top_speed + ' km/h' : '–' }}</span>
                </ng-container>

                <ng-container *ngSwitchCase="'avg'">
                  <span class="num-val">{{ r.average_speed ? r.average_speed + ' km/h' : '–' }}</span>
                </ng-container>

                <ng-container *ngSwitchCase="'time'">
                  <span class="num-val">{{ r.time || '–' }}</span>
                </ng-container>

                <ng-container *ngSwitchCase="'points'">
                  <span class="points-val">{{ r.points ?? '–' }}</span>
                </ng-container>

                <ng-container *ngSwitchCase="'status'">
                  <span class="status-chip" [ngClass]="getStatusClass(r.status)">{{ getStatusText(r.status) }}</span>
                </ng-container>
              </span>
            </div>
          </section>
        </div>

        <div *ngIf="!loading && !loadError && !results" class="ux-state no-results">
          <div class="ux-state-card no-results-card">
            <i class="fa-solid fa-trophy no-results-icon ux-state-icon"></i>
            <p>{{ 'motogp.results.noResults' | t }}</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styleUrl: './motogp-results.component.scss'
})
export class MotoGPResultsComponent implements OnInit {
  expandedRiderNumber: number | null = null;
  toggleRiderExpand(num: number): void {
    this.expandedRiderNumber = (this.expandedRiderNumber === num ? null : num);
  }
  results: MotoGPResultsData | null = null;
  loading = true;
  loadError = false;
  championshipId = 0;
  calendarId = 0;
  raceInfo: CalendarRace | null = null;
  calendarList: CalendarRace[] = [];

  activeSession: SessionKey | null = null;

  // View-model (rebuilt on data load / session switch / language change)
  sessionList: SessionDef[] = [];
  activeRows: MotoGPResult[] = [];
  activeColumns: ColDef[] = [];
  podiumRows: MotoGPResult[] = [];
  statTiles: StatTile[] = [];
  activeLabel = '';
  activeIcon = '';
  panelMeta = '';

  private fastestLapMs: Record<SessionKey, number | null> = { Q1: null, Q2: null, SPR: null, RAC: null };

  private readonly sessionOrder: { key: SessionKey; labelKey: string; icon: string }[] = [
    { key: 'Q1', labelKey: 'motogp.results.qualifying1', icon: 'fa-solid fa-flag' },
    { key: 'Q2', labelKey: 'motogp.results.qualifying2', icon: 'fa-solid fa-flag' },
    { key: 'SPR', labelKey: 'motogp.results.sprint', icon: 'fa-solid fa-bolt' },
    { key: 'RAC', labelKey: 'motogp.results.race', icon: 'fa-solid fa-flag-checkered' },
  ];

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationServiceService,
    private i18n: I18nService,
    private navService: NavigationService,
    public assetService: MotoGPAssetService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const cParam = +params['championshipId'];
      const rParam = +params['calendarId'];

      if (cParam && rParam) {
        this.championshipId = cParam;
        this.calendarId = rParam;
        this.loadCalendarList();
        this.loadResults();
      } else {
        // Fallback for standalone /motogp-results
        this.championshipService.getChampIdObs().subscribe(cId => {
          if (!cId) return;
          this.championshipId = cId;
          this.dashboardService.getCalendar(cId).subscribe({
            next: (list: CalendarRace[]) => {
              this.calendarList = list || [];
              const roundQuery = +this.route.snapshot.queryParamMap.get('round')!;
              const nowStr = new Date().toISOString().split('T')[0];
              const pastRaces = list.filter(r => !r.cancelled && r.event_date <= nowStr);
              const targetRace = roundQuery
                ? list.find(r => r.id === roundQuery || r.race_order === roundQuery)
                : (pastRaces[pastRaces.length - 1] || list[0]);
              this.calendarId = targetRace?.id || list[0]?.id || 0;
              this.raceInfo = targetRace || list[0] || null;
              if (this.calendarId) {
                this.loadResults();
              }
            }
          });
        });
      }
    });

    // Keep hardcoded/i18n labels in the view-model in sync with language switches
    this.i18n.translations$.subscribe(() => this.rebuildView());
  }

  loadCalendarList(): void {
    if (!this.championshipId) return;
    this.dashboardService.getCalendar(this.championshipId).subscribe({
      next: (list: CalendarRace[]) => {
        this.calendarList = list || [];
        this.raceInfo = list.find(r => r.id === this.calendarId) ?? null;
      },
      error: () => { this.raceInfo = null; }
    });
  }

  onSelectRace(race: CalendarRace): void {
    if (this.calendarId === race.id) return;
    this.calendarId = race.id;
    this.raceInfo = race;
    this.loadResults();
  }

  loadResults(): void {
    if (!this.championshipId || !this.calendarId) return;
    this.loading = true;
    this.loadError = false;
    this.dashboardService.fetchMotoGPResults(this.championshipId, this.calendarId, false).subscribe({
      next: (data: MotoGPResultsData) => {
        this.results = data;
        (['Q1', 'Q2', 'SPR', 'RAC'] as SessionKey[]).forEach(k => this.computeFastest(data.sessions[k], k));
        this.pickDefaultSession();
        this.rebuildView();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading MotoGP results:', error);
        this.loadError = true;
        this.loading = false;
      }
    });

    if (!this.calendarList.length) {
      this.loadCalendarList();
    }
  }

  goBack(): void {
    this.navService.back(this.calendarId ? `/race-detail/${this.calendarId}` : '/calendar');
  }

  // ===== Session switching =====
  selectSession(key: SessionKey): void {
    if (this.activeSession === key) return;
    this.activeSession = key;
    this.rebuildView();
  }

  private pickDefaultSession(): void {
    const avail = this.sessionOrder
      .map(s => s.key)
      .filter(k => (this.results?.sessions[k]?.length ?? 0) > 0);
    if (!avail.length) { this.activeSession = null; return; }
    // Keep the user's choice if still available, otherwise jump to the latest session
    if (!this.activeSession || !avail.includes(this.activeSession)) {
      this.activeSession = avail[avail.length - 1];
    }
  }

  /** Rebuild the whole view-model from the active session. */
  private rebuildView(): void {
    if (!this.results) return;
    const sessions = this.results.sessions;

    this.sessionList = this.sessionOrder
      .map(s => ({ ...s, count: sessions[s.key]?.length ?? 0 }))
      .filter(s => s.count > 0);

    const k = this.activeSession;
    if (!k || !(sessions[k]?.length)) {
      this.activeRows = [];
      this.activeColumns = [];
      this.podiumRows = [];
      this.statTiles = [];
      this.activeLabel = '';
      this.activeIcon = '';
      this.panelMeta = '';
      return;
    }

    const def = this.sessionOrder.find(s => s.key === k)!;
    this.activeLabel = this.tr(def.labelKey);
    this.activeIcon = def.icon;

    this.activeRows = [...(sessions[k] || [])].sort(
      (a, b) => (a.position ?? 999) - (b.position ?? 999)
    );

    const isQuali = k === 'Q1' || k === 'Q2';
    this.activeColumns = isQuali
      ? [
          { type: 'bestlap', label: this.tr('motogp.results.bestLap') },
          { type: 'gap', label: this.tr('motogp.results.gap') },
          { type: 'speed', label: this.tr('motogp.results.topSpeed') },
        ]
      : [
          { type: 'time', label: this.tr('motogp.results.time') },
          { type: 'gap', label: this.tr('motogp.results.gap') },
          { type: 'avg', label: 'Vel. media' },
          { type: 'points', label: this.tr('motogp.results.points') },
          { type: 'status', label: this.tr('motogp.results.status') },
        ];

    // Podium only when the session has a real 1-2-3 (Q1 starts at P13 after the +10 rule)
    const top3 = this.activeRows.slice(0, 3);
    this.podiumRows =
      top3.length === 3 && top3.every((r, i) => r.position === i + 1) ? top3 : [];

    this.statTiles = this.buildStatTiles(k, isQuali);
    this.panelMeta = this.buildPanelMeta(isQuali);
  }

  private buildStatTiles(k: SessionKey, isQuali: boolean): StatTile[] {
    const rows = this.activeRows;
    if (!rows.length) return [];
    const tiles: StatTile[] = [];
    const leader = rows[0];
    const leaderName = this.clean(leader.rider?.full_name);

    if (isQuali) {
      tiles.push({
        icon: 'fa-solid fa-crown',
        label: 'Migliore',
        value: leaderName,
        sub: `#${leader.rider?.number} · ${this.clean(leader.team_name)}`,
      });

      const flRow = this.fastestRow(k, rows);
      if (flRow?.best_lap) {
        tiles.push({
          icon: 'fa-solid fa-stopwatch',
          label: this.tr('motogp.results.bestLap'),
          value: flRow.best_lap.time,
          sub: `${this.clean(flRow.rider?.full_name)} · ${this.tr('motogp.results.lap')} ${flRow.best_lap.number}`,
        });
      }

      const fastest = this.maxBy(rows, r => r.top_speed);
      if (fastest?.top_speed) {
        tiles.push({
          icon: 'fa-solid fa-gauge-high',
          label: this.tr('motogp.results.topSpeed'),
          value: `${fastest.top_speed} km/h`,
          sub: this.clean(fastest.rider?.full_name),
        });
      }

      tiles.push({
        icon: 'fa-solid fa-users',
        label: 'Partenti',
        value: String(rows.length),
        sub: this.activeLabel,
      });
      return tiles;
    }

    // Sprint / Race
    tiles.push({
      icon: 'fa-solid fa-trophy',
      label: 'Vincitore',
      value: leaderName,
      sub: `#${leader.rider?.number} · ${this.clean(leader.team_name)}`,
    });

    const laps = this.maxBy(rows, r => r.total_laps)?.total_laps;
    if (leader.time) {
      tiles.push({
        icon: 'fa-solid fa-clock',
        label: this.tr('motogp.results.time'),
        value: leader.time,
        sub: laps ? `${laps} giri` : undefined,
      });
    }

    const fastestAvg = this.maxBy(rows, r => r.average_speed);
    if (fastestAvg?.average_speed) {
      tiles.push({
        icon: 'fa-solid fa-wind',
        label: 'Velocità media',
        value: `${fastestAvg.average_speed} km/h`,
        sub: this.clean(fastestAvg.rider?.full_name),
      });
    }

    const points = rows.reduce((sum, r) => sum + (r.points || 0), 0);
    tiles.push({
      icon: 'fa-solid fa-star',
      label: 'Punti assegnati',
      value: String(points),
      sub: `${rows.length} piloti`,
    });
    return tiles;
  }

  private buildPanelMeta(isQuali: boolean): string {
    const rows = this.activeRows;
    const parts: string[] = [`${rows.length} piloti`];
    const retired = rows.filter(r => r.status !== 'INSTND').length;
    if (retired > 0) parts.push(`${retired} ritirati`);
    if (!isQuali) {
      const laps = this.maxBy(rows, r => r.total_laps)?.total_laps;
      if (laps) parts.push(`${laps} giri`);
    }
    return parts.join(' · ');
  }

  // ===== Status =====
  getStatusClass(status: string): string {
    switch (status) {
      case 'INSTND': return 'status-completed';
      case 'OUTSTND': return 'status-dnf';
      case 'NOTFINISHFIRST': return 'status-dns';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'INSTND': return 'Classificato';
      case 'OUTSTND': return 'Ritirato';
      case 'NOTFINISHFIRST': return 'Non partito';
      default: return status || '–';
    }
  }

  isAdmin(): boolean { return this.authService.isCurrentUserAdmin(); }

  updateStandings(): void {
    this.notificationService.showSuccess('motogp.results.fetchMotoGPResults');
    this.dashboardService.fetchMotoGPResults(this.championshipId, this.calendarId, true).subscribe({
      next: () => {
        this.notificationService.showSuccess('motogp.results.fetchMotoGPResultsSuccess');
        this.notificationService.showSuccess('motogp.results.updateStandings');

        this.dashboardService.updateStandings(this.championshipId, this.calendarId).subscribe({
          next: (response: StandingsCalculationResponse) => {
            this.notificationService.showSuccess('motogp.results.updateStandingsSuccess');
            if (response?.meta?.message) {
              this.notificationService.showSuccessMessage(response.meta.message, response.meta.partial ? 6500 : 5000);
            }
            this.loadResults();
          },
          error: (err: any) => {
            console.error('Error updating standings:', err);
            this.notificationService.showError('motogp.results.updateStandingsFail');
          }
        });
      },
      error: (err: any) => {
        console.error('Error fetching MotoGP results before standings update:', err);
        this.notificationService.showError('motogp.results.fetchMotoGPResultsFail');
      }
    });
  }

  updateMotoGPResults(): void {
    this.notificationService.showSuccess('motogp.results.fetchMotoGPResults');
    this.dashboardService.fetchMotoGPResults(this.championshipId, this.calendarId, true).subscribe({
      next: () => {
        this.notificationService.showSuccess('motogp.results.fetchMotoGPResultsSuccess');
        this.loadResults();
      },
      error: (err: any) => {
        console.error('Error fetching MotoGP results:', err);
        this.notificationService.showError('motogp.results.fetchMotoGPResultsFail');
      }
    });
  }

  // ===== Hero helpers =====
  get heroTitle(): string {
    const name = this.clean(this.raceInfo?.race_id?.name);
    return name || this.results?.meta?.eventCode || 'MotoGP';
  }

  get heroDate(): string {
    const iso = this.raceInfo?.event_date;
    if (!iso) return '';
    const [y, m, d] = String(iso).substring(0, 10).split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
  }

  get heroLocation(): string {
    return this.clean(this.raceInfo?.race_id?.location);
  }

  // ===== Cell helpers =====
  gapLabel(r: MotoGPResult): string {
    if (r.position === 1) return '–';
    if (r.gap?.first) return `+${r.gap.first}`;
    return '–';
  }

  podiumValue(p: MotoGPResult): string {
    const isQuali = this.activeSession === 'Q1' || this.activeSession === 'Q2';
    if (isQuali) return p.best_lap?.time || (p.gap?.first ? `+${p.gap.first}` : '–');
    if (p.position === 1) return p.time || '–';
    return p.gap?.first ? `+${p.gap.first}` : '–';
  }

  podiumCaption(p: MotoGPResult): string {
    const isQuali = this.activeSession === 'Q1' || this.activeSession === 'Q2';
    if (isQuali) return p.best_lap?.time ? 'Miglior giro' : 'Distacco';
    return p.position === 1 ? 'Tempo di gara' : 'Distacco';
  }

  // ===== General helpers =====
  private toMs(lapTime?: string): number | null {
    if (!lapTime) return null;
    const parts = lapTime.split(':');
    let ms = 0;
    if (parts.length === 2) {
      const [m, s] = parts;
      ms += (+m) * 60000;
      ms += Math.round(parseFloat(s) * 1000);
    } else {
      ms += Math.round(parseFloat(parts[0]) * 1000);
    }
    return Number.isFinite(ms) ? ms : null;
  }

  private computeFastest(session: MotoGPResult[] | undefined, key: SessionKey) {
    if (!session?.length) { this.fastestLapMs[key] = null; return; }
    let best: number | null = null;
    for (const r of session) {
      const t = this.toMs(r.best_lap?.time);
      if (t == null) continue;
      if (best == null || t < best) best = t;
    }
    this.fastestLapMs[key] = best;
  }

  isFastestLap(r: MotoGPResult, key: SessionKey): boolean {
    const ref = this.fastestLapMs[key];
    const t = this.toMs(r.best_lap?.time);
    return ref != null && t != null && t === ref;
  }

  private fastestRow(key: SessionKey, rows: MotoGPResult[]): MotoGPResult | null {
    const ref = this.fastestLapMs[key];
    if (ref == null) return null;
    return rows.find(r => this.toMs(r.best_lap?.time) === ref) ?? null;
  }

  private maxBy<T>(rows: T[], pick: (r: T) => number | undefined | null): T | null {
    let best: T | null = null;
    let bestVal = -Infinity;
    for (const r of rows) {
      const v = pick(r);
      if (v != null && Number.isFinite(v) && v > bestVal) { bestVal = v; best = r; }
    }
    return best;
  }

  private tr(key: string): string {
    return this.i18n.translate(key);
  }

  private clean(s?: string | null): string {
    return String(s ?? '').replace(/\s+/g, ' ').trim();
  }

  countryFlag(iso?: string): string {
    if (!iso || iso.length !== 2) return '';
    const cc = iso.toUpperCase();
    const base = 0x1F1E6;
    return String.fromCodePoint(base + (cc.charCodeAt(0) - 65), base + (cc.charCodeAt(1) - 65));
  }

  positionClass(pos?: number): 'gold'|'silver'|'bronze'|'' {
    if (pos === 1) return 'gold';
    if (pos === 2) return 'silver';
    if (pos === 3) return 'bronze';
    return '';
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

  /** Constructor/manufacturer name — guards against the Object.prototype clash on `.constructor`. */
  maker(r: MotoGPResult): string {
    const c = (r as any)?.constructor;
    if (c && typeof c === 'object' && typeof c.name === 'string') return c.name.trim();
    return '';
  }
}
