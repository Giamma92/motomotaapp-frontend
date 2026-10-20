import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminFantasyTeam, AdminUser, AdminChampionshipRider } from '../../../services/admin.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-fantasy-teams-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="space-y-6">
      <!-- Header con Azione Aggiungi -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-black tracking-tight m-0 flex items-center gap-2"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              <span class="w-7 h-7 rounded-lg bg-red-600/15 text-red-500 flex items-center justify-center text-xs">
                <i class="fa-solid fa-users"></i>
              </span>
              Gestione Fantasy Team & Rose
            </h3>
            <p class="text-xs mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
              Configura le squadre partecipanti, assegna il manager proprietario e i piloti ufficiali/riserva.
            </p>
          </div>

          <button
            type="button"
            (click)="openAddForm()"
            *ngIf="!showForm"
            class="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 cursor-pointer flex items-center gap-2 self-start sm:self-auto">
            <i class="fa-solid fa-plus"></i>
            <span>Nuovo Fantasy Team</span>
          </button>
        </div>
      </div>

      <!-- Form Modifica / Inserimento Team -->
      <div *ngIf="showForm" class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="flex items-center justify-between mb-4 pb-3 border-b"
             [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
          <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
            {{ editingTeamId ? 'Modifica Squadra' : 'Crea Nuovo Fantasy Team' }}
          </h4>
          <button
            type="button"
            (click)="cancelForm()"
            class="text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer">
            <i class="fa-solid fa-xmark mr-1"></i> Annulla
          </button>
        </div>

        <form (ngSubmit)="saveTeam()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Nome Squadra -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Nome Squadra *
              </label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                name="teamName"
                required
                placeholder="Es. VR46 Racing Fan"
                class="w-full text-sm font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <!-- Manager Proprietario -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Manager (Utente) *
              </label>
              <select
                [(ngModel)]="formData.user_id"
                name="userId"
                required
                class="w-full text-sm font-semibold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
                <option [ngValue]="null" disabled>Seleziona Manager...</option>
                <option *ngFor="let user of usersList" [value]="user.id">
                  {{ user.first_name }} {{ user.last_name }} ({{ user.id }})
                </option>
              </select>
            </div>

            <!-- 1° Pilota Ufficiale -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                1° Pilota Ufficiale
              </label>
              <select
                [(ngModel)]="formData.official_rider_1"
                name="rider1"
                class="w-full text-sm font-semibold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
                <option [ngValue]="null">-- Nessun Pilota --</option>
                <option *ngFor="let r of ridersList" [value]="r.rider_id.id">
                  #{{ r.rider_id.number }} {{ r.rider_id.first_name }} {{ r.rider_id.last_name }} ({{ r.constructor_id.name }})
                </option>
              </select>
            </div>

            <!-- 2° Pilota Ufficiale -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                2° Pilota Ufficiale
              </label>
              <select
                [(ngModel)]="formData.official_rider_2"
                name="rider2"
                class="w-full text-sm font-semibold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
                <option [ngValue]="null">-- Nessun Pilota --</option>
                <option *ngFor="let r of ridersList" [value]="r.rider_id.id">
                  #{{ r.rider_id.number }} {{ r.rider_id.first_name }} {{ r.rider_id.last_name }} ({{ r.constructor_id.name }})
                </option>
              </select>
            </div>

            <!-- Pilota Riserva -->
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Pilota Riserva
              </label>
              <select
                [(ngModel)]="formData.reserve_rider"
                name="reserveRider"
                class="w-full text-sm font-semibold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
                <option [ngValue]="null">-- Nessuna Riserva --</option>
                <option *ngFor="let r of ridersList" [value]="r.rider_id.id">
                  #{{ r.rider_id.number }} {{ r.rider_id.first_name }} {{ r.rider_id.last_name }} ({{ r.constructor_id.name }})
                </option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-3">
            <button
              type="submit"
              [disabled]="saving || !formData.name || !formData.user_id"
              class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2">
              <i class="fa-solid" [ngClass]="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
              <span>{{ editingTeamId ? 'Aggiorna Squadra' : 'Crea Squadra' }}</span>
            </button>

            <button
              type="button"
              (click)="cancelForm()"
              class="px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
              Annulla
            </button>
          </div>
        </form>
      </div>

      <!-- Elenco Fantasy Teams -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
            Squadre Iscritte ({{ teams.length }})
          </h4>

          <button
            type="button"
            (click)="loadData()"
            [disabled]="loading"
            class="px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
            <i class="fa-solid fa-rotate" [ngClass]="{'fa-spin': loading}"></i>
            <span>Aggiorna</span>
          </button>
        </div>

        <div *ngIf="loading" class="py-12 text-center text-zinc-400">
          <i class="fa-solid fa-spinner fa-spin text-2xl text-red-500"></i>
          <p class="text-xs mt-2 font-medium">Caricamento squadre...</p>
        </div>

        <div *ngIf="!loading && teams.length === 0" class="py-12 text-center text-zinc-400">
          <p class="text-sm font-bold">Nessun Fantasy Team registrato per questo campionato.</p>
          <button (click)="openAddForm()" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer">
            Crea la prima squadra
          </button>
        </div>

        <div *ngIf="!loading && teams.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div *ngFor="let team of teams"
               class="p-4 rounded-xl border flex flex-col justify-between gap-3 transition"
               [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300' : 'bg-white/[0.02] border-white/5 hover:border-white/15'">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h5 class="text-sm font-black leading-tight m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                    {{ team.name }}
                  </h5>
                  <div class="text-[11px] font-bold text-red-500 mt-0.5 flex items-center gap-1.5">
                    <i class="fa-solid fa-user-tie"></i>
                    <span>Manager: {{ getManagerName(team.user_id) }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="openEditForm(team)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                    [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-white/10 hover:bg-white/15 text-zinc-300'"
                    title="Modifica squadra">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button
                    type="button"
                    (click)="deleteTeam(team)"
                    class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                    [ngClass]="theme.mode() === 'light' ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'"
                    title="Elimina squadra">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              <!-- Dettaglio Piloti Assegnati -->
              <div class="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center text-xs"
                   [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/5'">
                <div class="p-2 rounded-lg" [ngClass]="theme.mode() === 'light' ? 'bg-white' : 'bg-black/20'">
                  <div class="text-[9.5px] uppercase font-bold text-zinc-400">1° Pilota</div>
                  <div class="font-extrabold text-[11px] mt-0.5 truncate" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                    {{ getRiderLabel(team.official_rider_1) }}
                  </div>
                </div>

                <div class="p-2 rounded-lg" [ngClass]="theme.mode() === 'light' ? 'bg-white' : 'bg-black/20'">
                  <div class="text-[9.5px] uppercase font-bold text-zinc-400">2° Pilota</div>
                  <div class="font-extrabold text-[11px] mt-0.5 truncate" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                    {{ getRiderLabel(team.official_rider_2) }}
                  </div>
                </div>

                <div class="p-2 rounded-lg" [ngClass]="theme.mode() === 'light' ? 'bg-white' : 'bg-black/20'">
                  <div class="text-[9.5px] uppercase font-bold text-zinc-400">Riserva</div>
                  <div class="font-extrabold text-[11px] mt-0.5 truncate text-amber-500">
                    {{ getRiderLabel(team.reserve_rider) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FantasyTeamsAdminComponent implements OnInit, OnChanges {
  @Input() championshipId!: number;

  teams: AdminFantasyTeam[] = [];
  usersList: AdminUser[] = [];
  ridersList: AdminChampionshipRider[] = [];
  loading = false;
  saving = false;

  showForm = false;
  editingTeamId: number | null = null;
  formData: {
    name: string;
    user_id: string | null;
    official_rider_1: number | null;
    official_rider_2: number | null;
    reserve_rider: number | null;
  } = {
    name: '',
    user_id: null,
    official_rider_1: null,
    official_rider_2: null,
    reserve_rider: null
  };

  constructor(
    private adminService: AdminService,
    public theme: ThemeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.championshipId) {
      this.loadData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['championshipId'] && !changes['championshipId'].firstChange) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.adminService.getFantasyTeams(this.championshipId).subscribe({
      next: (teams) => {
        this.teams = teams || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching fantasy teams:', err);
        this.snackBar.open('Errore nel caricamento delle squadre', 'Chiudi', { duration: 4000 });
      }
    });

    this.adminService.getUsers().subscribe({
      next: (users) => this.usersList = users || [],
      error: (err) => console.error('Error fetching users:', err)
    });

    this.adminService.getChampionshipRiders(this.championshipId).subscribe({
      next: (riders) => this.ridersList = riders || [],
      error: (err) => console.error('Error fetching grid riders:', err)
    });
  }

  getManagerName(userId: any): string {
    if (!userId) return 'Nessuno';
    const id = typeof userId === 'object' ? userId.id : userId;
    const found = this.usersList.find(u => u.id === id);
    if (found) return `${found.first_name} ${found.last_name}`;
    if (typeof userId === 'object' && userId.first_name) {
      return `${userId.first_name} ${userId.last_name || ''}`;
    }
    return String(id);
  }

  getRiderLabel(riderObjOrId: any): string {
    if (!riderObjOrId) return '-';
    const rId = typeof riderObjOrId === 'object' ? riderObjOrId.id : riderObjOrId;
    const found = this.ridersList.find(r => r.rider_id?.id === rId);
    if (found?.rider_id) {
      return `#${found.rider_id.number} ${found.rider_id.last_name}`;
    }
    if (typeof riderObjOrId === 'object' && riderObjOrId.last_name) {
      return `#${riderObjOrId.number || ''} ${riderObjOrId.last_name}`;
    }
    return `#${rId}`;
  }

  openAddForm(): void {
    this.editingTeamId = null;
    this.formData = {
      name: '',
      user_id: null,
      official_rider_1: null,
      official_rider_2: null,
      reserve_rider: null
    };
    this.showForm = true;
  }

  openEditForm(team: AdminFantasyTeam): void {
    this.editingTeamId = team.id!;
    const uid = typeof team.user_id === 'object' ? team.user_id?.id : team.user_id;
    const r1 = typeof team.official_rider_1 === 'object' ? team.official_rider_1?.id : team.official_rider_1;
    const r2 = typeof team.official_rider_2 === 'object' ? team.official_rider_2?.id : team.official_rider_2;
    const rr = typeof team.reserve_rider === 'object' ? team.reserve_rider?.id : team.reserve_rider;

    this.formData = {
      name: team.name,
      user_id: uid,
      official_rider_1: r1 || null,
      official_rider_2: r2 || null,
      reserve_rider: rr || null
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingTeamId = null;
  }

  saveTeam(): void {
    if (!this.formData.name || !this.formData.user_id) return;
    this.saving = true;

    const payload = {
      name: this.formData.name,
      user_id: this.formData.user_id,
      official_rider_1: this.formData.official_rider_1,
      official_rider_2: this.formData.official_rider_2,
      reserve_rider: this.formData.reserve_rider,
      championship_id: this.championshipId
    };

    if (this.editingTeamId) {
      this.adminService.updateFantasyTeam(this.championshipId, this.editingTeamId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.snackBar.open('Squadra aggiornata con successo!', 'OK', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error updating team:', err);
          this.snackBar.open(err?.error?.message || 'Errore aggiornamento squadra', 'Chiudi', { duration: 4000 });
        }
      });
    } else {
      this.adminService.createFantasyTeam(this.championshipId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.snackBar.open('Squadra creata con successo!', 'OK', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error creating team:', err);
          this.snackBar.open(err?.error?.message || 'Errore creazione squadra', 'Chiudi', { duration: 4000 });
        }
      });
    }
  }

  deleteTeam(team: AdminFantasyTeam): void {
    const ok = confirm(`Sei sicuro di voler eliminare la squadra "${team.name}"?`);
    if (!ok) return;

    this.adminService.deleteFantasyTeam(this.championshipId, team.id!).subscribe({
      next: () => {
        this.snackBar.open('Squadra eliminata con successo!', 'OK', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting team:', err);
        this.snackBar.open(err?.error?.message || 'Errore eliminazione squadra', 'Chiudi', { duration: 4000 });
      }
    });
  }
}
