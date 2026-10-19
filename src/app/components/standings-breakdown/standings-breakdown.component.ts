import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { ChampionshipService } from '../../services/championship.service';
import { DashboardService, StandingsBreakdownRow } from '../../services/dashboard.service';
import { NavigationService } from '../../services/navigation.service';

type MetricId = 'total' | 'qualifying' | 'race' | 'sprintBet' | 'raceBet';

interface TrendRound {
  id: number;
  order: number;
  short: string;
  label: string;
}

interface TrendSeries {
  id: string;
  name: string;
  shortName: string;
  color: string;
  isMe: boolean;
  values: number[];
  points: number[];
}

interface PlotScale {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

@Component({
  selector: 'app-standings-breakdown',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './standings-breakdown.component.html',
  styleUrl: './standings-breakdown.component.scss'
})
export class StandingsBreakdownComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = true;
  rows: StandingsBreakdownRow[] = [];
  raceOptions: Array<{ id: number; label: string }> = [];
  participantOptions: Array<{ id: string; label: string }> = [];
  selectedRaceId = '';
  selectedParticipantId = '';
  loggedUserId = '';

  /* ── Season trend chart ── */
  readonly metrics: Array<{ id: MetricId; label: string }> = [
    { id: 'total', label: 'Totale' },
    { id: 'qualifying', label: 'Qualifica' },
    { id: 'race', label: 'Gara' },
    { id: 'sprintBet', label: 'Sprint bet' },
    { id: 'raceBet', label: 'Race bet' }
  ];
  metric: MetricId = 'total';
  cumulative = true;
  rounds: TrendRound[] = [];
  chartW = 0;
  chartH = 300;
  hoverIdx: number | null = null;

  readonly PAD = { l: 46, r: 16, t: 16, b: 28 };

  private hiddenSeries = new Set<string>();
  private seriesCache: TrendSeries[] | null = null;
  private plotCache: PlotScale | null = null;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  @ViewChild('chartBox') private chartBox?: ElementRef<HTMLDivElement>;

