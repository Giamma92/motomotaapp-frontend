import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { NavigationService } from '../../services/navigation.service';
import { AuthService } from '../../services/auth.service';
import {
  TrophyService, Achievements, UserTrophy, UserSeason, Badge,
  displayName, trophyCodeForPosition
} from '../../services/trophy.service';
import { TrophyImageComponent } from '../trophies/trophy-image.component';

@Component({
  selector: 'app-achievements',
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
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 block">• Bacheca Personale</span>
            <h1 class="text-base sm:text-lg font-black tracking-tight leading-none mt-0.5">Achievements</h1>
          </div>
          <a routerLink="/trophies" aria-label="Trophy History"
             class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border no-underline"
             [ngClass]="light() ? 'bg-zinc-100 hover:bg-zinc-200 text-amber-600 border-zinc-300' : 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'">
            <i class="fa-solid fa-trophy text-sm"></i>
          </a>
        </div>
      </header>

      <main class="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-6">

        <!-- Loading -->
        <div *ngIf="loading" class="py-16 text-center">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-amber-500"></i>
          <p class="text-xs font-bold text-zinc-400 mt-3">Caricamento achievements...</p>
        </div>

        <!-- Error -->
        <div *ngIf="error && !loading" class="rounded-3xl p-6 border text-center"
             [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-[#141724] border-white/10'">
          <i class="fa-solid fa-triangle-exclamation text-2xl text-red-500"></i>
          <p class="text-sm font-bold mt-2">Impossibile caricare gli achievements.</p>
          <button type="button" (click)="load()" class="mt-3 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black cursor-pointer">Riprova</button>
        </div>

        <ng-container *ngIf="!loading && data">

          <!-- ════ CARD 1: HERO USER & MEDAGLIERE ════ -->
          <section class="rounded-3xl p-5 sm:p-6 border relative overflow-hidden transition-all shadow-md"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
            <div class="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 flex items-center justify-center shadow-xl ring-4"
                   [ngClass]="light() ? 'bg-zinc-100 border-amber-500 ring-amber-500/15' : 'bg-zinc-900 border-amber-500 ring-amber-500/25'">
                <img [src]="avatar()" (error)="onAvatarError($event)" alt="Foto Profilo" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 min-w-0">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/20">
                  <i class="fa-solid fa-award"></i> Palmarès Manager
                </span>
                <h2 class="text-xl sm:text-2xl font-black tracking-tight mt-1.5 m-0"
                    [ngClass]="light() ? 'text-zinc-900' : 'text-white'">
                  {{ userName() }}
                </h2>
                <p class="text-xs font-semibold text-zinc-400 mt-0.5 m-0">&#64;{{ data.user.id }}</p>

                <!-- Medaglie conteggio -->
                <div class="flex items-center justify-center sm:justify-start gap-4 mt-3">
                  <div class="flex items-center gap-1.5" title="Coppe del Campione (1° posto)">
                    <span class="text-base">🥇</span>
                    <span class="text-sm font-black">{{ data.counts.gold }}</span>
                  </div>
                  <div class="flex items-center gap-1.5" title="2° posto">
                    <span class="text-base">🥈</span>
                    <span class="text-sm font-black">{{ data.counts.silver }}</span>
                  </div>
                  <div class="flex items-center gap-1.5" title="3° posto">
                    <span class="text-base">🥉</span>
                    <span class="text-sm font-black">{{ data.counts.bronze }}</span>
                  </div>
                  <div *ngIf="data.counts.specials" class="flex items-center gap-1.5" title="Premi speciali">
                    <span class="text-base">🎖️</span>
                    <span class="text-sm font-black">{{ data.counts.specials }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ════ CARD 2: BACHECA DEI TROFEI (SCAFFALE) ════ -->
          <section class="rounded-3xl p-5 border relative overflow-hidden shadow-md"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-trophy text-amber-500"></i>
                <h3 class="text-sm font-black uppercase tracking-wider m-0">Bacheca Coppe</h3>
              </div>
              <span class="text-[11px] font-bold opacity-60">{{ totalTrophies() }} {{ totalTrophies() === 1 ? 'trofeo' : 'trofei' }}</span>
            </div>

            <!-- Scaffale con coppe vinte -->
            <div *ngIf="data.trophies.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div *ngFor="let tr of data.trophies" class="shelf-item p-3 rounded-2xl border flex flex-col items-center text-center relative"
                   [ngClass]="shelfClass(tr.trophy_code)">
                <app-trophy-image [code]="tr.trophy_code" size="64px" [glow]="tr.trophy_code === 'season_champion'" [alt]="tr.title || 'Coppa'"></app-trophy-image>
                <div class="text-xs font-black mt-2 leading-tight">{{ trophyTitle(tr) }}</div>
                <div class="text-[10px] font-bold opacity-60 mt-0.5">Stagione {{ tr.year || '2026' }}</div>
                <div *ngIf="tr.score != null" class="text-[10px] font-semibold text-amber-500 mt-0.5">{{ tr.score }} pt</div>
              </div>
            </div>

            <!-- Empty Shelf -->
            <div *ngIf="!data.trophies.length" class="py-8 text-center flex flex-col items-center">
              <div class="flex gap-2 opacity-30 filter grayscale">
                <app-trophy-image code="season_runner_up" size="40px" [locked]="true"></app-trophy-image>
                <app-trophy-image code="season_champion" size="52px" [locked]="true"></app-trophy-image>
                <app-trophy-image code="season_third" size="40px" [locked]="true"></app-trophy-image>
              </div>
              <p class="text-xs font-bold text-zinc-400 mt-3 m-0">Nessuna coppa ancora in bacheca.</p>
              <p class="text-[11px] opacity-60 m-0 mt-0.5">I trofei vengono assegnati a fine campionato!</p>
            </div>
          </section>

          <!-- ════ CARD 3: BADGES & SPECIALITÀ ════ -->
          <section class="rounded-3xl p-5 border relative overflow-hidden shadow-md"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-shapes text-amber-500"></i>
                <h3 class="text-sm font-black uppercase tracking-wider m-0">Specialità & Traguardi</h3>
              </div>

              <!-- Switcher Tab: Stagione vs Carriera -->
              <div class="inline-flex p-1 rounded-xl border self-start sm:self-auto"
                   [ngClass]="light() ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-white/10'">
                <button
                  type="button"
                  (click)="activeBadgeTab = 'season'"
                  class="px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer select-none"
                  [ngClass]="activeBadgeTab === 'season'
                    ? (light() ? 'bg-white text-zinc-900 shadow-sm' : 'bg-zinc-800 text-white shadow')
                    : 'text-zinc-400 hover:text-zinc-200'">
                  <i class="fa-solid fa-flag-checkered mr-1"></i> Stagione {{ data.currentYear || 2026 }}
                </button>
                <button
                  type="button"
                  (click)="activeBadgeTab = 'career'"
                  class="px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer select-none"
                  [ngClass]="activeBadgeTab === 'career'
                    ? (light() ? 'bg-white text-zinc-900 shadow-sm' : 'bg-zinc-800 text-white shadow')
                    : 'text-zinc-400 hover:text-zinc-200'">
                  <i class="fa-solid fa-globe mr-1"></i> Carriera Globale
                </button>
              </div>
            </div>

            <!-- Griglia Badge -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div *ngFor="let b of currentBadges()" class="p-3 rounded-2xl border flex items-center gap-3"
                   [ngClass]="b.level > 0 ? (light() ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10') : (light() ? 'bg-zinc-100/50 border-zinc-200/50 opacity-50' : 'bg-white/2 border-white/5 opacity-40')">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 border"
                     [ngClass]="badgeIconClass(b.level)">
                  <i class="fa-solid" [ngClass]="b.icon"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-black truncate">{{ b.name || badgeName(b.code) }}</span>
                    <span class="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded"
                          [ngClass]="badgeLevelClass(b.level)">
                      {{ badgeLevelName(b.level) }}
                    </span>
                  </div>
                  <p class="text-[10.5px] opacity-60 m-0 leading-tight mt-0.5">{{ b.desc || badgeDesc(b.code) }}</p>
                  <!-- Progress bar assoluta -->
                  <div class="mt-1.5 flex items-center gap-2">
                    <div class="flex-1 h-1 rounded-full overflow-hidden" [ngClass]="light() ? 'bg-zinc-200' : 'bg-white/10'">
                      <div class="h-full rounded-full transition-all" [ngClass]="badgeBarClass(b.level)"
                           [style.width.%]="badgeProgress(b)"></div>
                    </div>
                    <span class="text-[9.5px] font-black opacity-70">{{ b.value }}{{ b.next ? '/' + b.next : (b.level === 3 ? ' (MAX)' : '') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ════ CARD 4: STATISTICHE CARRIERA ════ -->
          <section class="rounded-3xl p-5 border relative overflow-hidden shadow-md"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
            <div class="flex items-center gap-2 mb-4">
              <i class="fa-solid fa-chart-simple text-amber-500"></i>
              <h3 class="text-sm font-black uppercase tracking-wider m-0">Statistiche Carriera</h3>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="p-3 rounded-2xl border text-center" [ngClass]="light() ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'">
                <div class="text-[10px] font-bold uppercase tracking-wider opacity-60">Gare Giocate</div>
                <div class="text-xl font-black mt-1">{{ data.stats.racesPlayed }}</div>
              </div>
              <div class="p-3 rounded-2xl border text-center" [ngClass]="light() ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'">
                <div class="text-[10px] font-bold uppercase tracking-wider opacity-60">Punti Totali</div>
                <div class="text-xl font-black mt-1 text-red-500">{{ data.stats.totalPoints }}</div>
              </div>
              <div class="p-3 rounded-2xl border text-center" [ngClass]="light() ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'">
                <div class="text-[10px] font-bold uppercase tracking-wider opacity-60">Media / Gara</div>
                <div class="text-xl font-black mt-1">{{ data.stats.avgPoints }}</div>
              </div>
              <div class="p-3 rounded-2xl border text-center" [ngClass]="light() ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'">
                <div class="text-[10px] font-bold uppercase tracking-wider opacity-60">Miglior Piazz.</div>
                <div class="text-xl font-black mt-1 text-amber-500">{{ data.stats.bestPosition ? data.stats.bestPosition + '°' : '-' }}</div>
              </div>
            </div>

            <div *ngIf="data.stats.bestRace as br" class="mt-3 p-3 rounded-2xl border flex items-center justify-between"
                 [ngClass]="light() ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-star"></i>
                </div>
                <div>
                  <div class="text-xs font-black">Record punteggio gara</div>
                  <div class="text-[10.5px] opacity-60">{{ br.name || 'Gara' }} {{ br.year || '' }}</div>
                </div>
              </div>
              <span class="text-sm font-black text-amber-500">{{ br.score }} pt</span>
            </div>
          </section>

          <!-- ════ CARD 5: STORICO STAGIONI ════ -->
          <section *ngIf="data.seasons.length" class="rounded-3xl p-5 border relative overflow-hidden shadow-md"
                   [ngClass]="light() ? 'bg-white border-zinc-200' : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
            <div class="flex items-center gap-2 mb-3">
              <i class="fa-solid fa-calendar text-amber-500"></i>
              <h3 class="text-sm font-black uppercase tracking-wider m-0">Partecipazioni Campionati</h3>
            </div>

            <div class="flex flex-col divide-y" [ngClass]="light() ? 'divide-zinc-100' : 'divide-white/5'">
              <div *ngFor="let s of data.seasons" class="py-2.5 flex items-center justify-between">
                <div>
                  <span class="text-xs font-black">{{ s.description || ('Stagione ' + s.year) }}</span>
                  <div class="text-[10.5px] opacity-60">
                    {{ s.completed ? 'Concluso' : 'In corso' }} • {{ s.participants }} partecipanti
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-sm font-black" [ngClass]="posColor(s.position)">{{ s.position }}° posto</span>
                  <div class="text-[10.5px] opacity-60">{{ s.score }} pt</div>
                </div>
              </div>
            </div>
          </section>

        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    .shelf-item { transition: transform .15s ease, box-shadow .15s ease; }
    .shelf-item:active { transform: scale(.98); }
  `]
})
export class AchievementsComponent implements OnInit {
  public theme = inject(ThemeService);
  private trophyService = inject(TrophyService);
  private navService = inject(NavigationService);
  private route = inject(ActivatedRoute);

  data: Achievements | null = null;
  loading = true;
  error = false;
  targetUserId = 'me';
  activeBadgeTab: 'season' | 'career' = 'season';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.targetUserId = params.get('userId') || 'me';
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.trophyService.getAchievements(this.targetUserId).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  light(): boolean {
    return this.theme.mode() === 'light';
  }

  userName(): string {
    return displayName(this.data?.user);
  }

  avatar(): string {
    return this.data?.user?.profile_image || '/assets/images/manager-placeholder.svg';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/assets/images/manager-placeholder.svg';
  }

  totalTrophies(): number {
    if (!this.data) return 0;
    const c = this.data.counts;
    return c.gold + c.silver + c.bronze + c.specials;
  }

  shelfClass(code: string): string {
    const light = this.light();
    if (code === 'season_champion') {
      return light ? 'bg-amber-50/80 border-amber-300' : 'bg-amber-500/10 border-amber-400/30';
    }
    if (code === 'season_runner_up') {
      return light ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-300/5 border-zinc-300/20';
    }
    if (code === 'season_third') {
      return light ? 'bg-orange-50/60 border-orange-200' : 'bg-orange-500/5 border-orange-400/20';
    }
    return light ? 'bg-purple-50 border-purple-200' : 'bg-purple-500/10 border-purple-400/30';
  }

  trophyTitle(tr: UserTrophy): string {
    if (tr.title) return tr.title;
    if (tr.trophy_code === 'season_champion') return 'Campione del Mondo';
    if (tr.trophy_code === 'season_runner_up') return '2° Posto Mondiale';
    if (tr.trophy_code === 'season_third') return '3° Posto Mondiale';
    return 'Premio Speciale';
  }

  badgeName(code: string): string {
    const names: Record<string, string> = {
      champion: 'Campione',
      gp_winner: 'Vincitore GP',
      gp_podium: 'Podio GP',
      pole_man: 'Pole Man',
      sniper: 'Cecchino Bet',
      sprint_king: 'Re della Sprint',
      streak: 'Striscia di Podi',
      leader: 'In Testa al Campionato',
      veteran: 'Veterano'
    };
    return names[code] || code;
  }

  badgeDesc(code: string): string {
    const desc: Record<string, string> = {
      champion: 'Campionati vinti a fine stagione',
      gp_winner: 'Gare vinte come miglior punteggio',
      gp_podium: 'Gare chiuse tra i primi 3',
      pole_man: 'Miglior punteggio qualifiche',
      sniper: 'Miglior punteggio scommessa gara',
      sprint_king: 'Miglior scommessa sprint race',
      streak: 'Podi consecutivi nei GP',
      leader: 'Gare passate al primo posto in classifica',
      veteran: 'Stagioni giocate in MotoMota'
    };
    return desc[code] || '';
  }

  badgeLevelName(level: number): string {
    if (level === 3) return 'Oro';
    if (level === 2) return 'Argento';
    if (level === 1) return 'Bronzo';
    return 'Bloccato';
  }

  badgeLevelClass(level: number): string {
    if (level === 3) return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
    if (level === 2) return 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30';
    if (level === 1) return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    return 'bg-zinc-500/10 text-zinc-500';
  }

  badgeIconClass(level: number): string {
    if (level === 3) return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    if (level === 2) return 'bg-zinc-300/15 text-zinc-300 border-zinc-300/30';
    if (level === 1) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    return 'bg-zinc-500/10 text-zinc-500 border-transparent';
  }

  badgeBarClass(level: number): string {
    if (level === 3) return 'bg-amber-400';
    if (level === 2) return 'bg-zinc-300';
    if (level === 1) return 'bg-orange-400';
    return 'bg-zinc-500';
  }

  currentBadges(): Badge[] {
    if (!this.data) return [];
    if (this.activeBadgeTab === 'season') {
      return this.data.seasonBadges && this.data.seasonBadges.length ? this.data.seasonBadges : this.data.badges;
    }
    return this.data.careerBadges && this.data.careerBadges.length ? this.data.careerBadges : this.data.badges;
  }

  badgeProgress(b: Badge): number {
    if (b.level === 3) return 100;
    const target = b.next || (b.thresholds && b.thresholds.length ? b.thresholds[b.thresholds.length - 1] : 1);
    if (target <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((b.value / target) * 100)));
  }

  posColor(pos: number): string {
    if (pos === 1) return 'text-amber-500';
    if (pos === 2) return 'text-zinc-400';
    if (pos === 3) return 'text-orange-500';
    return '';
  }

  goBack(): void {
    this.navService.back('/');
  }
}
