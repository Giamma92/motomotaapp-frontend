import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TROPHY_IMAGES, TrophyCode } from '../../services/trophy.service';

/**
 * Renders a trophy image with an animated metallic sheen (masked on the
 * trophy silhouette) and an optional glow. Locked trophies are greyed out.
 */
@Component({
  selector: 'app-trophy-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trophy" [class.trophy--locked]="locked" [class.trophy--glow]="glow && !locked"
         [ngClass]="'trophy--' + tier()" [style.width]="size" [style.height]="height()">
      <span class="trophy__halo" aria-hidden="true"></span>
      <img [src]="src()" [alt]="alt" loading="lazy" decoding="async" draggable="false" />
      <span *ngIf="!locked && shine" class="trophy__shine" aria-hidden="true"
            [ngStyle]="{ 'mask-image': maskUrl(), '-webkit-mask-image': maskUrl() }"></span>
    </div>
  `,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    .trophy { position: relative; display: inline-flex; align-items: flex-end; justify-content: center; }
    .trophy img { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: contain; user-select: none;
      filter: drop-shadow(0 10px 18px rgba(0,0,0,.35)); }
    .trophy__halo { position: absolute; inset: 8% -10% 18% -10%; border-radius: 50%; opacity: 0; z-index: 0;
      filter: blur(22px); transition: opacity .3s; }
    .trophy--glow .trophy__halo { opacity: .55; animation: halo 3.2s ease-in-out infinite; }
    .trophy--gold .trophy__halo { background: radial-gradient(circle, #ffd54a 0%, rgba(255,170,0,0) 70%); }
    .trophy--silver .trophy__halo { background: radial-gradient(circle, #e8edf5 0%, rgba(180,190,210,0) 70%); }
    .trophy--bronze .trophy__halo { background: radial-gradient(circle, #f0a36b 0%, rgba(205,120,60,0) 70%); }
    .trophy__shine { position: absolute; inset: 0; z-index: 2; pointer-events: none;
      mask-size: contain; mask-repeat: no-repeat; mask-position: center bottom;
      -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center bottom;
      background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,.75) 48%, transparent 60%);
      background-size: 250% 100%; background-position: 150% 0; mix-blend-mode: soft-light;
      animation: shine 4.5s ease-in-out infinite; }
    .trophy--locked img { filter: grayscale(1) brightness(.45) contrast(.9); opacity: .55; }
    @keyframes shine { 0%, 55% { background-position: 150% 0; } 100% { background-position: -60% 0; } }
    @keyframes halo { 0%, 100% { transform: scale(.95); opacity: .4; } 50% { transform: scale(1.05); opacity: .7; } }
    @media (prefers-reduced-motion: reduce) { .trophy__shine, .trophy__halo { animation: none !important; } }
  `]
})
export class TrophyImageComponent {
  private codeSignal = signal<Exclude<TrophyCode, 'special'>>('season_champion');

  @Input() set code(value: TrophyCode | null | undefined) {
    this.codeSignal.set(value && value !== 'special' ? value : 'season_champion');
  }
  /** CSS width, e.g. "96px" or "100%". Height keeps the trophy aspect ratio. */
  @Input() size = '96px';
  @Input() alt = 'Trofeo';
  @Input() locked = false;
  @Input() glow = false;
  @Input() shine = true;

  src = computed(() => TROPHY_IMAGES[this.codeSignal()]);
  maskUrl = computed(() => `url(${this.src()})`);
  tier = computed(() => ({ season_champion: 'gold', season_runner_up: 'silver', season_third: 'bronze' }[this.codeSignal()]));

  height(): string {
    const match = /^(\d+(?:\.\d+)?)px$/.exec(this.size);
    return match ? `${Math.round(Number(match[1]) * 1.8)}px` : 'auto';
  }
}
