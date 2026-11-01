import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminDetailedUser } from '../../../services/admin.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="flex flex-col gap-6">

      <!-- Header Informativo & Statistiche Utenti -->
      <div class="rounded-3xl p-5 sm:p-6 border relative overflow-hidden transition-all shadow-md"
           [ngClass]="theme.mode() === 'light'
             ? 'bg-white border-zinc-200'
             : 'bg-gradient-to-b from-[#141724] to-[#0f121e] border-white/10'">

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span class="text-[10px] font-black uppercase tracking-wider text-red-500">
                Sicurezza & Accessi
              </span>
            </div>
            <h2 class="text-lg sm:text-xl font-black tracking-tight leading-tight m-0"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              Gestione Utenti & Reset Password
            </h2>
            <p class="text-xs text-zinc-400 mt-1">
              Visualizza le richieste di reset inviate dagli utenti, abilita il reset e imposta password provvisorie.
            </p>
          </div>

          <!-- Pulsante Ricarica -->
          <button
            type="button"
            (click)="loadUsers()"
            [disabled]="loading"
            class="self-start sm:self-auto px-4 py-2.5 rounded-2xl border text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-2"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
              : 'bg-white/5 hover:bg-white/10 text-white border-white/10'">
            <i class="fa-solid fa-arrows-rotate" [class.fa-spin]="loading"></i>
            <span>Aggiorna Elenco</span>
          </button>
        </div>

        <!-- Metric Counter Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <!-- Totale Utenti -->
          <div class="p-3.5 rounded-2xl border flex items-center justify-between"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <div>
              <div class="text-[10px] uppercase font-bold text-zinc-400">Totale Utenti</div>
              <div class="text-xl font-black mt-0.5" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                {{ users.length }}
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">
              <i class="fa-solid fa-users"></i>
            </div>
          </div>

          <!-- Richieste Reset Pendenti -->
          <div class="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition"
               (click)="selectedFilter = 'requested'"
               [ngClass]="theme.mode() === 'light'
                 ? (pendingRequestsCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-zinc-50 border-zinc-200')
                 : (pendingRequestsCount > 0 ? 'bg-amber-950/20 border-amber-500/30' : 'bg-white/[0.02] border-white/5')">
            <div>
              <div class="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1">
                <i class="fa-solid fa-bell animate-bounce text-[9px]" *ngIf="pendingRequestsCount > 0"></i>
                <span>Richieste Pendenti</span>
              </div>
              <div class="text-xl font-black mt-0.5 text-amber-400">
                {{ pendingRequestsCount }}
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-black">
              <i class="fa-solid fa-key"></i>
            </div>
          </div>

          <!-- Reset Già Abilitati -->
          <div class="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition"
               (click)="selectedFilter = 'enabled'"
               [ngClass]="theme.mode() === 'light'
                 ? (enabledResetsCount > 0 ? 'bg-purple-50 border-purple-300' : 'bg-zinc-50 border-zinc-200')
                 : (enabledResetsCount > 0 ? 'bg-purple-950/20 border-purple-500/30' : 'bg-white/[0.02] border-white/5')">
            <div>
              <div class="text-[10px] uppercase font-bold text-purple-400">Reset Abilitati</div>
              <div class="text-xl font-black mt-0.5 text-purple-400">
                {{ enabledResetsCount }}
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-sm">
              <i class="fa-solid fa-lock-open"></i>
            </div>
          </div>
        </div>

      </div>

      <!-- Barra Filtri & Ricerca -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Input Ricerca -->
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Cerca per nome, alias, username o email..."
            class="w-full pl-9 pr-4 py-2.5 rounded-2xl border text-xs font-bold outline-none transition"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-white border-zinc-300 text-zinc-900 focus:border-red-500 shadow-sm'
              : 'bg-[#141724] border-white/10 text-white focus:border-red-500'">
        </div>

        <!-- Pillole Filtro -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            (click)="selectedFilter = 'all'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap"
            [ngClass]="selectedFilter === 'all'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : (theme.mode() === 'light' ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-white/5 text-zinc-400 hover:bg-white/10')">
            Tutti ({{ users.length }})
          </button>

          <button
            type="button"
            (click)="selectedFilter = 'requested'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1"
            [ngClass]="selectedFilter === 'requested'
              ? 'bg-amber-600 text-white shadow-sm'
              : (theme.mode() === 'light' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-amber-950/30 text-amber-300 hover:bg-amber-950/50')">
            <i class="fa-solid fa-bell text-[10px]"></i>
            Richieste ({{ pendingRequestsCount }})
          </button>

          <button
            type="button"
            (click)="selectedFilter = 'enabled'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1"
            [ngClass]="selectedFilter === 'enabled'
              ? 'bg-purple-600 text-white shadow-sm'
              : (theme.mode() === 'light' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' : 'bg-purple-950/30 text-purple-300 hover:bg-purple-950/50')">
            <i class="fa-solid fa-lock-open text-[10px]"></i>
            Reset Abilitati ({{ enabledResetsCount }})
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="py-16 text-center text-zinc-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-red-500"></i>
        <p class="text-xs font-bold mt-3">Caricamento utenti in corso...</p>
      </div>

      <!-- Nessun Risultato -->
      <div *ngIf="!loading && filteredUsers.length === 0"
           class="py-12 text-center rounded-3xl border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200' : 'bg-[#141724] border-white/5'">
        <i class="fa-solid fa-user-slash text-3xl text-zinc-500 mb-2"></i>
        <p class="text-sm font-bold text-zinc-400">Nessun utente corrisponde ai filtri selezionati</p>
      </div>

      <!-- Griglia Schede Utenti -->
      <div *ngIf="!loading && filteredUsers.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          *ngFor="let user of filteredUsers"
          class="rounded-3xl p-5 border relative overflow-hidden transition-all flex flex-col justify-between"
          [ngClass]="[
            theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141724] border-white/10 shadow-md',
            user.pwd_reset_requested ? 'ring-2 ring-amber-500/50' : '',
            user.pwd_reset === 1 ? 'ring-1 ring-purple-500/40' : ''
          ]">

          <!-- Header Scheda Utente: Avatar + Info Primarie -->
          <div>
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <!-- Avatar -->
                <div class="w-12 h-12 rounded-2xl overflow-hidden border-2 flex items-center justify-center flex-shrink-0"
                     [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-800 border-white/10'">
                  <img
                    *ngIf="user.profile_image"
                    [src]="user.profile_image"
                    alt="Avatar"
                    class="w-full h-full object-cover"
                    (error)="$any($event.target).onerror = null; $any($event.target).src = '/assets/images/manager-placeholder.svg'">
                  <div *ngIf="!user.profile_image" class="text-base font-black text-red-500">
                    {{ (user.first_name || user.id).charAt(0).toUpperCase() }}
                  </div>
                </div>

                <!-- Dati Nome, Alias, Username -->
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h3 class="text-sm sm:text-base font-black tracking-tight leading-tight m-0"
                        [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                      {{ user.first_name }} {{ user.last_name }}
                    </h3>
                    <span *ngIf="user.alias"
                          class="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600/15 text-red-500 border border-red-500/20">
                      {{ user.alias }}
                    </span>
                  </div>
                  <div class="text-xs font-semibold text-zinc-400 mt-0.5">
                    &#64;{{ user.id }} • {{ user.email }}
                  </div>
                </div>
              </div>

              <!-- Badge di Stato Reset -->
              <div>
                <span *ngIf="user.pwd_reset_requested"
                      class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
                  <i class="fa-solid fa-bell text-[9px] animate-pulse"></i>
                  <span>Richiesto</span>
                </span>

                <span *ngIf="!user.pwd_reset_requested && user.pwd_reset === 1"
                      class="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/15 border border-purple-500/40 text-purple-400 flex items-center gap-1.5">
                  <i class="fa-solid fa-lock-open text-[9px]"></i>
                  <span>Abilitato</span>
                </span>

                <span *ngIf="!user.pwd_reset_requested && user.pwd_reset === 0"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <i class="fa-solid fa-circle-check text-[9px]"></i>
                  <span>Regolare</span>
                </span>
              </div>
            </div>

            <!-- Banner Informativo Se Richiesta Pendente -->
            <div *ngIf="user.pwd_reset_requested"
                 class="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
              <i class="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 text-xs"></i>
              <div class="text-xs text-amber-300 leading-snug">
                <strong class="font-black">L'utente ha richiesto il reset della password!</strong>
                <div class="text-[11px] text-amber-400/80 mt-0.5" *ngIf="user.pwd_reset_requested_at">
                  Richiesta inviata il {{ formatDate(user.pwd_reset_requested_at) }}
                </div>
              </div>
            </div>

            <!-- Info Dettaglio (Ultimo accesso) -->
            <div class="mt-3 text-[11px] text-zinc-400 flex items-center gap-1">
              <i class="fa-regular fa-clock text-[10px]"></i>
              <span>Ultimo accesso: {{ user.last_access ? formatDate(user.last_access) : 'Mai' }}</span>
            </div>
          </div>

          <!-- Azioni Amministratore -->
          <div class="mt-5 pt-3 border-t flex flex-col gap-2"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/5'">

            <!-- Pulsante Principale: Abilita Reset Password -->
            <button
              *ngIf="user.pwd_reset === 0"
              type="button"
              (click)="openEnableModal(user)"
              class="w-full py-2.5 px-4 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-md"
              [ngClass]="user.pwd_reset_requested
                ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-amber-500/30'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'">
              <i class="fa-solid fa-key"></i>
              <span>Abilita Reset Password</span>
            </button>

            <!-- Pulsanti per Stato Già Abilitato (pwd_reset == 1) -->
            <div *ngIf="user.pwd_reset === 1" class="flex flex-col sm:flex-row items-center gap-2">
              <div class="text-xs text-purple-400 font-bold flex-1 flex items-center gap-1.5">
                <i class="fa-solid fa-circle-info"></i>
                <span>In attesa che l'utente acceda e imposti la nuova password</span>
              </div>

              <button
                type="button"
                (click)="disableReset(user)"
                [disabled]="actionLoading === user.id"
                class="w-full sm:w-auto py-2 px-3 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
                <i class="fa-solid fa-ban text-xs text-red-400"></i>
                <span>Revoca Reset</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      <!-- ==========================================
           MODALE DI CONFERMA ABILITAZIONE RESET
      ========================================== -->
      <div *ngIf="selectedUserForReset"
           class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#141724] border-white/15 text-white'">

          <!-- Titolo Modale -->
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-lg flex-shrink-0">
              <i class="fa-solid fa-key"></i>
            </div>
            <div>
              <h3 class="text-base font-black m-0 leading-tight">Abilita Reset Password</h3>
              <p class="text-xs text-zinc-400 mt-0.5">
                Utente: <strong class="text-red-500">{{ selectedUserForReset.first_name }} {{ selectedUserForReset.last_name }} (&#64;{{ selectedUserForReset.id }})</strong>
              </p>
            </div>
          </div>

          <p class="text-xs text-zinc-400 leading-relaxed mb-4">
            Abilitando il reset, <strong>al successivo login l'utente sarà obbligato a impostare una nuova password</strong> prima di poter utilizzare l'applicazione.
          </p>

          <!-- Opzione Password Temporanea -->
          <div class="p-3.5 rounded-2xl border mb-5 flex flex-col gap-2.5"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
            <label class="flex items-center gap-2 cursor-pointer text-xs font-bold">
              <input type="checkbox" [(ngModel)]="setTemporaryPassword" class="accent-red-600 rounded">
              <span>Imposta una password provvisoria per l'accesso</span>
            </label>

            <div *ngIf="setTemporaryPassword" class="pt-1">
              <label class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Password Temporanea
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="temporaryPasswordInput"
                  class="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none"
                  [ngClass]="theme.mode() === 'light'
                    ? 'bg-white border-zinc-300 text-zinc-900'
                    : 'bg-zinc-900 border-white/10 text-white'"
                  placeholder="Es. motomota2026">
              </div>
              <span class="text-[10px] text-zinc-400 mt-1 block">
                Comunica questa password all'utente. Al primo login con questa password gli verrà subito chiesto di impostarne una nuova personale.
              </span>
            </div>
          </div>

          <!-- Pulsanti Azione Modale -->
          <div class="flex items-center justify-end gap-2.5">
            <button
              type="button"
              (click)="closeModal()"
              class="px-4 py-2.5 rounded-2xl border text-xs font-bold transition active:scale-95 cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
              Annulla
            </button>

            <button
              type="button"
              (click)="confirmEnableReset()"
              [disabled]="actionLoading === selectedUserForReset.id"
              class="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer flex items-center gap-2">
              <i *ngIf="actionLoading === selectedUserForReset.id" class="fa-solid fa-circle-notch fa-spin"></i>
              <i *ngIf="actionLoading !== selectedUserForReset.id" class="fa-solid fa-check"></i>
              <span>Conferma e Abilita Reset</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class UsersAdminComponent implements OnInit {
  users: AdminDetailedUser[] = [];
  loading: boolean = false;
  actionLoading: string | null = null;
  searchQuery: string = '';
  selectedFilter: 'all' | 'requested' | 'enabled' = 'all';

  // Modal State
  selectedUserForReset: AdminDetailedUser | null = null;
  setTemporaryPassword: boolean = false;
  temporaryPasswordInput: string = 'motomota2026';

  constructor(
    private adminService: AdminService,
    public theme: ThemeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAdminUsers().subscribe({
      next: (res) => {
        this.users = res || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching admin users:', err);
        this.snackBar.open('Errore nel caricamento degli utenti', 'Chiudi', { duration: 3000 });
      }
    });
  }

  get pendingRequestsCount(): number {
    return this.users.filter(u => u.pwd_reset_requested).length;
  }

  get enabledResetsCount(): number {
    return this.users.filter(u => !u.pwd_reset_requested && u.pwd_reset === 1).length;
  }

  get filteredUsers(): AdminDetailedUser[] {
    let list = this.users;

    if (this.selectedFilter === 'requested') {
      list = list.filter(u => u.pwd_reset_requested);
    } else if (this.selectedFilter === 'enabled') {
      list = list.filter(u => u.pwd_reset === 1);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(u =>
        (u.first_name && u.first_name.toLowerCase().includes(q)) ||
        (u.last_name && u.last_name.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.alias && u.alias.toLowerCase().includes(q))
      );
    }

    // Sort: pending requests first, then enabled resets, then alphabetical
    return list.slice().sort((a, b) => {
      if (a.pwd_reset_requested && !b.pwd_reset_requested) return -1;
      if (!a.pwd_reset_requested && b.pwd_reset_requested) return 1;
      if (a.pwd_reset === 1 && b.pwd_reset !== 1) return -1;
      if (a.pwd_reset !== 1 && b.pwd_reset === 1) return 1;
      return (a.first_name || a.id).localeCompare(b.first_name || b.id);
    });
  }

  openEnableModal(user: AdminDetailedUser): void {
    this.selectedUserForReset = user;
    this.setTemporaryPassword = false;
    this.temporaryPasswordInput = 'motomota2026';
  }

  closeModal(): void {
    this.selectedUserForReset = null;
  }

  confirmEnableReset(): void {
    if (!this.selectedUserForReset) return;

    const user = this.selectedUserForReset;
    const tempPassword = this.setTemporaryPassword ? this.temporaryPasswordInput : undefined;

    this.actionLoading = user.id;

    this.adminService.enablePwdReset(user.id, tempPassword).subscribe({
      next: (res) => {
        this.actionLoading = null;
        user.pwd_reset = 1;
        user.pwd_reset_requested = false;
        user.pwd_reset_requested_at = null;
        this.closeModal();

        const msg = res.message || `Reset password abilitato per ${user.first_name || user.id}.`;
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.actionLoading = null;
        console.error('Error enabling pwd reset:', err);
        this.snackBar.open('Errore durante l\'abilitazione del reset password', 'Chiudi', { duration: 3000 });
      }
    });
  }

  disableReset(user: AdminDetailedUser): void {
    this.actionLoading = user.id;

    this.adminService.disablePwdReset(user.id).subscribe({
      next: (res) => {
        this.actionLoading = null;
        user.pwd_reset = 0;
        user.pwd_reset_requested = false;
        user.pwd_reset_requested_at = null;
        this.snackBar.open(res.message || `Reset disabilitato per ${user.first_name || user.id}.`, 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.actionLoading = null;
        console.error('Error disabling pwd reset:', err);
        this.snackBar.open('Errore durante la disabilitazione del reset', 'Chiudi', { duration: 3000 });
      }
    });
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
