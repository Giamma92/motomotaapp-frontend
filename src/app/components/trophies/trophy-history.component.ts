import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import {
  TrophyService, TrophyHistory, SeasonHistory, TrophyUser, PodiumEntry,
  displayName, trophyCodeForPosition
} from '../../services/trophy.service';
import { TrophyImageComponent } from './trophy-image.component';

@Component({
  selector: 'app-trophy-history',
  standalone: true,
  imports: [CommonModule, RouterLink, TrophyImageComponent],
  template: `
    <div class="min-h-screen pb-36 sm:pb-32 font-sans select-none transition-colors duration-200"
         [ngClass]="light() ? 'bg-[#f4f5f8] text-zinc-900' : 'bg-[#0a0c13] text-white'">

      <!-- Header -->
      <header class="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors px-4 py-3 sm:py-4"
              [ngClass]="light() ? 'bg-white/90 border-zinc-200' : 'bg-[#0f121d]/90 border-white/10'">
        <div class="max-w-2xl mx-auto flex items-center justify-between">
          <button type="button" (click)="goBack()" aria-label="Torna indietro"
                  class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border"
                  [ngClass]="light() ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'">
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div class="text-center">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">• Hall of Fame</span>
            <h1 class="text-base sm:text-lg font-black tracking-tight leading-none mt-0.5">Trophy History</h1>
          </div>
          <a routerLink="/achievements" aria-label="La mia bacheca"
             class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border no-underline"
             [ngClass]="light() ? 'bg-zinc-100 hover:bg-zinc-200 text-amber-600 border-zinc-300' : 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'">
            <i class="fa-solid fa-medal text-sm"></i>
          </a>
        </div>
      </header>

      <main class="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-6">

        <div *ngIf="loading" class="py-16 text-center">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-amber-500"></i>
          <p class="text-xs font-bold text-zinc-400 mt-3">Caricamento bacheca trofei...</p>
        </div>

        <div *ngIf="error && !loading" class="rounded-3xl p-6 border text-center"
             [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-[#141724] border-white/10'">
          <i class="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
          <p class="text-sm font-bold mt-2">Impossibile caricare la Trophy History.</p>
          <button type="button" (click)="load()" class="mt-3 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black cursor-pointer">Riprova</button>
        </div>

        <ng-container *ngIf="!loading && history">

          <!-- ═══ HERO: ultimo campione ═══ -->
          <section *ngIf="lastChampion as champ" class="hero rounded-3xl border relative overflow-hidden shadow-xl"
                   [ngClass]="light() ? 'bg-gradient-to-b from-amber-50 to-white border-amber-200' : 'bg-gradient-to-b from-[#2a1f05] via-[#151208] to-[#0d0f18] border-amber-500/20'">
            <div class="hero__rays" aria-hidden="true"></div>
            <div class="relative flex flex-col items-center text-center px-5 pt-6 pb-6">
              <span class="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500">Campione in carica</span>
              <app-trophy-image class="mt-3" code="season_champion" size="120px" [glow]="true" alt="Coppa del Campione"></app-trophy-image>
              <a [routerLink]="['/achievements', champ.entry.user.id]" class="mt-3 flex items-center gap-2 no-underline"
                 [ngClass]="light() ? 'text-zinc-900' : 'text-white'">
                <img [src]="avatar(champ.entry.user)" (error)="onAvatarError($event)" alt=""
                     class="w-9 h-9 rounded-full object-cover border-2 border-amber-400">
                <span class="text-2xl font-black tracking-tight">{{ name(champ.entry.user) }}</span>
              </a>
              <p class="text-xs font-bold mt-1 opacity-70">Stagione {{ champ.season.championship.year }} • {{ champ.entry.score }} punti • {{ champ.season.participants }} partecipanti</p>
            </div>
          </section>

          <!-- ═══ Stagione in corso ═══ -->
          <section *ngIf="history.current as cur" class="rounded-3xl border p-5 relative overflow-hidden shadow-md"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
            <div class="flex items-start gap-4">
              <app-trophy-image code="season_champion" size="54px" [glow]="!lastChampion" alt="Coppa in palio"></app-trophy-image>
              <div class="flex-1 min-w-0">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/15 text-red-500 border border-red-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Stagione {{ cur.championship.year }} in corso
                </span>
                <h2 class="text-lg font-black tracking-tight mt-1.5 m-0">
                  {{ history.seasons.length ? 'Chi alzerà la prossima coppa?' : 'Chi alzerà la prima coppa della storia?' }}
                </h2>
                <p class="text-[11px] font-semibold opacity-60 m-0 mt-0.5">{{ cur.racesCompleted }}/{{ cur.racesTotal }} gare disputate • {{ cur.participants }} partecipanti</p>
              </div>
            </div>
            <div class="mt-3 h-1.5 rounded-full overflow-hidden" [ngClass]="light() ? 'bg-zinc-200' : 'bg-white/10'">
              <div class="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-300 transition-all"
                   [style.width.%]="cur.racesTotal ? (cur.racesCompleted / cur.racesTotal) * 100 : 0"></div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2 items-end">
              <ng-container *ngFor="let slot of podiumSlots(cur.podium)">
                <a *ngIf="slot" [routerLink]="['/achievements', slot.user.id]"
                   class="podium-step no-underline flex flex-col items-center text-center rounded-2xl border px-2 pt-3 pb-2"
                   [ngClass]="stepClass(slot.position)">
                  <img [src]="avatar(slot.user)" (error)="onAvatarError($event)" alt=""
                       class="w-10 h-10 rounded-full object-cover border-2" [ngClass]="ringClass(slot.position)">
                  <span class="text-[11px] font-black mt-1 truncate max-w-full" [ngClass]="light() ? 'text-zinc-900' : 'text-white'">{{ name(slot.user) }}</span>
                  <span class="text-[10px] font-bold opacity-60" [ngClass]="light() ? 'text-zinc-700' : 'text-zinc-300'">{{ slot.score }} pt</span>
                  <span class="text-lg font-black mt-0.5" [ngClass]="medalText(slot.position)">{{ slot.position }}°</span>
                </a>
                <div *ngIf="!slot"></div>
              </ng-container>
            </div>
            <p class="text-[10px] text-center opacity-50 mt-3 m-0">Podio provvisorio • le coppe vengono assegnate a fine stagione</p>
          </section>

          <!-- ═══ Medagliere ═══ -->
          <section *ngIf="history.medalTable.length" class="rounded-3xl border overflow-hidden shadow-md"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-[#11141f] border-white/10'">
            <div class="px-5 pt-5 pb-3 flex items-center gap-2">
              <i class="fa-solid fa-ranking-star text-amber-500"></i>
              <h2 class="text-sm font-black uppercase tracking-wider m-0">Medagliere</h2>
            </div>
            <div class="grid grid-cols-[28px_1fr_36px_36px_36px_44px] items-center gap-1 px-5 pb-2 text-[10px] font-black uppercase tracking-wider opacity-50">
              <span>#</span><span>Manager</span>
              <span class="text-center">🥇</span><span class="text-center">🥈</span><span class="text-center">🥉</span><span class="text-center">Stag.</span>
            </div>
            <a *ngFor="let row of history.medalTable; let i = index" [routerLink]="['/achievements', row.user.id]"
               class="grid grid-cols-[28px_1fr_36px_36px_36px_44px] items-center gap-1 px-5 py-2.5 border-t no-underline transition"
               [ngClass]="[light() ? 'border-zinc-100 hover:bg-zinc-50 text-zinc-900' : 'border-white/5 hover:bg-white/5 text-white', isMe(row.user) ? (light() ? 'bg-amber-50' : 'bg-amber-500/10') : '']">
              <span class="text-xs font-black opacity-60">{{ i + 1 }}</span>
              <span class="flex items-center gap-2 min-w-0">
                <img [src]="avatar(row.user)" (error)="onAvatarError($event)" alt="" class="w-7 h-7 rounded-full object-cover shrink-0">
                <span class="text-[13px] font-bold truncate">{{ name(row.user) }}</span>
              </span>
              <span class="text-center text-sm font-black" [class.opacity-30]="!row.gold">{{ row.gold }}</span>
              <span class="text-center text-sm font-black" [class.opacity-30]="!row.silver">{{ row.silver }}</span>
              <span class="text-center text-sm font-black" [class.opacity-30]="!row.bronze">{{ row.bronze }}</span>
              <span class="text-center text-xs font-bold opacity-70">{{ row.seasons }}</span>
            </a>
          </section>

          <!-- ═══ Albo d'oro per anno ═══ -->
          <section *ngIf="history.seasons.length" class="flex flex-col gap-4">
            <div class="flex items-center gap-2 px-1">
              <i class="fa-solid fa-timeline text-amber-500"></i>
              <h2 class="text-sm font-black uppercase tracking-wider m-0">Albo d'oro</h2>
            </div>

            <article *ngFor="let season of history.seasons" class="rounded-3xl border overflow-hidden shadow-md"
                     [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
              <div class="flex items-center justify-between px-5 pt-4">
                <div>
                  <div class="text-3xl font-black tracking-tighter leading-none year-text">{{ season.championship.year }}</div>
                  <div class="text-[11px] font-semibold opacity-60 mt-1">{{ season.participants }} partecipanti</div>
                </div>
                <span class="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border"
                      [ngClass]="light() ? 'border-zinc-200 text-zinc-500' : 'border-white/10 text-zinc-400'">
                  <i class="fa-solid fa-flag-checkered mr-1"></i>Conclusa
                </span>
              </div>

              <!-- Podio con coppe -->
              <div class="grid grid-cols-3 gap-2 items-end px-4 pt-3">
                <ng-container *ngFor="let slot of podiumSlots(season.podium)">
                  <a *ngIf="slot" [routerLink]="['/achievements', slot.user.id]" class="flex flex-col items-center text-center no-underline"
                     [ngClass]="light() ? 'text-zinc-900' : 'text-white'">
                    <app-trophy-image [code]="code(slot.position)" [size]="slot.position === 1 ? '64px' : '46px'"
                                      [glow]="slot.position === 1" [alt]="'Trofeo ' + slot.position + '° posto'"></app-trophy-image>
                    <div class="w-full rounded-t-2xl mt-2 pt-2 pb-2 px-1 border-x border-t" [ngClass]="stepClass(slot.position)">
                      <img [src]="avatar(slot.user)" (error)="onAvatarError($event)" alt=""
                           class="w-8 h-8 rounded-full object-cover border-2 mx-auto" [ngClass]="ringClass(slot.position)">
                      <div class="text-[11px] font-black mt-1 truncate">{{ name(slot.user) }}</div>
                      <div class="text-[10px] font-bold opacity-60">{{ slot.score }} pt</div>
                    </div>
                  </a>
                  <div *ngIf="!slot"></div>
                </ng-container>
              </div>

              <!-- Premi speciali -->
              <div *ngIf="season.specials.length" class="px-5 pt-3 flex flex-wrap gap-2">
                <span *ngFor="let sp of season.specials" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <i class="fa-solid fa-award"></i> {{ sp.title }} • {{ name(sp.user) }}
                </span>
              </div>

              <!-- Classifica completa -->
              <button type="button" (click)="toggle(season)"
                      class="w-full mt-3 px-5 py-3 border-t flex items-center justify-between text-xs font-black cursor-pointer"
                      [ngClass]="light() ? 'border-zinc-100 text-zinc-600 hover:bg-zinc-50' : 'border-white/5 text-zinc-300 hover:bg-white/5'">
                <span>Classifica finale</span>
                <i class="fa-solid" [ngClass]="expanded.has(season.championship.id) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </button>
              <div *ngIf="expanded.has(season.championship.id)" class="pb-2">
                <a *ngFor="let row of season.standings" [routerLink]="['/achievements', row.user.id]"
                   class="flex items-center gap-3 px-5 py-2 no-underline"
                   [ngClass]="light() ? 'text-zinc-900' : 'text-white'">
                  <span class="w-6 text-xs font-black" [ngClass]="medalText(row.position)">{{ row.position }}°</span>
                  <img [src]="avatar(row.user)" (error)="onAvatarError($event)" alt="" class="w-6 h-6 rounded-full object-cover">
                  <span class="flex-1 text-[13px] font-bold truncate">{{ name(row.user) }}</span>
                  <span class="text-xs font-black opacity-70">{{ row.score }} pt</span>
                </a>
              </div>
            </article>
          </section>

          <!-- Empty state -->
          <section *ngIf="!history.seasons.length && !history.current" class="rounded-3xl border p-8 text-center"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-[#141724] border-white/10'">
            <app-trophy-image code="season_champion" size="70px" [locked]="true"></app-trophy-image>
            <p class="text-sm font-bold mt-3">Nessun trofeo ancora assegnato.</p>
          </section>

          <p class="text-[10px] text-center opacity-40 m-0">La storia dei trofei parte dalla stagione {{ history.firstYear }}</p>
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    .hero__rays { position: absolute; inset: -40%; opacity: .25; pointer-events: none;
      background: repeating-conic-gradient(from 0deg at 50% 45%, rgba(255,200,60,.35) 0deg 6deg, transparent 6deg 18deg);
      animation: rays 40s linear infinite; mask-image: radial-gradient(circle at 50% 45%, #000 0%, transparent 55%);
      -webkit-mask-image: radial-gradient(circle at 50% 45%, #000 0%, transparent 55%); }
    @keyframes rays { to { transform: rotate(360deg); } }
    .year-text { background: linear-gradient(180deg, #ffd76a, #c98a12); -webkit-background-clip: text; background-clip: text; color: transparent; }
    @media (prefers-reduced-motion: reduce) { .hero__rays { animation: none; } }
  `]
})
export class TrophyHistoryComponent implements OnInit {
  public theme = inject(ThemeService);
  private trophyService = inject(TrophyService);
  private navService = inject(NavigationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  history: TrophyHistory | null = null;
  loading = true;
  error = false;
  expanded = new Set<number>();
  private myId = this.authService.getUserId();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.trophyService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  get lastChampion(): { season: SeasonHistory; entry: PodiumEntry } | null {
    const season = this.history?.seasons?.[0];
    const entry = season?.podium.find((p) => p.position === 1);
    return season && entry ? { season, entry } : null;
  }

  light(): boolean {
    return this.theme.mode() === 'light';
  }

  /** Returns podium ordered 2nd - 1st - 3rd for the classic podium layout. */
  podiumSlots(podium: PodiumEntry[]): (PodiumEntry | null)[] {
    const first = podium.find((p) => p.position === 1) || null;
    const second = podium.find((p) => p.position === 2) || null;
    const third = podium.find((p) => p.position === 3) || null;
    return [second, first, third];
  }

  code(position: number) {
    return trophyCodeForPosition(position);
  }

  name(user: TrophyUser): string {
    return displayName(user);
  }

  avatar(user: TrophyUser): string {
    return user?.profile_image || '/assets/images/manager-placeholder.svg';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/assets/images/manager-placeholder.svg';
  }

  isMe(user: TrophyUser): boolean {
    return !!this.myId && user?.id === this.myId;
  }

  toggle(season: SeasonHistory): void {
    const id = season.championship.id;
    this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
  }

  stepClass(position: number): string {
    const light = this.light();
    if (position === 1) return light ? 'bg-amber-50 border-amber-300 pb-5' : 'bg-amber-500/10 border-amber-400/30 pb-5';
    if (position === 2) return light ? 'bg-zinc-50 border-zinc-300 pb-3' : 'bg-zinc-300/5 border-zinc-300/20 pb-3';
    return light ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/5 border-orange-400/20';
  }

  ringClass(position: number): string {
    return position === 1 ? 'border-amber-400' : position === 2 ? 'border-zinc-300' : 'border-orange-400';
  }

  medalText(position: number): string {
    return position === 1 ? 'text-amber-500' : position === 2 ? 'text-zinc-400' : position === 3 ? 'text-orange-500' : 'opacity-60';
  }

  goBack(): void {
    this.navService.back('/');
  }
}