  constructor(
    private router: Router,
    private authService: AuthService,
    private championshipService: ChampionshipService,
    private dashboardService: DashboardService,
    private navService: NavigationService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loggedUserId = this.authService.getUserId() || '';

    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (!champId) {
        this.loading = false;
        return;
      }

      this.loading = true;
      this.hoverIdx = null;
      this.dashboardService.getStandingsBreakdown(champId).subscribe({
        next: (rows) => {
          this.rows = rows ?? [];
          this.rounds = this.buildRounds(this.rows);
          this.computeRankHistory();
          this.raceOptions = this.rounds.map(r => ({ id: r.id, label: r.label }));
          this.participantOptions = this.buildParticipantOptions(this.rows);
          this.selectedRaceId = this.rounds.length ? String(this.rounds[this.rounds.length - 1].id) : '';
          this.invalidate();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching standings breakdown:', error);
          this.rows = [];
          this.rounds = [];
          this.raceOptions = [];
          this.participantOptions = [];
          this.selectedRaceId = '';
          this.selectedParticipantId = '';
          this.invalidate();
          this.loading = false;
        }
      });
    });
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined' || !this.chartBox) {
      return;
    }

    this.resizeObserver = new ResizeObserver(entries => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      const height = width >= 700 ? 340 : width >= 480 ? 300 : 250;
      if (this.destroyed || (width === this.chartW && height === this.chartH)) {
        return;
      }
      // RO callbacks may fire outside the Angular zone — re-enter it
      this.ngZone.run(() => {
        this.chartW = width;
        this.chartH = height;
        this.hoverIdx = null;
      });
    });
    this.resizeObserver.observe(this.chartBox.nativeElement);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
  }

  /* ── Filters & shared row helpers ── */

  get filteredRows(): StandingsBreakdownRow[] {
    return this.rows
      .filter(row => {
        const matchesRace = !this.selectedRaceId || String(row.calendar_id?.id) === this.selectedRaceId;
        const matchesUser = !this.selectedParticipantId || String(row.user_id?.id) === this.selectedParticipantId;
        return matchesRace && matchesUser;
      })
      .sort((a, b) => {
        // rounds in order; inside a round, best score first (mini-standings)
        const roundDelta = Number(a.calendar_id?.race_order || 0) - Number(b.calendar_id?.race_order || 0);
        if (roundDelta !== 0) return roundDelta;
        return Number(b.score || 0) - Number(a.score || 0);
      });
  }

  onParticipantChange(): void {
    this.hoverIdx = null;
    this.invalidate();
  }

  goBack(): void {
    this.navService.back('/');
  }

  fullName(row: StandingsBreakdownRow): string {
    const first = row.user_id?.first_name || '';
    const last = row.user_id?.last_name || '';
    return `${first} ${last}`.trim() || row.user_id?.id || 'Partecipante';
  }

  sprintBetValue(row: StandingsBreakdownRow): number {
    return Number(row.sprint_bet_delta || 0);
  }

  raceBetValue(row: StandingsBreakdownRow): number {
    return Number(row.race_bet_delta || 0);
  }

  /* ── Rank Trend & Transparent Score Breakdown ── */

  private rankHistory = new Map<string, number[]>();

  private computeRankHistory(): void {
    this.rankHistory.clear();
    if (!this.rounds.length || !this.rows.length) return;

    const users = Array.from(new Set(this.rows.map(r => String(r.user_id?.id || '')).filter(Boolean)));
    const userCumulativeScores = new Map<string, number>();
    users.forEach(u => userCumulativeScores.set(u, 0));

    for (let rIdx = 0; rIdx < this.rounds.length; rIdx++) {
      const roundId = this.rounds[rIdx].id;
      for (const u of users) {
        const row = this.rows.find(r => r.calendar_id?.id === roundId && String(r.user_id?.id) === u);
        if (row) {
          userCumulativeScores.set(u, (userCumulativeScores.get(u) || 0) + Number(row.score || 0));
        }
      }

      const sorted = [...users].sort((a, b) => (userCumulativeScores.get(b) || 0) - (userCumulativeScores.get(a) || 0));
      sorted.forEach((u, rankIdx) => {
        const rank = rankIdx + 1;
        let history = this.rankHistory.get(u);
        if (!history) {
          history = [];
          this.rankHistory.set(u, history);
        }
        history[rIdx] = rank;
      });
    }
  }

  getRankTrend(row: StandingsBreakdownRow): { currentRank: number; delta: number; icon: string; text: string; class: string } {
    const userId = String(row.user_id?.id || '');
    const rIdx = this.rounds.findIndex(r => r.id === row.calendar_id?.id);
    const history = this.rankHistory.get(userId);

    if (!history || rIdx < 0 || history[rIdx] === undefined) {
      return { currentRank: 0, delta: 0, icon: 'remove', text: '-', class: 'trend-neutral' };
    }

    const currentRank = history[rIdx];
    if (rIdx === 0) {
      return { currentRank, delta: 0, icon: 'remove', text: `${currentRank}°`, class: 'trend-neutral' };
    }

    const prevRank = history[rIdx - 1];
    const delta = prevRank - currentRank; // > 0 means moved UP (e.g. from 5th to 3rd = +2)

    if (delta > 0) {
      return { currentRank, delta, icon: 'arrow_upward', text: `${currentRank}° (+${delta})`, class: 'trend-up' };
    } else if (delta < 0) {
      return { currentRank, delta, icon: 'arrow_downward', text: `${currentRank}° (${delta})`, class: 'trend-down' };
    }
    return { currentRank, delta: 0, icon: 'remove', text: `${currentRank}° (=)`, class: 'trend-neutral' };
  }

  get currentSelectedRaceBreakdown(): {
    hasData: boolean;
    raceName: string;
    targetName: string;
    qualifyingTotal: number;
    raceTotal: number;
    sprintBetTotal: number;
    raceBetTotal: number;
    grandTotal: number;
  } {
    const rows = this.filteredRows;
    if (!rows.length) {
      return { hasData: false, raceName: '', targetName: '', qualifyingTotal: 0, raceTotal: 0, sprintBetTotal: 0, raceBetTotal: 0, grandTotal: 0 };
    }

    const raceName = rows[0].calendar_id?.race_id?.name || 'Weekend';
    const targetRow = this.selectedParticipantId
      ? rows[0]
      : (rows.find(r => r.user_id?.id === this.loggedUserId) || rows[0]);

    return {
      hasData: true,
      raceName,
      targetName: this.fullName(targetRow),
      qualifyingTotal: Number(targetRow.qualifying_score || 0),
      raceTotal: Number(targetRow.race_score || 0),
      sprintBetTotal: Number(this.sprintBetValue(targetRow)),
      raceBetTotal: Number(this.raceBetValue(targetRow)),
      grandTotal: Number(targetRow.score || 0)
    };
  }

  /* ── Chart: state ── */

  setMetric(metric: MetricId): void {
    if (this.metric === metric) return;
    this.metric = metric;
    this.hoverIdx = null;
    this.invalidate();
  }

  setCumulative(cumulative: boolean): void {
    if (this.cumulative === cumulative) return;
    this.cumulative = cumulative;
    this.hoverIdx = null;
    this.invalidate();
  }

  toggleSeries(series: TrendSeries): void {
    if (this.selectedParticipantId) return;
    if (this.hiddenSeries.has(series.id)) {
      this.hiddenSeries.delete(series.id);
    } else {
      this.hiddenSeries.add(series.id);
    }
    this.invalidate();
  }

  isActive(series: TrendSeries): boolean {
    if (this.selectedParticipantId) return series.id === this.selectedParticipantId;
    return !this.hiddenSeries.has(series.id);
  }

  get series(): TrendSeries[] {
    if (!this.seriesCache) {
      this.seriesCache = this.computeSeries();
    }
    return this.seriesCache;
  }

  get activeSeries(): TrendSeries[] {
    return this.series.filter(s => this.isActive(s));
  }

  /* ── Chart: scale & geometry ── */

  get plot(): PlotScale {
    if (!this.plotCache) {
      this.plotCache = this.computeScale(this.activeSeries);
    }
    return this.plotCache;
  }

  get plotW(): number {
    return Math.max(10, this.chartW - this.PAD.l - this.PAD.r);
  }

  get plotH(): number {
    return Math.max(10, this.chartH - this.PAD.t - this.PAD.b);
  }

  xAt(index: number): number {
    const count = this.rounds.length;
    if (count <= 1) return this.PAD.l + this.plotW / 2;
    return this.PAD.l + (index * this.plotW) / (count - 1);
  }

  yFor(value: number): number {
    const scale = this.plot;
    const span = scale.max - scale.min || 1;
    return this.PAD.t + (1 - (value - scale.min) / span) * this.plotH;
  }

  fmtAxis(value: number): string {
    return Math.abs(value % 1) < 0.001 ? String(Math.round(value)) : value.toFixed(1);
  }

  linePoints(series: TrendSeries): string {
    return series.points.map((value, i) => `${this.xAt(i)},${this.yFor(value)}`).join(' ');
  }

  showXLabel(index: number): boolean {
    const gap = this.plotW / Math.max(1, this.rounds.length - 1);
    return gap >= 26 || index % 2 === 0;
  }

  get focusIdx(): number {
    if (!this.selectedRaceId) return -1;
    return this.rounds.findIndex(r => String(r.id) === this.selectedRaceId);
  }

  get focusW(): number {
    const count = this.rounds.length;
    if (count <= 1) return 44;
    return Math.min(64, (this.plotW / (count - 1)) * 0.72);
  }

  get focusX(): number {
    const idx = this.focusIdx;
    if (idx < 0) return 0;
    const x = this.xAt(idx) - this.focusW / 2;
    return Math.max(this.PAD.l, Math.min(this.PAD.l + this.plotW - this.focusW, x));
  }

  hoverX(index: number): number {
    return Math.max(this.PAD.l, this.xAt(index) - this.hoverStep / 2);
  }

  hoverW(index: number): number {
    const right = Math.min(this.PAD.l + this.plotW, this.xAt(index) + this.hoverStep / 2);
    return Math.max(1, right - this.hoverX(index));
  }

  private get hoverStep(): number {
    const count = this.rounds.length;
    return count <= 1 ? this.plotW : this.plotW / (count - 1);
  }

  /* ── Chart: tooltip ── */

  get tipLeft(): number {
    return this.hoverIdx === null ? 0 : this.xAt(this.hoverIdx);
  }

  tipTransform(): string {
    if (this.hoverIdx === null) return 'translateX(-50%)';
    const x = this.xAt(this.hoverIdx);
    if (x < 100) return 'translateX(0)';
    if (x > this.chartW - 100) return 'translateX(-100%)';
    return 'translateX(-50%)';
  }

  tipRoundLabel(): string {
    if (this.hoverIdx === null) return '';
    return this.rounds[this.hoverIdx]?.label ?? '';
  }

  tipRows(): Array<{ shortName: string; color: string; v: number }> {
    if (this.hoverIdx === null) return [];
    const idx = this.hoverIdx;
    return this.activeSeries
      .map(s => ({ shortName: s.shortName, color: s.color, v: s.points[idx] ?? 0 }))
      .sort((a, b) => b.v - a.v);
  }

  /* ── Chart: data ── */

  private computeSeries(): TrendSeries[] {
    if (!this.rows.length || !this.rounds.length) return [];

    const byUser = new Map<string, { name: string; values: Map<number, number> }>();
    for (const row of this.rows) {
      const id = String(row.user_id?.id ?? '');
      if (!id) continue;
      const order = Number(row.calendar_id?.race_order || 0);
      let entry = byUser.get(id);
      if (!entry) {
        entry = { name: this.fullName(row), values: new Map() };
        byUser.set(id, entry);
      }
      entry.values.set(order, (entry.values.get(order) ?? 0) + this.metricValue(row));
    }

    const palette = ['#3d7dff', '#f59e0b', '#16b981', '#a855f7', '#06b6d4', '#e879f9'];
    let paletteIdx = 0;
    const series: TrendSeries[] = [];

    byUser.forEach((entry, id) => {
      const isMe = id === this.loggedUserId;
      const values = this.rounds.map(r => entry.values.get(r.order) ?? 0);
      let acc = 0;
      const points = this.cumulative ? values.map(v => (acc += v)) : values.slice();
      series.push({
        id,
        name: entry.name,
        shortName: this.surname(entry.name),
        color: isMe ? 'var(--primary-color)' : palette[paletteIdx++ % palette.length],
        isMe,
        values,
        points
      });
    });

    // leaders first, so legend/tooltip read top-down
    return series.sort((a, b) => this.totalOf(b) - this.totalOf(a));
  }

  private totalOf(series: TrendSeries): number {
    return series.values.reduce((sum, v) => sum + v, 0);
  }

  private metricValue(row: StandingsBreakdownRow): number {
    let raw: number;
    switch (this.metric) {
      case 'qualifying':
        raw = Number(row.qualifying_score);
        break;
      case 'race':
        raw = Number(row.race_score);
        break;
      case 'sprintBet':
        raw = Number(row.sprint_bet_delta);
        break;
      case 'raceBet':
        raw = Number(row.race_bet_delta);
        break;
      default:
        raw = Number(row.score);
    }
    return Number.isFinite(raw) ? raw : 0;
  }

  private computeScale(series: TrendSeries[]): PlotScale {
    let lo = 0;
    let hi = 0;
    for (const s of series) {
      for (const v of s.points) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    if (lo === hi) hi = lo + 1;

    const rawStep = (hi - lo) / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / magnitude;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * magnitude;

    const min = Math.floor(lo / step) * step;
    const max = Math.ceil(hi / step) * step;
    const ticks: number[] = [];
    for (let v = min; v <= max + step * 0.001; v += step) {
      ticks.push(Math.round(v * 1000) / 1000);
      if (ticks.length > 24) break; // safety guard
    }
    return { min, max, step, ticks };
  }

  private invalidate(): void {
    this.seriesCache = null;
    this.plotCache = null;
  }

  /* ── Option builders ── */

  private buildRounds(rows: StandingsBreakdownRow[]): TrendRound[] {
    const seen = new Map<number, TrendRound>();

    for (const row of rows) {
      const id = row.calendar_id?.id;
      if (!id || seen.has(id)) continue;
      const order = Number(row.calendar_id?.race_order || 0);
      const name = row.calendar_id?.race_id?.name || 'Gara';
      seen.set(id, {
        id,
        order,
        short: `R${order || '?'}`,
        label: `R${order || '?'} · ${name}`
      });
    }

    return [...seen.values()].sort((a, b) => a.order - b.order || a.id - b.id);
  }

  private buildParticipantOptions(rows: StandingsBreakdownRow[]): Array<{ id: string; label: string }> {
    const seen = new Set<string>();
    const options: Array<{ id: string; label: string }> = [];

    rows.forEach(row => {
      const userId = String(row.user_id?.id || '');
      if (!userId || seen.has(userId)) return;
      seen.add(userId);
      options.push({
        id: userId,
        label: this.fullName(row)
      });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  private surname(fullName: string): string {
    const parts = fullName.split(' ').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : fullName;
  }
}
