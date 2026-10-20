import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { ThemeService } from '../../services/theme.service';
import { AdminService, AdminChampionship } from '../../services/admin.service';
import { ChampionshipService } from '../../services/championship.service';

import { RaceOperationsAdminComponent } from './race-operations-admin/race-operations-admin.component';
import { FantasyTeamsAdminComponent } from './fantasy-teams-admin/fantasy-teams-admin.component';
import { RidersAdminComponent } from './riders-admin/riders-admin.component';
import { CalendarAdminComponent } from './calendar-admin/calendar-admin.component';
import { ChampionshipAdminComponent } from './championship-admin/championship-admin.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RaceOperationsAdminComponent,
    FantasyTeamsAdminComponent,
    RidersAdminComponent,
    CalendarAdminComponent,
    ChampionshipAdminComponent
  ],
  template: `
    <div class="min-h-screen pb-32 font-sans select-none"
         [ngClass]="theme.mode() === 'light' ? 'bg-[#f4f5f8] text-zinc-900' : 'bg-[#0b0d14] text-white'">

      <!-- Top Header con Titolo & Selettore Campionato -->
      <header class="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-white/90 border-zinc-200/80'
                : 'bg-[#10131d]/90 border-white/10'">
        <div class="max-w-6xl mx-auto px-4 py-3 sm:py-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <!-- Torna indietro + Titolo -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="goBack()"
                class="w-10 h-10 rounded-2xl flex items-center justify-center transition active:scale-95 cursor-pointer flex-shrink-0"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  : 'bg-white/10 hover:bg-white/15 text-white'">
                <i class="fa-solid fa-arrow-left text-sm"></i>
              </button>

              <div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                  <span class="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    MotoMota Control Center
                  </span>
                </div>
                <h1 class="text-lg sm:text-xl font-black tracking-tight leading-tight m-0"
                    [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                  Pannello Amministratore
                </h1>
              </div>
            </div>

            <!-- Selettore Campionato Globale -->
            <div class="flex items-center gap-2 self-start md:self-auto w-full md:w-auto min-w-0">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl border w-full md:w-auto min-w-0"
                   [ngClass]="theme.mode() === 'light'
                     ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
                     : 'bg-white/[0.03] border-white/10 text-zinc-300'">
                <i class="fa-solid fa-trophy text-amber-500 text-xs flex-shrink-0"></i>
                <span class="text-xs font-bold whitespace-nowrap hidden sm:inline">Campionato:</span>
                <select
                  [(ngModel)]="selectedChampionshipId"
                  (ngModelChange)="onChampionshipChange()"
                  class="bg-transparent text-xs font-black outline-none cursor-pointer flex-1 md:flex-initial min-w-0 truncate"
                  [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                  <option *ngFor="let c of championships" [value]="c.id" class="bg-zinc-900 text-white">
                    {{ c.description }} ({{ c.year }})
                  </option>
                </select>
              </div>
            </div>

          </div>

          <!-- Navigazione Tab Orizzontale a Pillola -->
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-3 pt-2 border-t"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200/60' : 'border-white/5'">

            <!-- Tab 1: Operazioni Gara & Punteggi -->
            <button
              type="button"
              data-tab="operations"
              (click)="activeTab = 'operations'"
              class="px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 flex-shrink-0"
              [ngClass]="activeTab === 'operations'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-white/5')">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Operazioni & Punteggi</span>
            </button>

            <!-- Tab 2: Fantasy Team & Rose -->
            <button
              type="button"
              data-tab="teams"
              (click)="activeTab = 'teams'"
              class="px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 flex-shrink-0"
              [ngClass]="activeTab === 'teams'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-white/5')">
              <i class="fa-solid fa-users"></i>
              <span>Fantasy Team & Rose</span>
            </button>

            <!-- Tab 3: Piloti & Scuderie -->
            <button
              type="button"
              data-tab="riders"
              (click)="activeTab = 'riders'"
              class="px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 flex-shrink-0"
              [ngClass]="activeTab === 'riders'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-white/5')">
              <i class="fa-solid fa-helmet-un"></i>
              <span>Piloti & Scuderie</span>
            </button>

            <!-- Tab 4: Calendario & Circuiti -->
            <button
              type="button"
              data-tab="calendar"
              (click)="activeTab = 'calendar'"
              class="px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 flex-shrink-0"
              [ngClass]="activeTab === 'calendar'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-white/5')">
              <i class="fa-solid fa-calendar-days"></i>
              <span>Calendario & Circuiti</span>
            </button>

            <!-- Tab 5: Campionati -->
            <button
              type="button"
              data-tab="championships"
              (click)="activeTab = 'championships'"
              class="px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 flex-shrink-0"
              [ngClass]="activeTab === 'championships'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-white/5')">
              <i class="fa-solid fa-trophy"></i>
              <span>Campionati</span>
            </button>

          </div>
        </div>
      </header>

      <!-- Main Container con le viste delle tab -->
      <main class="max-w-6xl mx-auto px-4 py-6">

        <!-- Loading iniziale dei campionati -->
        <div *ngIf="loading" class="py-20 text-center text-zinc-400">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-red-500"></i>
          <p class="text-sm mt-3 font-semibold">Inizializzazione Control Center...</p>
        </div>

        <div *ngIf="!loading && selectedChampionshipId">
          <!-- Tab 1: Operazioni Gara & Punteggi -->
          <div *ngIf="activeTab === 'operations'">
            <app-race-operations-admin [championshipId]="selectedChampionshipId"></app-race-operations-admin>
          </div>

          <!-- Tab 2: Fantasy Team & Rose -->
          <div *ngIf="activeTab === 'teams'">
            <app-fantasy-teams-admin [championshipId]="selectedChampionshipId"></app-fantasy-teams-admin>
          </div>

          <!-- Tab 3: Piloti & Scuderie -->
          <div *ngIf="activeTab === 'riders'">
            <app-riders-admin [championshipId]="selectedChampionshipId"></app-riders-admin>
          </div>

          <!-- Tab 4: Calendario & Circuiti -->
          <div *ngIf="activeTab === 'calendar'">
            <app-calendar-admin [championshipId]="selectedChampionshipId"></app-calendar-admin>
          </div>

          <!-- Tab 5: Campionati -->
          <div *ngIf="activeTab === 'championships'">
            <app-championship-admin></app-championship-admin>
          </div>
        </div>

      </main>

      <!-- Barra Mobile Rapida "Torna alla Dashboard" -->
      <div class="sm:hidden fixed bottom-4 inset-x-4 z-40 pointer-events-none">
        <div class="pointer-events-auto max-w-sm mx-auto backdrop-blur-xl rounded-2xl p-2 px-3.5 shadow-2xl border flex items-center justify-between"
             [ngClass]="theme.mode() === 'light' ? 'bg-white/95 border-zinc-200 shadow-zinc-300/60' : 'bg-[#141722]/95 border-white/10 shadow-black/80'">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span class="text-[11px] font-black uppercase tracking-wider text-purple-400">Modalità Admin</span>
          </div>
          <button
            type="button"
            (click)="goBack()"
            class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer active:scale-95 transition">
            <i class="fa-solid fa-house text-[10px]"></i>
            <span>Torna all'App</span>
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'operations' | 'teams' | 'riders' | 'calendar' | 'championships' = 'operations';
  championships: AdminChampionship[] = [];
  selectedChampionshipId: number | null = null;
  loading = true;

  constructor(
    private adminService: AdminService,
    private champService: ChampionshipService,
    private navService: NavigationService,
    public theme: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadChampionships();
  }

  loadChampionships(): void {
    this.loading = true;
    this.adminService.getChampionships().subscribe({
      next: (res) => {
        this.championships = (res || []).sort((a, b) => b.year - a.year);
        if (this.championships.length > 0) {
          // Default to the first (highest year) championship
          this.selectedChampionshipId = this.championships[0].id!;

          // Check if default championship is specified
          this.champService.getDefaultChampionship().subscribe({
            next: (def) => {
              if (def?.id) {
                const found = this.championships.find(c => c.id === def.id);
                if (found) {
                  this.selectedChampionshipId = found.id!;
                }
              }
            }
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching championships:', err);
      }
    });
  }

  onChampionshipChange(): void {
    // When changing championship in dropdown, components receive the new @Input() championshipId
  }

  goBack(): void {
    this.navService.back('/');
  }
}
