import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService, UserInfo } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NavigationService } from '../../services/navigation.service';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    LocalizedDatePipe
  ],
  template: `
    <div class="min-h-screen pb-24 font-sans select-none transition-colors duration-200"
         [ngClass]="theme.mode() === 'light' ? 'bg-[#f4f5f8] text-zinc-900' : 'bg-[#0a0c13] text-white'">

      <!-- Header Superiore -->
      <header class="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors px-4 py-3 sm:py-4"
              [ngClass]="theme.mode() === 'light' ? 'bg-white/90 border-zinc-200' : 'bg-[#0f121d]/90 border-white/10'">
        <div class="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            (click)="goBack()"
            class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
              : 'bg-white/5 hover:bg-white/10 text-white border-white/10'"
            aria-label="Torna indietro">
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>

          <div class="text-center">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-red-500 block">
              • MOTOMOTA MANAGER
            </span>
            <h1 class="text-base sm:text-lg font-black tracking-tight leading-none mt-0.5"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              Profilo Manager
            </h1>
          </div>

          <button
            type="button"
            (click)="toggleTheme()"
            class="w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
              : 'bg-white/5 hover:bg-white/10 text-amber-400 border-white/10'"
            title="Cambia tema">
            <i class="fa-solid" [ngClass]="theme.mode() === 'light' ? 'fa-moon text-indigo-600' : 'fa-sun'"></i>
          </button>
        </div>
      </header>

      <!-- Contenuto Profilo -->
      <main class="max-w-2xl mx-auto px-4 py-5 space-y-5">

        <!-- Loading State -->
        <div *ngIf="loading" class="py-16 text-center">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-red-500"></i>
          <p class="text-xs font-bold text-zinc-400 mt-3">Caricamento profilo...</p>
        </div>

        <div *ngIf="!loading && userInfo" class="space-y-5">

          <!-- ════ CARD 1: HERO AVATAR & IDENTITÀ ════ -->
          <section class="rounded-3xl p-5 sm:p-6 border relative overflow-hidden transition-all shadow-md"
                   [ngClass]="theme.mode() === 'light'
                     ? 'bg-white border-zinc-200'
                     : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">
            
            <div class="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <!-- Avatar Circle con Glowing Ring e Pulsante Upload -->
              <div class="relative group">
                <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 flex items-center justify-center shadow-xl ring-4 transition-all"
                     [ngClass]="theme.mode() === 'light'
                       ? 'bg-zinc-100 border-red-500 ring-red-500/15'
                       : 'bg-zinc-900 border-red-600 ring-red-600/30'">
                  <img
                    *ngIf="avatarDraft || userInfo.profile_image"
                    [src]="avatarDraft || userInfo.profile_image"
                    alt="Foto Profilo"
                    (error)="$any($event.target).onerror = null; $any($event.target).src = '/assets/images/manager-placeholder.svg'"
                    class="w-full h-full object-cover">
                  <span *ngIf="!avatarDraft && !userInfo.profile_image"
                        class="text-3xl sm:text-4xl font-black text-red-500">
                    {{ (aliasDraft || userInfo.first_name || userInfo.id || 'M').charAt(0).toUpperCase() }}
                  </span>
                </div>

                <!-- Bottone Camera per File Upload -->
                <button
                  type="button"
                  (click)="fileInput.click()"
                  class="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xs shadow-lg transition active:scale-95 cursor-pointer ring-2 ring-white dark:ring-zinc-900"
                  title="Carica foto personalizzata">
                  <i class="fa-solid fa-camera"></i>
                </button>
                <input
                  #fileInput
                  type="file"
                  accept="image/*"
                  class="hidden"
                  (change)="onFileSelected($event)">
              </div>

              <!-- Dati Principali Manager -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600/15 text-red-500 border border-red-500/20">
                    <i class="fa-solid fa-user-check"></i> Manager Ufficiale
                  </span>
                  <span *ngIf="isAdmin"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <i class="fa-solid fa-shield-halved"></i> Ruolo Admin
                  </span>
                </div>

                <!-- Display Name: Mostra Alias se presente, altrimenti Nome Cognome -->
                <h2 class="text-xl sm:text-2xl font-black tracking-tight mt-1.5 m-0"
                    [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                  {{ aliasDraft || (userInfo.first_name + ' ' + userInfo.last_name) }}
                </h2>
                <p class="text-xs font-semibold text-zinc-400 mt-0.5 m-0">
                  <span *ngIf="aliasDraft" class="font-normal">{{ userInfo.first_name }} {{ userInfo.last_name }} • </span>
                  &#64;{{ userInfo.id }}
                </p>

                <!-- Avatar Preset Veloci -->
                <div class="mt-3.5 flex items-center justify-center sm:justify-start gap-2">
                  <span class="text-[11px] font-bold text-zinc-400">Preset avatar:</span>
                  <button
                    type="button"
                    *ngFor="let p of avatarPresets"
                    (click)="selectPresetAvatar(p.url)"
                    class="w-7 h-7 rounded-full border flex items-center justify-center text-xs transition active:scale-95 cursor-pointer shadow-sm overflow-hidden"
                    [ngClass]="(avatarDraft === p.url || (!avatarDraft && userInfo.profile_image === p.url))
                      ? 'border-red-500 ring-2 ring-red-500/40 scale-105'
                      : 'border-zinc-300 dark:border-white/10 hover:border-red-500/50'"
                    [title]="p.label">
                    <img [src]="p.url" [alt]="p.label" class="w-full h-full object-cover">
                  </button>
                  <button
                    *ngIf="avatarDraft || userInfo.profile_image"
                    type="button"
                    (click)="removeAvatar()"
                    class="text-[11px] font-bold text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                    title="Rimuovi foto">
                    Rimuovi
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ════ CARD 2: MODIFICA DATI PERSONALI ════ -->
          <section class="rounded-3xl p-5 sm:p-6 border transition-all shadow-md"
                   [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200' : 'bg-[#141724] border-white/10'">
            <div class="mb-4">
              <h3 class="text-base font-black tracking-tight m-0 flex items-center gap-2"
                  [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                <span class="w-7 h-7 rounded-lg bg-red-600/15 text-red-500 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-id-card"></i>
                </span>
                Informazioni Manager
              </h3>
              <p class="text-xs mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
                Aggiorna il tuo alias e i tuoi dati visualizzati nelle classifiche e nei podi del campionato.
              </p>
            </div>

            <form (ngSubmit)="onSaveProfile()" class="space-y-4">

              <!-- Campo ALIAS (Nickname) -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                         [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                    <i class="fa-solid fa-tag text-red-500"></i> Alias / Nickname
                  </label>
                  <span class="text-[10px] text-zinc-400">Consigliato</span>
                </div>
                <input
                  type="text"
                  [(ngModel)]="aliasDraft"
                  name="alias"
                  maxlength="30"
                  class="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold outline-none transition"
                  [ngClass]="theme.mode() === 'light'
                    ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                    : 'bg-zinc-900 border-white/10 text-white focus:border-red-500'"
                  placeholder="Es. Il Dottore, SuperGiammy">
                <span class="text-[11px] text-zinc-400 mt-1 block">
                  Se inserito, questo nome sostituirà nome e cognome in tutta l'applicazione (podio, classifiche, cockpit).
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <!-- Nome -->
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                         [ngClass]="theme.mode() === 'light' ? 'text-zinc-600' : 'text-zinc-400'">
                    Nome
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="firstNameDraft"
                    name="firstName"
                    class="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold outline-none transition"
                    [ngClass]="theme.mode() === 'light'
                      ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                      : 'bg-zinc-900 border-white/10 text-white focus:border-red-500'"
                    placeholder="Il tuo nome">
                </div>

                <!-- Cognome -->
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                         [ngClass]="theme.mode() === 'light' ? 'text-zinc-600' : 'text-zinc-400'">
                    Cognome
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="lastNameDraft"
                    name="lastName"
                    class="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold outline-none transition"
                    [ngClass]="theme.mode() === 'light'
                      ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                      : 'bg-zinc-900 border-white/10 text-white focus:border-red-500'"
                    placeholder="Il tuo cognome">
                </div>
              </div>

              <!-- Email (Sola Lettura) -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-xs font-bold uppercase tracking-wider"
                         [ngClass]="theme.mode() === 'light' ? 'text-zinc-600' : 'text-zinc-400'">
                    Email di Accesso
                  </label>
                  <span class="text-[10px] text-zinc-400 flex items-center gap-1">
                    <i class="fa-solid fa-lock text-[9px]"></i> Non modificabile
                  </span>
                </div>
                <input
                  type="email"
                  [value]="userInfo.email"
                  disabled
                  class="w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold opacity-60 cursor-not-allowed"
                  [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-700' : 'bg-zinc-950 border-white/5 text-zinc-400'">
              </div>

              <!-- Bottone Salva -->
              <button
                type="submit"
                [disabled]="saving"
                class="w-full py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2">
                <i *ngIf="saving" class="fa-solid fa-circle-notch fa-spin"></i>
                <i *ngIf="!saving" class="fa-solid fa-check"></i>
                <span>{{ saving ? 'Salvataggio in corso...' : 'Salva Modifiche Profilo' }}</span>
              </button>
            </form>
          </section>

          <!-- ════ CARD 3: STATO ACCOUNT & SICUREZZA ════ -->
          <section class="rounded-3xl p-5 sm:p-6 border transition-all shadow-md"
                   [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200' : 'bg-[#141724] border-white/10'">
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="p-3.5 rounded-2xl border"
                   [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
                <div class="text-[10px] uppercase font-bold text-zinc-400">ID Utente</div>
                <div class="text-sm font-black mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                  {{ userInfo.id }}
                </div>
              </div>

              <div class="p-3.5 rounded-2xl border"
                   [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
                <div class="text-[10px] uppercase font-bold text-zinc-400">Stato Account</div>
                <div class="text-sm font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                  <i class="fa-solid fa-circle-check"></i>
                  <span>Attivo</span>
                </div>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl border"
                 [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
              <div class="text-[10px] uppercase font-bold text-zinc-400">Ultimo Accesso</div>
              <div class="text-xs font-black mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                {{ userInfo.last_access | localizedDate:'datetime' }}
              </div>
            </div>
          </section>

          <!-- ════ CARD 4: AZIONI SICUREZZA & DISCONNESSIONE ════ -->
          <div class="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              (click)="goToResetPassword()"
              class="w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.06]'">
              <i class="fa-solid fa-key text-amber-500"></i>
              <span>Modifica Password</span>
            </button>

            <button
              type="button"
              (click)="logout()"
              class="w-full py-2.5 px-4 rounded-xl border border-red-500/30 hover:bg-red-500/10 text-red-500 font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Esci dall'Account</span>
            </button>
          </div>

        </div>
      </main>

      <!-- ══════════════════════════════════════════════
           MODALE CROPPER INTERATTIVO (ZOOM & SPOSTA)
      ══════════════════════════════════════════════ -->
      <div *ngIf="showCropper"
           class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
           role="dialog"
           aria-modal="true">
        <div class="w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#141724] border-white/10 text-white'">
          
          <div class="text-center mb-4">
            <h3 class="text-base font-black tracking-tight m-0">Regola Foto Profilo</h3>
            <p class="text-xs text-zinc-400 mt-1">Trascina per spostare, usa lo slider per zoomare</p>
          </div>

          <!-- Finestra di Ritaglio Circolare -->
          <div class="relative w-60 h-60 mx-auto rounded-full overflow-hidden border-4 border-red-500 shadow-inner bg-zinc-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
               (mousedown)="startPan($event)"
               (mousemove)="onPan($event)"
               (mouseup)="endPan()"
               (mouseleave)="endPan()"
               (touchstart)="startTouchPan($event)"
               (touchmove)="onTouchPan($event)"
               (touchend)="endPan()">
            
            <img *ngIf="cropperImgSrc"
                 [src]="cropperImgSrc"
                 alt="Anteprima ritaglio"
                 class="max-w-none pointer-events-none transition-transform duration-75"
                 [style.transform]="'translate(' + cropperPanX + 'px, ' + cropperPanY + 'px) scale(' + cropperZoom + ')'"
                 [style.width.px]="cropperBaseWidth"
                 [style.height.px]="cropperBaseHeight">
          </div>

          <!-- Controlli Zoom & Reset -->
          <div class="mt-5 space-y-3">
            <div class="flex items-center gap-3 px-2">
              <button
                type="button"
                (click)="stepZoom(-0.15)"
                class="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition active:scale-95 cursor-pointer"
                [ngClass]="theme.mode() === 'light' ? 'border-zinc-300 text-zinc-700' : 'border-white/10 text-zinc-300'">
                <i class="fa-solid fa-magnifying-glass-minus"></i>
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                [(ngModel)]="cropperZoom"
                class="flex-1 accent-red-600 cursor-pointer">

              <button
                type="button"
                (click)="stepZoom(0.15)"
                class="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition active:scale-95 cursor-pointer"
                [ngClass]="theme.mode() === 'light' ? 'border-zinc-300 text-zinc-700' : 'border-white/10 text-zinc-300'">
                <i class="fa-solid fa-magnifying-glass-plus"></i>
              </button>
            </div>

            <div class="flex items-center justify-between px-2 text-[11px] text-zinc-400">
              <span>Zoom: {{ (cropperZoom * 100).toFixed(0) }}%</span>
              <button
                type="button"
                (click)="resetCrop()"
                class="text-red-500 hover:text-red-400 font-bold cursor-pointer">
                Ricentra
              </button>
            </div>
          </div>

          <!-- Pulsanti di Azione -->
          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="cancelCrop()"
              class="py-2.5 px-4 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                : 'border-white/10 text-zinc-300 hover:bg-white/5'">
              Annulla
            </button>

            <button
              type="button"
              (click)="applyCrop()"
              class="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-check"></i>
              <span>Applica Ritaglio</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class UserInfoComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private navService = inject(NavigationService);
  public theme = inject(ThemeService);
  private snackBar = inject(MatSnackBar);

  userInfo: UserInfo | null = null;
  loading = true;
  saving = false;

  firstNameDraft = '';
  lastNameDraft = '';
  aliasDraft = '';
  avatarDraft: string | null = null;

  // Cropper States
  showCropper = false;
  cropperImgSrc: string | null = null;
  cropperImgElement: HTMLImageElement | null = null;
  cropperZoom = 1;
  cropperPanX = 0;
  cropperPanY = 0;
  cropperBaseWidth = 240;
  cropperBaseHeight = 240;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPanX = 0;
  private initialPanY = 0;

  // MotoGP Themed Preset Avatars
  avatarPresets = [
    { label: 'Ducati Red', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=120&auto=format&fit=crop&q=80' },
    { label: 'Racer Blue', url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=120&auto=format&fit=crop&q=80' },
    { label: 'Speed Yellow', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=120&auto=format&fit=crop&q=80' },
    { label: 'Stealth Carbon', url: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=120&auto=format&fit=crop&q=80' }
  ];

  get isAdmin(): boolean {
    const roles = this.authService.getUserRoles();
    return Array.isArray(roles) && roles.includes('Admin');
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.authService.getUserInfo(true).subscribe({
      next: (data) => {
        this.loading = false;
        this.userInfo = data;
        if (data) {
          this.firstNameDraft = data.first_name || '';
          this.lastNameDraft = data.last_name || '';
          this.aliasDraft = data.alias || '';
          this.avatarDraft = data.profile_image || null;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching user info:', err);
        this.snackBar.open('Errore caricamento profilo', 'Chiudi', { duration: 3000 });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Seleziona un file immagine valido (JPG, PNG, WebP)', 'Chiudi', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        this.cropperImgElement = img;
        this.cropperImgSrc = src;

        // Calculate aspect-fit base dimensions inside 240x240
        const boxSize = 240;
        if (img.width > img.height) {
          this.cropperBaseHeight = boxSize;
          this.cropperBaseWidth = (img.width / img.height) * boxSize;
        } else {
          this.cropperBaseWidth = boxSize;
          this.cropperBaseHeight = (img.height / img.width) * boxSize;
        }

        this.resetCrop();
        this.showCropper = true;
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    // Reset input value so same file can be re-selected
    input.value = '';
  }

  // Pan / Drag Handlers (Mouse & Touch)
  startPan(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialPanX = this.cropperPanX;
    this.initialPanY = this.cropperPanY;
  }

  onPan(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.cropperPanX = this.initialPanX + (event.clientX - this.dragStartX);
    this.cropperPanY = this.initialPanY + (event.clientY - this.dragStartY);
  }

  startTouchPan(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    this.isDragging = true;
    this.dragStartX = event.touches[0].clientX;
    this.dragStartY = event.touches[0].clientY;
    this.initialPanX = this.cropperPanX;
    this.initialPanY = this.cropperPanY;
  }

  onTouchPan(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.cropperPanX = this.initialPanX + (event.touches[0].clientX - this.dragStartX);
    this.cropperPanY = this.initialPanY + (event.touches[0].clientY - this.dragStartY);
  }

  endPan(): void {
    this.isDragging = false;
  }

  stepZoom(delta: number): void {
    this.cropperZoom = Math.min(3, Math.max(1, Number((this.cropperZoom + delta).toFixed(2))));
  }

  resetCrop(): void {
    this.cropperZoom = 1;
    this.cropperPanX = 0;
    this.cropperPanY = 0;
  }

  cancelCrop(): void {
    this.showCropper = false;
    this.cropperImgSrc = null;
    this.cropperImgElement = null;
  }

  applyCrop(): void {
    if (!this.cropperImgElement) return;

    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport is 240x240, target canvas is 256x256
    const scaleFactor = size / 240;

    // Clear and draw with transforms
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    // Translate to center of canvas
    ctx.translate(size / 2, size / 2);
    // Apply pan and zoom
    ctx.translate(this.cropperPanX * scaleFactor, this.cropperPanY * scaleFactor);
    ctx.scale(this.cropperZoom, this.cropperZoom);

    // Draw image centered
    const drawW = this.cropperBaseWidth * scaleFactor;
    const drawH = this.cropperBaseHeight * scaleFactor;
    ctx.drawImage(this.cropperImgElement, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    this.avatarDraft = canvas.toDataURL('image/jpeg', 0.88);
    this.showCropper = false;
    this.snackBar.open('Ritaglio completato! Premi "Salva Modifiche" per confermare.', 'OK', { duration: 3500 });
  }

  selectPresetAvatar(url: string): void {
    this.avatarDraft = url;
  }

  removeAvatar(): void {
    this.avatarDraft = '';
  }

  onSaveProfile(): void {
    this.saving = true;
    const body: { first_name?: string; last_name?: string; alias?: string; profile_image?: string } = {
      first_name: this.firstNameDraft.trim(),
      last_name: this.lastNameDraft.trim(),
      alias: this.aliasDraft.trim(),
      profile_image: this.avatarDraft !== null ? this.avatarDraft : (this.userInfo?.profile_image || '')
    };

    this.authService.updateUserInfo(body).subscribe({
      next: (res) => {
        this.saving = false;
        this.userInfo = res;
        this.aliasDraft = res.alias || '';
        this.snackBar.open('Profilo aggiornato con successo!', 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.saving = false;
        console.error('Error updating profile:', err);
        this.snackBar.open(err?.error?.error || 'Errore nel salvataggio del profilo', 'Chiudi', { duration: 4000 });
      }
    });
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  goToResetPassword(): void {
    this.router.navigate(['/reset-password']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goBack(): void {
    this.navService.back('/');
  }
}
