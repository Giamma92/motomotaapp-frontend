import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { ChampionshipService } from '../../services/championship.service';
import { DashboardService, StandingsBreakdownRow } from '../../services/dashboard.service';

@Component({
  selector: 'app-standings-breakdown',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-shell">
      <header class="header">
        <button mat-icon-button (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-copy">
          <span class="header-kicker">Standings</span>
          <h1>Dettaglio punteggi</h1>
        </div>
      </header>

      <main class="content">
        <mat-card class="filters-card">
          <div class="filters-grid">
            <label class="filter-field">
              <span>Gara</span>
              <select [(ngModel)]="selectedRaceId">
                <option value="">Tutte</option>
                <option *ngFor="let race of raceOptions" [value]="race.id">{{ race.label }}</option>
              </select>
            </label>

            <label class="filter-field">
              <span>Partecipante</span>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                placeholder="Cerca partecipante" />
            </label>
          </div>
        </mat-card>

        <mat-card class="breakdown-card">
          <div class="card-head">
            <div>
              <span class="card-kicker">Race by race</span>
              <h2>Breakdown gara</h2>
            </div>
            <span class="results-pill">{{ filteredRows.length }} righe</span>
          </div>

          <div *ngIf="loading" class="state-box">Caricamento dati...</div>
          <div *ngIf="!loading && !filteredRows.length" class="state-box">Nessun dettaglio disponibile.</div>

          <div *ngIf="!loading && filteredRows.length" class="table-wrap desktop-only">
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Gara</th>
                  <th>Partecipante</th>
                  <th>Qualifica</th>
                  <th>Gara</th>
                  <th>Sprint bet</th>
                  <th>Race bet</th>
                  <th>Totale</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of filteredRows" [class.current-user]="row.user_id.id === loggedUserId">
                  <td>
                    <div class="race-cell">
                      <strong>{{ raceLabel(row) }}</strong>
                      <span>{{ row.calendar_id.race_id.location }}</span>
                    </div>
                  </td>
                  <td>{{ fullName(row) }}</td>
                  <td>{{ row.qualifying_score | number:'1.0-0' }}</td>
                  <td>{{ row.race_score | number:'1.0-0' }}</td>
                  <td>{{ sprintBetValue(row) | number:'1.0-0' }}</td>
                  <td>{{ raceBetValue(row) | number:'1.0-0' }}</td>
                  <td class="total-col">{{ row.score | number:'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="!loading && filteredRows.length" class="mobile-list mobile-only">
            <article class="mobile-row" *ngFor="let row of filteredRows" [class.current-user]="row.user_id.id === loggedUserId">
              <header class="mobile-row-head">
                <div>
                  <strong>{{ raceLabel(row) }}</strong>
                  <span>{{ fullName(row) }}</span>
                </div>
                <span class="total-pill">{{ row.score | number:'1.0-0' }} pts</span>
              </header>
              <div class="mobile-grid">
                <span>Qualifica <strong>{{ row.qualifying_score | number:'1.0-0' }}</strong></span>
                <span>Gara <strong>{{ row.race_score | number:'1.0-0' }}</strong></span>
                <span>Sprint bet <strong>{{ sprintBetValue(row) | number:'1.0-0' }}</strong></span>
                <span>Race bet <strong>{{ raceBetValue(row) | number:'1.0-0' }}</strong></span>
              </div>
            </article>
          </div>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(200, 16, 46, 0.12), transparent 26%),
        linear-gradient(160deg, #f8f8f9 0%, #f1f2f4 100%);
      color: #16181d;
    }
    .page-shell {
      min-height: 100vh;
    }
    .header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: .8rem;
      padding: .9rem 1rem;
      background: rgba(17, 18, 20, 0.96);
      color: #fff;
      box-shadow: 0 10px 22px rgba(0,0,0,.18);
    }
    .header button[mat-icon-button] {
      color: #f5f7fb;
    }
    .header-copy {
      display: grid;
      gap: .08rem;
      min-width: 0;
    }
    .header-kicker {
      font-size: .68rem;
      text-transform: uppercase;
      letter-spacing: .42px;
      color: rgba(255,255,255,.68);
      font-weight: 800;
    }
    .header h1 {
      margin: 0;
      font-size: 1.2rem;
      font-family: 'MotoGP Bold', sans-serif;
      text-transform: uppercase;
      color: #ffffff;
      line-height: 1.05;
      text-shadow: 0 1px 1px rgba(0, 0, 0, .24);
    }
    .content {
      max-width: 1240px;
      margin: 0 auto;
      padding: 1rem;
      display: grid;
      gap: 1rem;
    }
    .filters-card,
    .breakdown-card {
      border-radius: 18px;
      border: 1px solid rgba(17,18,20,.08);
      box-shadow: 0 12px 26px rgba(17,18,20,.06);
      background: rgba(255,255,255,.94);
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .9rem;
      padding: 1rem;
    }
    .filter-field {
      display: grid;
      gap: .35rem;
    }
    .filter-field span {
      font-size: .78rem;
      font-weight: 800;
      color: #555d68;
      text-transform: uppercase;
      letter-spacing: .3px;
    }
    .filter-field select,
    .filter-field input {
      min-height: 44px;
      border-radius: 12px;
      border: 1px solid rgba(17,18,20,.12);
      background: #fff;
      padding: 0 .85rem;
      font: inherit;
      color: #16181d;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      padding: 1rem 1rem .5rem;
    }
    .card-kicker {
      display: block;
      font-size: .7rem;
      text-transform: uppercase;
      letter-spacing: .4px;
      color: #7a818c;
      font-weight: 800;
    }
    .card-head h2 {
      margin: .15rem 0 0;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 1.05rem;
      text-transform: uppercase;
    }
    .results-pill,
    .total-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: 0 .8rem;
      border-radius: 999px;
      background: rgba(200, 16, 46, 0.08);
      color: #a70d28;
      font-weight: 800;
      white-space: nowrap;
    }
    .state-box {
      padding: 1.5rem 1rem 1.25rem;
      color: #616876;
      font-weight: 600;
    }
    .table-wrap {
      overflow: auto;
      padding: 0 1rem 1rem;
    }
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 840px;
    }
    .breakdown-table th {
      text-align: left;
      padding: .8rem .9rem;
      background: #111214;
      color: #fff;
      font-size: .75rem;
      text-transform: uppercase;
      letter-spacing: .35px;
    }
    .breakdown-table td {
      padding: .9rem;
      border-bottom: 1px solid rgba(17,18,20,.08);
      vertical-align: middle;
    }
    .breakdown-table tr.current-user {
      background: rgba(200,16,46,.05);
    }
    .race-cell {
      display: grid;
      gap: .12rem;
    }
    .race-cell span {
      font-size: .78rem;
      color: #67707d;
    }
    .total-col {
      font-weight: 900;
      color: #c8102e;
    }
    .mobile-list {
      display: grid;
      gap: .75rem;
      padding: 0 1rem 1rem;
    }
    .mobile-row {
      border: 1px solid rgba(17,18,20,.08);
      border-radius: 16px;
      background: #fff;
      padding: .9rem;
      display: grid;
      gap: .85rem;
    }
    .mobile-row.current-user {
      border-color: rgba(200,16,46,.24);
      background: rgba(200,16,46,.03);
    }
    .mobile-row-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .8rem;
    }
    .mobile-row-head div {
      display: grid;
      gap: .2rem;
    }
    .mobile-row-head span {
      color: #636b78;
      font-size: .82rem;
    }
    .mobile-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .6rem;
    }
    .mobile-grid span {
      display: grid;
      gap: .1rem;
      border: 1px solid rgba(17,18,20,.08);
      border-radius: 12px;
      padding: .65rem .7rem;
      font-size: .82rem;
      color: #57606d;
      background: #fafafb;
    }
    .mobile-grid strong {
      color: #121417;
      font-size: .95rem;
    }
    .desktop-only { display: block; }
    .mobile-only { display: none; }
    @media (max-width: 820px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }
      .desktop-only { display: none; }
      .mobile-only { display: block; }
    }
  `]
})
export class StandingsBreakdownComponent implements OnInit {
  loading = true;
  rows: StandingsBreakdownRow[] = [];
  raceOptions: Array<{ id: number; label: string }> = [];
  selectedRaceId = '';
  searchTerm = '';
  loggedUserId = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private championshipService: ChampionshipService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loggedUserId = this.authService.getUserId() || '';

    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (!champId) {
        this.loading = false;
        return;
      }

      this.loading = true;
      this.dashboardService.getStandingsBreakdown(champId).subscribe({
        next: (rows) => {
          this.rows = rows ?? [];
          this.raceOptions = this.buildRaceOptions(this.rows);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching standings breakdown:', error);
          this.rows = [];
          this.raceOptions = [];
          this.loading = false;
        }
      });
    });
  }

  get filteredRows(): StandingsBreakdownRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.rows.filter(row => {
      const matchesRace = !this.selectedRaceId || String(row.calendar_id?.id) === this.selectedRaceId;
      const matchesUser = !term || this.fullName(row).toLowerCase().includes(term);
      return matchesRace && matchesUser;
    });
  }

  goBack(): void {
    const prevNavUrl = this.router.lastSuccessfulNavigation?.previousNavigation?.initialUrl;
    if (prevNavUrl) this.router.navigateByUrl(prevNavUrl);
    else this.router.navigate(['/']);
  }

  fullName(row: StandingsBreakdownRow): string {
    const first = row.user_id?.first_name || '';
    const last = row.user_id?.last_name || '';
    return `${first} ${last}`.trim() || row.user_id?.id || 'Partecipante';
  }

  raceLabel(row: StandingsBreakdownRow): string {
    const round = row.calendar_id?.race_order ? `R${row.calendar_id.race_order}` : 'R?';
    const name = row.calendar_id?.race_id?.name || 'Gara';
    return `${round} · ${name}`;
  }

  sprintBetValue(row: StandingsBreakdownRow): number {
    return Number(row.sprint_bet_delta || 0);
  }

  raceBetValue(row: StandingsBreakdownRow): number {
    return Number(row.race_bet_delta || 0);
  }

  private buildRaceOptions(rows: StandingsBreakdownRow[]): Array<{ id: number; label: string }> {
    const seen = new Set<number>();
    const options: Array<{ id: number; label: string }> = [];

    rows.forEach(row => {
      const raceId = row.calendar_id?.id;
      if (!raceId || seen.has(raceId)) return;
      seen.add(raceId);
      options.push({
        id: raceId,
        label: this.raceLabel(row)
      });
    });

    return options;
  }
}
