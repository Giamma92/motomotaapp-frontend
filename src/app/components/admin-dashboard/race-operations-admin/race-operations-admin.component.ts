import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationServiceService } from '../../../services/notification.service';
import { AdminService, AdminCalendarRace, RaceSubmissionStatusResponse, ManagerSubmissionStatus } from '../../../services/admin.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-race-operations-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Selettore Round Gara -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-black tracking-tight m-0 flex items-center gap-2"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              <span class="w-7 h-7 rounded-lg bg-red-600/15 text-red-500 flex items-center justify-center text-xs">
                <i class="fa-solid fa-flag-checkered"></i>
              </span>
              Seleziona Gara da Gestire
            </h3>
            <p class="text-xs mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
              Controlla le sottomissioni dei manager, forza formazioni/scommesse o ricalcola i punteggi.
            </p>
          </div>

          <div class="w-full sm:w-auto min-w-0 sm:min-w-[280px] max-w-full">
            <select
              [(ngModel)]="selectedCalendarId"
              (ngModelChange)="onRaceChanged()"
              [disabled]="loadingCalendar || calendarRaces.length === 0"
              class="w-full text-xs sm:text-sm font-bold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer truncate"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
              <option *ngFor="let race of calendarRaces" [value]="race.id">
                R{{ race.race_order }} · {{ race.race_id?.name || 'GP' }} ({{ race.event_date }}) {{ race.cancelled ? '[ANNULLATA]' : '' }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Automazione: Trigger Automatico Punteggi Post-Gara -->
      <div class="rounded-2xl p-4 sm:p-5 border relative overflow-hidden"
           [ngClass]="theme.mode() === 'light'
             ? 'bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white border-purple-200 shadow-sm'
             : 'bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-[#141720] border-purple-500/20 shadow-md'">
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-md shadow-purple-600/30 mt-0.5">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Trigger Automatico Attivo
                </span>
                <span class="text-[11px] text-zinc-400 font-medium">
                  • Verifica ogni 10 min
                </span>
                <span *ngIf="autoScoreStatus?.lastCheckTime || autoScoreStatus?.scheduler?.lastRunAt" class="text-[11px] text-zinc-400 font-medium">
                  (Ultimo controllo: {{ (autoScoreStatus?.lastCheckTime || autoScoreStatus?.scheduler?.lastRunAt) | date:'HH:mm:ss' }})
                </span>
              </div>
              <h4 class="text-sm sm:text-base font-black tracking-tight mt-1 m-0"
                  [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                Calcolo Automatico Punteggi 30 Minuti Post-Gara
              </h4>
              <p class="text-xs mt-1 max-w-2xl leading-relaxed"
                 [ngClass]="theme.mode() === 'light' ? 'text-zinc-600' : 'text-zinc-400'">
                Mezz'ora dopo la conclusione della gara domenicale (bandiera a scacchi), il sistema sincronizza in autonomia l'ordine di arrivo Dorna/Pulselive, applica le formazioni di fallback per chi non ha schierato, calcola la classifica e invia notifiche push a tutti i partecipanti.
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
            <button
              type="button"
              (click)="onTriggerAutoScore(false)"
              [disabled]="actionLoading"
              class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-purple-600/20">
              <i class="fa-solid" [ngClass]="activeAction === 'auto-score' ? 'fa-spinner fa-spin' : 'fa-play'"></i>
              <span>Verifica & Esegui Adesso</span>
            </button>
            <button
              type="button"
              (click)="onTriggerAutoScore(true)"
              [disabled]="actionLoading || !selectedCalendarId"
              title="Forza l'esecuzione automatica completa (sync, formazioni, punteggi) sul round selezionato"
              class="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-purple-500/30 hover:bg-purple-500/10 text-purple-400 font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5">
              <i class="fa-solid" [ngClass]="activeAction === 'auto-score-force' ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
              <span>Forza Round Corrente</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Azioni Rapide Operative Round -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="mb-4">
          <h3 class="text-base font-black tracking-tight m-0 flex items-center gap-2"
              [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
            <span class="w-7 h-7 rounded-lg bg-purple-600/15 text-purple-400 flex items-center justify-center text-xs">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
            </span>
            Operazioni Automatiche Round
          </h3>
          <p class="text-xs mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
            Azioni di forzatura inserimenti e automazione calcoli punteggi per il round selezionato.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <!-- 1. Forza Formazioni Mancanti -->
          <div class="p-4 rounded-xl border flex flex-col justify-between"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <div>
              <div class="flex items-center gap-2 text-sm font-black"
                   [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                <i class="fa-solid fa-users-gear text-blue-500"></i>
                Forza Formazioni
              </div>
              <p class="text-xs mt-1 mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
                Copia la formazione dall'ultima gara valida per tutti i manager che non hanno schierato i piloti.
              </p>
            </div>
            <button
              type="button"
              (click)="onFillMissingLineups()"
              [disabled]="actionLoading || !selectedCalendarId"
              class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid" [ngClass]="activeAction === 'lineups' ? 'fa-spinner fa-spin' : 'fa-list-check'"></i>
              <span>Forza Formazioni Mancanti</span>
            </button>
          </div>

          <!-- 2. Forza Scommesse Mancanti -->
          <div class="p-4 rounded-xl border flex flex-col justify-between"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <div>
              <div class="flex items-center gap-2 text-sm font-black"
                   [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                <i class="fa-solid fa-dice text-amber-500"></i>
                Forza Scommesse
              </div>
              <p class="text-xs mt-1 mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
                Inserisce/copia scommesse Sprint e Gara di fallback per chi non ha effettuato il pronostico entro il termine.
              </p>
            </div>
            <button
              type="button"
              (click)="onFillMissingBets()"
              [disabled]="actionLoading || !selectedCalendarId"
              class="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid" [ngClass]="activeAction === 'bets' ? 'fa-spinner fa-spin' : 'fa-dice'"></i>
              <span>Forza Scommesse Mancanti</span>
            </button>
          </div>

          <!-- 3. Sincronizza Risultati Ufficiali MotoGP -->
          <div class="p-4 rounded-xl border flex flex-col justify-between"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <div>
              <div class="flex items-center gap-2 text-sm font-black"
                   [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                <i class="fa-solid fa-cloud-arrow-down text-emerald-500"></i>
                Sync Risultati MotoGP
              </div>
              <p class="text-xs mt-1 mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
                Scarica i risultati ufficiali Dorna (Qualifiche, Sprint, Gara) per questo round.
              </p>
            </div>
            <button
              type="button"
              (click)="onSyncMotoGPResults()"
              [disabled]="actionLoading || !selectedCalendarId"
              class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid" [ngClass]="activeAction === 'sync' ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'"></i>
              <span>Sincronizza Risultati</span>
            </button>
          </div>

          <!-- 4. Calcola Punteggi Round -->
          <div class="p-4 rounded-xl border flex flex-col justify-between"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <div>
              <div class="flex items-center gap-2 text-sm font-black"
                   [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                <i class="fa-solid fa-calculator text-red-500"></i>
                Calcola Punteggi Round
              </div>
              <p class="text-xs mt-1 mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
                Calcola i punteggi dei team e aggiorna la classifica generale del campionato.
              </p>
            </div>
            <button
              type="button"
              (click)="onCalculateScores()"
              [disabled]="actionLoading || !selectedCalendarId"
              class="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid" [ngClass]="activeAction === 'calc' ? 'fa-spinner fa-spin' : 'fa-bolt'"></i>
              <span>Calcola Punteggi</span>
            </button>
          </div>

          <!-- 5. Ricalcola Punteggi Round -->
          <div class="p-4 rounded-xl border flex flex-col justify-between"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <div>
              <div class="flex items-center gap-2 text-sm font-black"
                   [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                <i class="fa-solid fa-rotate-left text-orange-500"></i>
                Ricalcola Questo Round
              </div>
              <p class="text-xs mt-1 mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
                Elimina i vecchi punteggi registrati per questa gara e li ricalcola da zero.
              </p>
            </div>
            <button
              type="button"
              (click)="onRecalculateScores()"
              [disabled]="actionLoading || !selectedCalendarId"
              class="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid" [ngClass]="activeAction === 'recalc-single' ? 'fa-spinner fa-spin' : 'fa-rotate-left'"></i>
              <span>Ricalcola Questo Round</span>
            </button>
          </div>

          <!-- 6. Ricalcola Intero Campionato -->
          <div class="p-4 rounded-xl border flex flex-col justify-between"
               [ngClass]="theme.mode() === 'light' ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-950/20 border-purple-500/20'">
            <div>
              <div class="flex items-center gap-2 text-sm font-black text-purple-400">
                <i class="fa-solid fa-trophy text-purple-400"></i>
                Ricalcola Tutto il Campionato
              </div>
              <p class="text-xs mt-1 mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
                Ricalcola in ordine cronologico tutte le gare concluse dall'inizio ad oggi.
              </p>
            </div>
            <button
              type="button"
              (click)="onRecalculateAll()"
              [disabled]="actionLoading"
              class="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid" [ngClass]="activeAction === 'recalc-all' ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'"></i>
              <span>Ricalcola Tutte le Gare</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stato Sottomissioni Partecipanti in Tempo Reale -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="text-base font-black tracking-tight m-0 flex items-center gap-2"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              <span class="w-7 h-7 rounded-lg bg-emerald-600/15 text-emerald-500 flex items-center justify-center text-xs">
                <i class="fa-solid fa-users"></i>
              </span>
              Monitoraggio Sottomissioni Partecipanti
            </h3>
            <p class="text-xs mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
              Verifica chi ha già inviato formazione, scommessa sprint e scommessa gara per questo round.
            </p>
          </div>

          <button
            type="button"
            (click)="loadSubmissionStatus()"
            [disabled]="loadingStatus || !selectedCalendarId"
            class="px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
            <i class="fa-solid fa-rotate" [ngClass]="{'fa-spin': loadingStatus}"></i>
            <span>Aggiorna Stato</span>
          </button>
        </div>

        <!-- Metric Badges -->
        <div *ngIf="submissionData" class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
          <div class="p-3 rounded-xl border"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <div class="text-[10.5px] uppercase font-bold text-zinc-400">Totale Manager</div>
            <div class="text-lg font-black mt-0.5" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              {{ submissionData.totalManagers }}
            </div>
          </div>

          <div class="p-3 rounded-xl border"
               [ngClass]="theme.mode() === 'light' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'">
            <div class="text-[10.5px] uppercase font-bold opacity-80">Completi al 100%</div>
            <div class="text-lg font-black mt-0.5">
              {{ submissionData.fullySubmitted }} / {{ submissionData.totalManagers }}
            </div>
          </div>

          <div class="p-3 rounded-xl border"
               [ngClass]="submissionData.missingLineup > 0
                ? (theme.mode() === 'light' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/20 border-red-500/20 text-red-400')
                : (theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-white/[0.02] border-white/5 text-zinc-400')">
            <div class="text-[10.5px] uppercase font-bold opacity-80">Mancanti Formazione</div>
            <div class="text-lg font-black mt-0.5">
              {{ submissionData.missingLineup }}
            </div>
          </div>

          <div class="p-3 rounded-xl border"
               [ngClass]="submissionData.missingSprintBet > 0
                ? (theme.mode() === 'light' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/20 border-amber-500/20 text-amber-400')
                : (theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-white/[0.02] border-white/5 text-zinc-400')">
            <div class="text-[10.5px] uppercase font-bold opacity-80">Mancanti Sprint Bet</div>
            <div class="text-lg font-black mt-0.5">
              {{ submissionData.missingSprintBet }}
            </div>
          </div>

          <div class="p-3 rounded-xl border col-span-2 sm:col-span-1"
               [ngClass]="submissionData.missingRaceBet > 0
                ? (theme.mode() === 'light' ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-purple-950/20 border-purple-500/20 text-purple-400')
                : (theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-white/[0.02] border-white/5 text-zinc-400')">
            <div class="text-[10.5px] uppercase font-bold opacity-80">Mancanti Race Bet</div>
            <div class="text-lg font-black mt-0.5">
              {{ submissionData.missingRaceBet }}
            </div>
          </div>
        </div>

        <!-- Tabella Dettagli Manager -->
        <div *ngIf="loadingStatus" class="py-12 text-center text-zinc-400">
          <i class="fa-solid fa-spinner fa-spin text-2xl text-red-500"></i>
          <p class="text-xs mt-2 font-medium">Caricamento stato partecipanti...</p>
        </div>

        <div *ngIf="!loadingStatus && submissionData" class="overflow-x-auto rounded-xl border"
             [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900/90 text-zinc-400'">
                <th class="p-3 font-bold uppercase tracking-wider">Manager & Squadra</th>
                <th class="p-3 font-bold uppercase tracking-wider text-center">Formazione</th>
                <th class="p-3 font-bold uppercase tracking-wider text-center">Sprint Bet</th>
                <th class="p-3 font-bold uppercase tracking-wider text-center">Race Bet</th>
                <th class="p-3 font-bold uppercase tracking-wider text-center">Stato Globale</th>
              </tr>
            </thead>
            <tbody class="divide-y" [ngClass]="theme.mode() === 'light' ? 'divide-zinc-200' : 'divide-white/5'">
              <tr *ngFor="let m of submissionData.managers"
                  class="transition-colors"
                  [ngClass]="theme.mode() === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.02]'">
                <!-- Manager & Team -->
                <td class="p-3">
                  <div class="font-black text-sm" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                    {{ m.userName }}
                  </div>
                  <div class="text-[11px] font-bold text-red-500 mt-0.5">
                    {{ m.teamName }}
                  </div>
                </td>

                <!-- Formazione -->
                <td class="p-3 text-center">
                  <span *ngIf="m.hasLineup"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <i class="fa-solid fa-check"></i> Inviata
                  </span>
                  <span *ngIf="!m.hasLineup"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-500/15 text-red-400 border border-red-500/30">
                    <i class="fa-solid fa-xmark"></i> Mancante
                  </span>
                </td>

                <!-- Sprint Bet -->
                <td class="p-3 text-center">
                  <span *ngIf="m.hasSprintBet"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <i class="fa-solid fa-check"></i> Inviata
                  </span>
                  <span *ngIf="!m.hasSprintBet"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <i class="fa-solid fa-xmark"></i> Mancante
                  </span>
                </td>

                <!-- Race Bet -->
                <td class="p-3 text-center">
                  <span *ngIf="m.hasRaceBet"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <i class="fa-solid fa-check"></i> Inviata
                  </span>
                  <span *ngIf="!m.hasRaceBet"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <i class="fa-solid fa-xmark"></i> Mancante
                  </span>
                </td>

                <!-- Stato Globale -->
                <td class="p-3 text-center">
                  <span *ngIf="m.isFullySubmitted"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-sm">
                    <i class="fa-solid fa-circle-check"></i> Pronto
                  </span>
                  <span *ngIf="!m.isFullySubmitted"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-zinc-700/60 text-zinc-300">
                    <i class="fa-solid fa-hourglass-half"></i> Incompleto
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class RaceOperationsAdminComponent implements OnInit, OnChanges {
  @Input() championshipId!: number;

  calendarRaces: AdminCalendarRace[] = [];
  selectedCalendarId: number | null = null;
  loadingCalendar = false;

  submissionData: RaceSubmissionStatusResponse | null = null;
  loadingStatus = false;

  actionLoading = false;
  activeAction: string | null = null;
  autoScoreStatus: any = null;

  constructor(
    private adminService: AdminService,
    public theme: ThemeService,
    private snackBar: MatSnackBar,
    private notificationService: NotificationServiceService
  ) {}

  ngOnInit(): void {
    if (this.championshipId) {
      this.loadCalendar();
    }
    this.loadAutoScoreStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['championshipId'] && !changes['championshipId'].firstChange) {
      this.loadCalendar();
    }
  }

  loadCalendar(): void {
    this.loadingCalendar = true;
    this.adminService.getCalendar(this.championshipId).subscribe({
      next: (races) => {
        this.loadingCalendar = false;
        this.calendarRaces = races || [];
        if (this.calendarRaces.length > 0) {
          // Select first non-cancelled race or race nearest to today
          const today = new Date().toISOString().split('T')[0];
          const upcoming = this.calendarRaces.find(r => !r.cancelled && r.event_date >= today);
          this.selectedCalendarId = upcoming ? upcoming.id! : this.calendarRaces[0].id!;
          this.loadSubmissionStatus();
        }
      },
      error: (err) => {
        this.loadingCalendar = false;
        console.error('Error fetching calendar races:', err);
        this.notificationService.showErrorMessage('Errore nel caricamento del calendario');
      }
    });
  }

  onRaceChanged(): void {
    if (this.selectedCalendarId) {
      this.loadSubmissionStatus();
    }
  }

  loadSubmissionStatus(): void {
    if (!this.selectedCalendarId) return;
    this.loadingStatus = true;
    this.adminService.getSubmissionStatus(this.championshipId, this.selectedCalendarId).subscribe({
      next: (res) => {
        this.loadingStatus = false;
        this.submissionData = res;
      },
      error: (err) => {
        this.loadingStatus = false;
        console.error('Error fetching submission status:', err);
        this.notificationService.showErrorMessage('Errore nel caricamento sottomissioni');
      }
    });
  }

  onFillMissingLineups(): void {
    if (!this.selectedCalendarId) return;
    const ok = confirm('Sei sicuro di voler forzare l\'inserimento delle formazioni mancanti? Verrà copiata l\'ultima formazione valida per ciascun manager assente.');
    if (!ok) return;

    this.actionLoading = true;
    this.activeAction = 'lineups';
    this.adminService.fillMissingLineups(this.championshipId, this.selectedCalendarId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.activeAction = null;
        this.notificationService.showSuccessMessage(res?.message || 'Formazioni mancanti inserite con successo!');
        this.loadSubmissionStatus();
      },
      error: (err) => {
        this.actionLoading = false;
        this.activeAction = null;
        console.error('Error filling lineups:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore forzatura formazioni');
      }
    });
  }

  onFillMissingBets(): void {
    if (!this.selectedCalendarId) return;
    const ok = confirm('Sei sicuro di voler forzare l\'inserimento delle scommesse mancanti per i manager che non hanno inviato i pronostici?');
    if (!ok) return;

    this.actionLoading = true;
    this.activeAction = 'bets';
    this.adminService.fillMissingBets(this.championshipId, this.selectedCalendarId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.activeAction = null;
        this.notificationService.showSuccessMessage(res?.message || 'Scommesse mancanti inserite con successo!');
        this.loadSubmissionStatus();
      },
      error: (err) => {
        this.actionLoading = false;
        this.activeAction = null;
        console.error('Error filling bets:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore forzatura scommesse');
      }
    });
  }

  onSyncMotoGPResults(): void {
    if (!this.selectedCalendarId) return;
    this.actionLoading = true;
    this.activeAction = 'sync';
    this.adminService.syncMotoGPResults(this.championshipId, this.selectedCalendarId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.activeAction = null;
        this.notificationService.showSuccessMessage('Risultati ufficiali MotoGP sincronizzati con successo!');
      },
      error: (err) => {
        this.actionLoading = false;
        this.activeAction = null;
        console.error('Error syncing MotoGP results:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore sincronizzazione risultati MotoGP');
      }
    });
  }

  onCalculateScores(): void {
    if (!this.selectedCalendarId) return;
    this.actionLoading = true;
    this.activeAction = 'calc';
    this.adminService.calculateScores(this.championshipId, this.selectedCalendarId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.activeAction = null;
        this.notificationService.showSuccessMessage('Punteggi del round calcolati con successo!');
      },
      error: (err) => {
        this.actionLoading = false;
        this.activeAction = null;
        console.error('Error calculating scores:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore calcolo punteggi');
      }
    });
  }

  onRecalculateScores(): void {
    if (!this.selectedCalendarId) return;
    const ok = confirm('Sei sicuro di voler ricalcolare da zero i punteggi di questo round? I vecchi punteggi verranno invalidati e ricalcolati.');
    if (!ok) return;

    this.actionLoading = true;
    this.activeAction = 'recalc-single';
    this.adminService.recalculateScores(this.championshipId, this.selectedCalendarId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.activeAction = null;
        this.notificationService.showSuccessMessage('Punteggi del round ricalcolati con successo!');
      },
      error: (err) => {
        this.actionLoading = false;
        this.activeAction = null;
        console.error('Error recalculating scores:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore ricalcolo punteggi');
      }
    });
  }

  onRecalculateAll(): void {
    const ok = confirm('ATTENZIONE: Sei sicuro di voler ricalcolare l\'INTERO CAMPIONATO? Questa operazione invaliderà e ricalcolerà in ordine tutte le gare concluse!');
    if (!ok) return;

    this.actionLoading = true;
    this.activeAction = 'recalc-all';
    this.adminService.recalculateAll(this.championshipId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.activeAction = null;
        this.notificationService.showSuccessMessage(res?.message || 'Intero campionato ricalcolato con successo!');
      },
      error: (err) => {
        this.actionLoading = false;
        this.activeAction = null;
        console.error('Error recalculating all:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore ricalcolo intero campionato');
      }
    });
  }

  loadAutoScoreStatus(): void {
    this.adminService.getAutoScoreStatus().subscribe({
      next: (res) => {
        this.autoScoreStatus = res;
      },
      error: (err) => {
        console.warn('Impossibile recuperare lo stato dello scheduler auto-score:', err);
      }
    });
  }

  onTriggerAutoScore(force: boolean = false): void {
    if (force && !confirm('Vuoi forzare l\'esecuzione completa (sincronizzazione Dorna, formazioni di fallback e calcolo punteggi) sul round attualmente selezionato?')) {
      return;
    }

    this.actionLoading = true;
    this.activeAction = force ? 'auto-score-force' : 'auto-score';
    const targetCalendarId = force ? (this.selectedCalendarId || undefined) : undefined;

    this.adminService.triggerAutoScore(force, targetCalendarId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        this.activeAction = null;
        const processed: any[] = res?.processed || res?.result?.processed || [];
        const successItems = processed.filter(item => item.status === 'success');
        const waitingItems = processed.filter(item => item.status === 'waiting_for_official_results');
        const errorItems = processed.filter(item => item.status === 'error');
        const count = successItems.length || (res?.processedCount ?? res?.result?.processedCount ?? 0);

        if (errorItems.length > 0 && successItems.length === 0) {
          this.notificationService.showErrorMessage(errorItems[0]?.error || 'Errore durante il calcolo automatico punteggi.');
        } else if (successItems.length > 0) {
          const stages = successItems.map(i => `R${i.raceOrder} (${i.stageAchieved || i.targetStage})`).join(', ');
          this.notificationService.showSuccessMessage(`Trigger completato: aggiornato ${stages}!`);
        } else if (waitingItems.length > 0) {
          this.notificationService.showSuccessMessage(waitingItems[0]?.message || 'In attesa dei risultati ufficiali Dorna per la sessione.');
        } else {
          const msg = res?.result?.message || res?.message || (count > 0 ? `Trigger completato: ${count} gara/e elaborata/e!` : 'Verifica completata: nessuna sessione in attesa di calcolo al momento.');
          this.notificationService.showSuccessMessage(msg);
        }
        this.loadAutoScoreStatus();
        if (this.selectedCalendarId) {
          this.loadSubmissionStatus();
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.activeAction = null;
        console.error('Error triggering auto score:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore esecuzione trigger automatico');
      }
    });
  }
}

