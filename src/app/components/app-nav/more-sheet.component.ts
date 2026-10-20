import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserInfo } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { HapticService } from '../../services/haptic.service';
import { DashboardService, CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService, ChampionshipConfig } from '../../services/championship.service';
import { RaceScheduleService } from '../../services/race-schedule.service';

@Component({
  selector: 'app-more-sheet',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    @if (isOpen) {
      <!-- Backdrop sfocato -->
      <div
        class="sheet-backdrop fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        (click)="onClose()"
        aria-hidden="true">
      </div>

      <!-- Container: mobile in basso (bottom-sheet), desktop centrato (modal dialog) -->
      <div class="fixed inset-0 z-[70] pointer-events-none flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
        <div
          class="sheet-modal pointer-events-auto w-full max-w-lg md:max-w-md rounded-t-[32px] md:rounded-[32px] p-5 pb-[max(2rem,env(safe-area-inset-bottom,2rem))] md:p-6 md:pb-6 max-h-[88vh] md:max-h-[84vh] overflow-y-auto font-sans shadow-[0_-16px_48px_rgba(0,0,0,0.6)] md:shadow-[0_24px_64px_rgba(0,0,0,0.7)] border-t md:border select-none"
        [style.transform]="dragTranslateY > 0 ? 'translateY(' + dragTranslateY + 'px)' : ''"
        [style.transition]="isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onTouchEnd($event)"
        (touchcancel)="onTouchCancel()"
        [ngClass]="theme.mode() === 'light'
          ? 'bg-white/95 backdrop-blur-2xl text-zinc-900 border-black/[0.08]'
          : 'bg-[#141720]/95 backdrop-blur-2xl text-white border-white/10'"
        role="dialog"
        aria-modal="true"
        aria-label="Menu Altro">

        <!-- Maniglia per trascinamento / swipe (visibile solo su mobile) -->
        <div
          class="w-12 h-1.5 rounded-full mx-auto mb-4 cursor-pointer transition-colors md:hidden"
          [ngClass]="theme.mode() === 'light' ? 'bg-zinc-300 hover:bg-zinc-400' : 'bg-zinc-700 hover:bg-zinc-600'"
          (click)="onClose()">
        </div>

        <!-- Header Profilo Utente -->
        <div
          class="flex items-center justify-between mb-4 pb-3 border-b"
          [ngClass]="theme.mode() === 'light' ? 'border-black/[0.06]' : 'border-white/5'">
          <a
            routerLink="/profile"
            (click)="onNavigate()"
            class="flex items-center gap-3 min-w-0 no-underline cursor-pointer group">
            <!-- Avatar con Iniziale / Foto -->
            <div class="relative w-11 h-11 flex-shrink-0">
              <div class="w-11 h-11 rounded-2xl bg-zinc-800 border-2 border-red-500/40 flex items-center justify-center text-white font-black text-base shadow-md shadow-red-600/20 overflow-hidden group-hover:scale-105 transition-transform">
                <img *ngIf="userInfo?.profile_image"
                     [src]="userInfo?.profile_image"
                     alt="Profile"
                     class="w-full h-full object-cover"
                     (error)="$any($event.target).onerror = null; $any($event.target).src = 'assets/images/manager-placeholder.svg'">
                <img *ngIf="!userInfo?.profile_image"
                     src="assets/images/manager-placeholder.svg"
                     alt="Profile"
                     class="w-full h-full object-cover">
              </div>
            </div>
            <div class="truncate">
              <h2 class="text-base font-black tracking-tight m-0 leading-tight truncate group-hover:text-red-500 transition-colors"
                  [class.text-white]="theme.mode() === 'dark'" [class.text-zinc-900]="theme.mode() === 'light'">
                {{ userDisplayName }}
              </h2>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-red-500">
                  {{ isAdmin ? 'Admin & Fanta-Manager' : 'Fanta-Manager' }}
                </span>
                <span class="text-[10px] text-zinc-400">• MotoGP 2026</span>
              </div>
            </div>
          </a>

          <button
            type="button"
            (click)="onClose()"
            class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer flex-shrink-0 border"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200 shadow-sm'
              : 'bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white border-white/10 shadow-sm'"
            aria-label="Chiudi menu">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <!-- Timer Scadenza Sessione con tasto Rinnova -->
        <div
          class="mb-4 px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-xs"
          [ngClass]="theme.mode() === 'light'
            ? 'bg-zinc-50/80 border-zinc-200/80 text-zinc-800'
            : 'bg-zinc-900/50 border-white/5 text-zinc-200'">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-clock-rotate-left text-xs"></i>
            </div>
            <div class="min-w-0">
              <div class="font-bold text-[11px] leading-tight flex items-center gap-1.5">
                <span>Sessione attiva</span>
                <span *ngIf="sessionRenewSuccess" class="text-emerald-500 text-[10px] font-black">✓ Rinnovata!</span>
              </div>
              <div class="text-[10px] text-zinc-400">
                Scade tra: <strong class="font-mono text-amber-400 font-bold">{{ sessionRemainingText }}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            (click)="onRenewSession()"
            [disabled]="sessionRenewing"
            class="px-2.5 py-1 rounded-xl text-[11px] font-black transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex-shrink-0"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
              : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20'">
            {{ sessionRenewing ? 'Rinnovo...' : 'Rinnova' }}
          </button>
        </div>

        <!-- ──────────────────────────────────────────────
             SEZIONE 1: SCORCIATOIE RAPIDE GP
             Pulsanti per Schieramento, Sprint Bet, Race Bet
             Attivi solo se rientrano nella finestra oraria!
        ────────────────────────────────────────────── -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                  [ngClass]="theme.mode() === 'light' ? 'text-zinc-600' : 'text-zinc-400'">
              <i class="fa-solid fa-bolt text-red-500"></i> Scorciatoie GP
            </span>
            <span *ngIf="nextRace" class="text-[10px] font-bold text-zinc-500 truncate max-w-[190px]">
              Round {{ nextRace.race_order }} • {{ nextRace.race_id.name }}
            </span>
          </div>

          <!-- Banner di stato sessione aperta se almeno una è attiva -->
          @if (canAnyShortcut && nextRace) {
            <div class="mb-2 p-2 px-3 rounded-xl flex items-center justify-between border"
                 [ngClass]="theme.mode() === 'light'
                   ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                   : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[11px] font-bold">Finestre pronostici aperte ora!</span>
              </div>
              <span class="text-[10px] font-semibold opacity-85">Tocca sotto per inviare</span>
            </div>
          }

          <!-- Griglia 3 Scorciatoie GP: Schieramento, Sprint Bet, Race Bet -->
          <div class="grid grid-cols-3 gap-2">

            <!-- 1. Scorciatoia Schieramento Qualifiche -->
            @if (canLineup && nextRace) {
              <a
                [routerLink]="['/lineups', nextRace.id]"
                (click)="onNavigate()"
                class="p-2.5 rounded-2xl border flex flex-col justify-between gap-2.5 no-underline active:scale-95 transition-all shadow-md cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-gradient-to-b from-red-500/15 to-red-500/5 border-red-500/30'
                  : 'bg-gradient-to-b from-red-600/30 to-red-600/10 border-red-500/40'">
                <div class="flex items-center justify-between">
                  <div class="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center text-xs shadow-sm shadow-red-600/40">
                    <i class="fa-solid fa-list-check"></i>
                  </div>
                  <span class="py-0.5 px-1.5 rounded-md border text-[8.5px] font-black uppercase tracking-tight"
                        [ngClass]="theme.mode() === 'light'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'">
                    Aperto
                  </span>
                </div>
                <div>
                  <div class="text-xs font-black leading-tight"
                       [class.text-white]="theme.mode() === 'dark'" [class.text-zinc-900]="theme.mode() === 'light'">
                    Schieramento
                  </div>
                  <div class="text-[9.5px] mt-0.5 font-medium"
                       [class.text-zinc-400]="theme.mode() === 'dark'" [class.text-red-700]="theme.mode() === 'light'">
                    Invia piloti
                  </div>
                </div>
              </a>
            } @else {
              <div
                class="p-2.5 rounded-2xl border flex flex-col justify-between gap-2.5 select-none opacity-60 cursor-not-allowed"
                [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 border-zinc-200/80' : 'bg-zinc-900/40 border-white/5'">
                <div class="flex items-center justify-between">
                  <div class="w-7 h-7 rounded-xl flex items-center justify-center text-xs"
                       [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-800 text-zinc-500'">
                    <i class="fa-solid fa-list-check"></i>
                  </div>
                  <span class="py-0.5 px-1.5 rounded-md text-[8.5px] font-bold uppercase tracking-tight"
                        [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-800 text-zinc-500'">
                    Chiuso
                  </span>
                </div>
                <div>
                  <div class="text-xs font-bold leading-tight" [class.text-zinc-300]="theme.mode() === 'dark'" [class.text-zinc-700]="theme.mode() === 'light'">Schieramento</div>
                  <div class="text-[9.5px] text-zinc-500 mt-0.5">Apre Giovedì</div>
                </div>
              </div>
            }

            <!-- 2. Scorciatoia Scommessa Sprint -->
            @if (canSprint && nextRace) {
              <a
                [routerLink]="['/sprint-bet', nextRace.id]"
                (click)="onNavigate()"
                class="p-2.5 rounded-2xl border flex flex-col justify-between gap-2.5 no-underline active:scale-95 transition-all shadow-md cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-500/35'
                  : 'bg-gradient-to-b from-amber-500/30 to-amber-500/10 border-amber-500/40'">
                <div class="flex items-center justify-between">
                  <div class="w-7 h-7 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center text-xs shadow-sm shadow-amber-500/40">
                    <i class="fa-solid fa-bolt"></i>
                  </div>
                  <span class="py-0.5 px-1.5 rounded-md border text-[8.5px] font-black uppercase tracking-tight"
                        [ngClass]="theme.mode() === 'light'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'">
                    Aperto
                  </span>
                </div>
                <div>
                  <div class="text-xs font-black leading-tight"
                       [class.text-white]="theme.mode() === 'dark'" [class.text-zinc-900]="theme.mode() === 'light'">
                    Sprint Bet
                  </div>
                  <div class="text-[9.5px] mt-0.5 font-medium"
                       [class.text-zinc-400]="theme.mode() === 'dark'" [class.text-amber-800]="theme.mode() === 'light'">
                    Pronostico
                  </div>
                </div>
              </a>
            } @else {
              <div
                class="p-2.5 rounded-2xl border flex flex-col justify-between gap-2.5 select-none opacity-60 cursor-not-allowed"
                [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 border-zinc-200/80' : 'bg-zinc-900/40 border-white/5'">
                <div class="flex items-center justify-between">
                  <div class="w-7 h-7 rounded-xl flex items-center justify-center text-xs"
                       [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-800 text-zinc-500'">
                    <i class="fa-solid fa-bolt"></i>
                  </div>
                  <span class="py-0.5 px-1.5 rounded-md text-[8.5px] font-bold uppercase tracking-tight"
                        [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-800 text-zinc-500'">
                    Chiuso
                  </span>
                </div>
                <div>
                  <div class="text-xs font-bold leading-tight" [class.text-zinc-300]="theme.mode() === 'dark'" [class.text-zinc-700]="theme.mode() === 'light'">Sprint Bet</div>
                  <div class="text-[9.5px] text-zinc-500 mt-0.5">Apre Sabato</div>
                </div>
              </div>
            }

            <!-- 3. Scorciatoia Scommessa Gara -->
            @if (canRace && nextRace) {
              <a
                [routerLink]="['/race-bet', nextRace.id]"
                (click)="onNavigate()"
                class="p-2.5 rounded-2xl border flex flex-col justify-between gap-2.5 no-underline active:scale-95 transition-all shadow-md cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-gradient-to-b from-purple-500/20 to-purple-500/5 border-purple-500/35'
                  : 'bg-gradient-to-b from-purple-500/30 to-purple-500/10 border-purple-500/40'">
                <div class="flex items-center justify-between">
                  <div class="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs shadow-sm shadow-purple-600/40">
                    <i class="fa-solid fa-trophy"></i>
                  </div>
                  <span class="py-0.5 px-1.5 rounded-md border text-[8.5px] font-black uppercase tracking-tight"
                        [ngClass]="theme.mode() === 'light'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'">
                    Aperto
                  </span>
                </div>
                <div>
                  <div class="text-xs font-black leading-tight"
                       [class.text-white]="theme.mode() === 'dark'" [class.text-zinc-900]="theme.mode() === 'light'">
                    Race Bet
                  </div>
                  <div class="text-[9.5px] mt-0.5 font-medium"
                       [class.text-zinc-400]="theme.mode() === 'dark'" [class.text-purple-800]="theme.mode() === 'light'">
                    Pronostico
                  </div>
                </div>
              </a>
            } @else {
              <div
                class="p-2.5 rounded-2xl border flex flex-col justify-between gap-2.5 select-none opacity-60 cursor-not-allowed"
                [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 border-zinc-200/80' : 'bg-zinc-900/40 border-white/5'">
                <div class="flex items-center justify-between">
                  <div class="w-7 h-7 rounded-xl flex items-center justify-center text-xs"
                       [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-800 text-zinc-500'">
                    <i class="fa-solid fa-trophy"></i>
                  </div>
                  <span class="py-0.5 px-1.5 rounded-md text-[8.5px] font-bold uppercase tracking-tight"
                        [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-800 text-zinc-500'">
                    Chiuso
                  </span>
                </div>
                <div>
                  <div class="text-xs font-bold leading-tight" [class.text-zinc-300]="theme.mode() === 'dark'" [class.text-zinc-700]="theme.mode() === 'light'">Race Bet</div>
                  <div class="text-[9.5px] text-zinc-500 mt-0.5">Apre Sabato</div>
                </div>
              </div>
            }
          </div>

          <!-- Scorciatoia Rapida Scheda GP & Orari Weekend -->
          <a
            *ngIf="nextRace"
            [routerLink]="['/race-detail', nextRace.id]"
            (click)="onNavigate()"
            class="w-full mt-2 py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all duration-150 active:scale-[0.99] cursor-pointer no-underline"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
            <div class="flex items-center gap-2">
              <i class="fa-regular fa-calendar-days text-red-500"></i>
              <span>Vedi scheda completa e orari del GP</span>
            </div>
            <i class="fa-solid fa-arrow-right text-[10px] opacity-70"></i>
          </a>
        </div>

        <!-- ──────────────────────────────────────────────
             SEZIONE 2: NAVIGAZIONE & PREFERENZE
        ────────────────────────────────────────────── -->
        <div class="mb-4">
          <span class="text-[10px] font-black uppercase tracking-wider block mb-2"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-600' : 'text-zinc-400'">
            Applicazione & Account
          </span>

          <div class="grid grid-cols-2 gap-2.5">
            <!-- Profilo Utente -->
            <a
              routerLink="/profile"
              routerLinkActive="ring-2 ring-red-500/50"
              (click)="onNavigate()"
              class="group p-3 rounded-2xl border transition-all duration-150 active:scale-98 flex flex-col justify-between gap-2.5 no-underline select-none cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/70 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800/80 text-white shadow-sm'">
              <div class="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center text-sm">
                <i class="fa-solid fa-user"></i>
              </div>
              <div>
                <div class="text-[13px] font-black leading-tight">Profilo</div>
                <div class="text-[10.5px] opacity-60 mt-0.5">Dati personali</div>
              </div>
            </a>

            <!-- Impostazioni -->
            <a
              routerLink="/settings"
              routerLinkActive="ring-2 ring-red-500/50"
              (click)="onNavigate()"
              class="group p-3 rounded-2xl border transition-all duration-150 active:scale-98 flex flex-col justify-between gap-2.5 no-underline select-none cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/70 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800/80 text-white shadow-sm'">
              <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-sm">
                <i class="fa-solid fa-gear"></i>
              </div>
              <div>
                <div class="text-[13px] font-black leading-tight">Impostazioni</div>
                <div class="text-[10.5px] opacity-60 mt-0.5">Notifiche e lingua</div>
              </div>
            </a>

            <!-- Scomposizione Punteggi & Classifica Gare -->
            <a
              routerLink="/standings-breakdown"
              [queryParams]="{ tab: 'breakdown' }"
              (click)="onNavigate()"
              class="group p-3 rounded-2xl border transition-all duration-150 active:scale-98 flex flex-col justify-between gap-2.5 no-underline select-none cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/70 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800/80 text-white shadow-sm'">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <div>
                <div class="text-[13px] font-black leading-tight">Analisi Punteggi</div>
                <div class="text-[10.5px] opacity-60 mt-0.5">Trend & scomposizione</div>
              </div>
            </a>

            <!-- Risultati MotoGP Reale -->
            <a
              routerLink="/motogp-results"
              routerLinkActive="ring-2 ring-red-500/50"
              (click)="onNavigate()"
              class="group p-3 rounded-2xl border transition-all duration-150 active:scale-98 flex flex-col justify-between gap-2.5 no-underline select-none cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/70 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800/80 text-white shadow-sm'">
              <div class="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center text-sm">
                <i class="fa-solid fa-flag-checkered"></i>
              </div>
              <div>
                <div class="text-[13px] font-black leading-tight">Risultati MotoGP</div>
                <div class="text-[10.5px] opacity-60 mt-0.5">Sessioni & gare reali</div>
              </div>
            </a>

            <!-- Toggle Tema (Chiaro / Scuro) -->
            <button
              type="button"
              (click)="onToggleTheme()"
              class="group p-3 rounded-2xl border transition-all duration-150 active:scale-98 flex flex-col justify-between gap-2.5 text-left select-none cursor-pointer col-span-2"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100/70 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/60 border-white/5 hover:bg-zinc-800/80 text-white shadow-sm'">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                  [ngClass]="theme.mode() === 'light' ? 'bg-amber-500/15 text-amber-500' : 'bg-indigo-500/15 text-indigo-400'">
                  <i class="fa-solid" [class.fa-sun]="theme.mode() === 'light'" [class.fa-moon]="theme.mode() === 'dark'"></i>
                </div>
                <div>
                  <div class="text-[13px] font-black leading-tight">
                    Tema {{ theme.mode() === 'light' ? 'Chiaro' : 'Scuro' }}
                  </div>
                  <div class="text-[10.5px] opacity-60 mt-0.5">Tocca per cambiare modalità visiva</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- ──────────────────────────────────────────────
             SEZIONE 3: AMMINISTRAZIONE (ADMIN ONLY)
        ────────────────────────────────────────────── -->
        @if (isAdmin) {
          <div class="mb-4">
            <span class="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-2">
              Gestione Campionato
            </span>

            <div class="grid grid-cols-2 gap-2.5">
              <!-- Pannello Admin -->
              <a
                routerLink="/admin"
                routerLinkActive="ring-2 ring-purple-500/50"
                (click)="onNavigate()"
                class="group p-3 rounded-2xl border transition-all duration-150 active:scale-98 flex flex-col justify-between gap-2.5 no-underline select-none cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-purple-50/60 border-purple-200 hover:bg-purple-100/60 text-zinc-900 shadow-sm'
                  : 'bg-purple-950/20 border-purple-500/20 hover:bg-purple-950/40 text-white shadow-sm'">
                <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div>
                  <div class="text-[13px] font-black leading-tight">Pannello Admin</div>
                  <div class="text-[10.5px] opacity-60 mt-0.5">Gare e punteggi</div>
                </div>
              </a>

              <!-- Traduzioni -->
              <a
                routerLink="/translation"
                routerLinkActive="ring-2 ring-purple-500/50"
                (click)="onNavigate()"
                class="group p-3 rounded-2xl border transition-all duration-150 active:scale-98 flex flex-col justify-between gap-2.5 no-underline select-none cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-purple-50/60 border-purple-200 hover:bg-purple-100/60 text-zinc-900 shadow-sm'
                  : 'bg-purple-950/20 border-purple-500/20 hover:bg-purple-950/40 text-white shadow-sm'">
                <div class="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">
                  <i class="fa-solid fa-language"></i>
                </div>
                <div>
                  <div class="text-[13px] font-black leading-tight">Traduzioni</div>
                  <div class="text-[10.5px] opacity-60 mt-0.5">Dizionario app</div>
                </div>
              </a>
            </div>
          </div>
        }

        <!-- ──────────────────────────────────────────────
             SEZIONE 4: DISCONNESSIONE
        ────────────────────────────────────────────── -->
        <button
          type="button"
          (click)="onLogout()"
          class="w-full mt-1 p-3 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          [ngClass]="theme.mode() === 'light'
            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100/70'
            : 'border-red-500/20 bg-red-600/10 text-red-500 hover:bg-red-600/15'">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Disconnetti Account</span>
        </button>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes sheetSlideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes backdropFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalScaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .sheet-modal {
      animation: sheetSlideUp 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @media (min-width: 768px) {
      .sheet-modal {
        animation: modalScaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    }
    .sheet-backdrop {
      animation: backdropFadeIn 200ms ease-out forwards;
    }
  `]
})
export class MoreSheetComponent implements OnInit, OnChanges, OnDestroy {
  ngOnDestroy(): void { if (this.sessionTimerInterval) clearInterval(this.sessionTimerInterval); }
  isDragging = false;
  dragTranslateY = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private canDragDown = false;

  sessionRemainingText = '';
  sessionRenewing = false;
  sessionRenewSuccess = false;
  private sessionTimerInterval: any = null;

  onTouchStart(e: TouchEvent): void {
    const sheetEl = e.currentTarget as HTMLElement;
    if (!sheetEl || sheetEl.scrollTop <= 2) {
      this.canDragDown = true;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
      this.isDragging = true;
    } else {
      this.canDragDown = false;
    }
  }

  onTouchMove(e: TouchEvent): void {
    if (!this.canDragDown) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - this.touchStartY;
    if (deltaY > 0) {
      this.dragTranslateY = deltaY;
    } else {
      this.dragTranslateY = 0;
    }
  }

  onTouchEnd(e: TouchEvent): void {
    if (!this.canDragDown) return;
    const duration = Date.now() - this.touchStartTime;
    const velocity = this.dragTranslateY / Math.max(duration, 1);

    if (this.dragTranslateY > 80 || (velocity > 0.4 && this.dragTranslateY > 30)) {
      this.onClose();
    }
    this.isDragging = false;
    this.dragTranslateY = 0;
    this.canDragDown = false;
  }

  onTouchCancel(): void {
    this.isDragging = false;
    this.dragTranslateY = 0;
    this.canDragDown = false;
  }

  private startSessionTimer(): void {
    this.updateSessionTimer();
    if (this.sessionTimerInterval) clearInterval(this.sessionTimerInterval);
    this.sessionTimerInterval = setInterval(() => this.updateSessionTimer(), 1000);
  }

  private updateSessionTimer(): void {
    const sec = this.authService.getRemainingSessionSeconds();
    this.sessionRemainingText = this.authService.formatRemainingTime(sec);
  }

  onRenewSession(): void {
    this.sessionRenewing = true;
    this.haptic.light();
    this.authService.refreshToken().subscribe({
      next: () => {
        this.sessionRenewing = false;
        this.sessionRenewSuccess = true;
        this.updateSessionTimer();
        setTimeout(() => this.sessionRenewSuccess = false, 3000);
      },
      error: () => {
        this.sessionRenewing = false;
      }
    });
  }

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  public theme = inject(ThemeService);
  private haptic = inject(HapticService);
  private dashboardService = inject(DashboardService);
  private championshipService = inject(ChampionshipService);
  private raceScheduleService = inject(RaceScheduleService);

  userInfo?: UserInfo;
  champId = 0;
  champConfig?: ChampionshipConfig;
  nextRace?: CalendarRace;

  canLineup = false;
  canSprint = false;
  canRace = false;
  loadingRace = false;

  ngOnInit(): void {
    this.startSessionTimer();
    this.authService.getUserInfo().subscribe({
      next: (info) => { this.userInfo = info; },
      error: () => {}
    });

    this.championshipService.getChampIdObs().subscribe(id => {
      if (id > 0) {
        this.champId = id;
        this.refreshNextRace();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.refreshNextRace();
    }
  }

  private refreshNextRace(): void {
    if (!this.champId) return;
    this.loadingRace = true;
    this.dashboardService.getNextRace(this.champId).subscribe({
      next: (race) => {
        this.nextRace = race;
        this.loadingRace = false;
        this.checkWindows();
      },
      error: () => {
        this.nextRace = undefined;
        this.loadingRace = false;
        this.canLineup = false;
        this.canSprint = false;
        this.canRace = false;
      }
    });

    if (!this.champConfig) {
      this.championshipService.getChampionshipConfig(this.champId).subscribe({
        next: (cfg) => {
          this.champConfig = cfg;
          this.checkWindows();
        }
      });
    }
  }

  private checkWindows(): void {
    if (!this.nextRace || this.nextRace.cancelled) {
      this.canLineup = false;
      this.canSprint = false;
      this.canRace = false;
      return;
    }
    const tz = this.champConfig?.timezone;
    this.canLineup = this.raceScheduleService.canShowLineups(this.nextRace, tz);
    this.canSprint = this.raceScheduleService.canShowSprintBet(this.nextRace, tz);
    this.canRace = this.raceScheduleService.canShowRaceBet(this.nextRace, tz);
  }

  get canAnyShortcut(): boolean {
    return this.canLineup || this.canSprint || this.canRace;
  }

  get userDisplayName(): string {
    if (this.userInfo?.alias) {
      return this.userInfo.alias;
    }
    if (this.userInfo?.first_name) {
      return `${this.userInfo.first_name} ${this.userInfo.last_name || ''}`.trim();
    }
    return this.authService.getUserId() || 'Fanta-Manager';
  }

  get userInitial(): string {
    const name = this.userDisplayName;
    return name.charAt(0).toUpperCase() || 'M';
  }

  get username(): string | null {
    return this.authService.getUserId();
  }

  get isAdmin(): boolean {
    return this.authService.isCurrentUserAdmin();
  }

  onClose(): void {
    this.haptic.light();
    this.close.emit();
  }

  onNavigate(): void {
    this.haptic.light();
    this.close.emit();
  }

  onToggleTheme(): void {
    this.haptic.medium();
    this.theme.toggle();
  }

  onLogout(): void {
    this.haptic.warning();
    this.close.emit();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
