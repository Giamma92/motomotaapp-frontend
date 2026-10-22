import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationServiceService } from '../../../services/notification.service';
import { AdminService, AdminRider, AdminConstructor, AdminChampionshipRider } from '../../../services/admin.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-riders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Sub-Tab Header -->
      <div class="rounded-2xl p-2 sm:p-2.5 border flex items-center gap-1.5 overflow-x-auto"
           [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-white/10'">
        <button
          type="button"
          (click)="activeSubTab = 'grid'"
          class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
          [ngClass]="activeSubTab === 'grid'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
            : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white')">
          <i class="fa-solid fa-flag-checkered"></i>
          <span>Griglia Campionato ({{ gridRiders.length }})</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab = 'riders'"
          class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
          [ngClass]="activeSubTab === 'riders'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
            : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white')">
          <i class="fa-solid fa-helmet-un"></i>
          <span>Anagrafica Piloti MotoGP ({{ allRiders.length }})</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab = 'constructors'"
          class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
          [ngClass]="activeSubTab === 'constructors'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
            : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white')">
          <i class="fa-solid fa-motorcycle"></i>
          <span>Scuderie MotoGP ({{ constructors.length }})</span>
        </button>
      </div>

      <!-- ==========================================
           SUB-TAB 1: GRIGLIA CAMPIONATO
      ========================================== -->
      <div *ngIf="activeSubTab === 'grid'" class="flex flex-col gap-6">
        <!-- Box Assegnazione Nuovo Pilota a Campionato -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="mb-4">
            <h4 class="text-sm font-black m-0 flex items-center gap-2"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              <span class="w-6 h-6 rounded-lg bg-red-600/15 text-red-500 flex items-center justify-center text-xs">
                <i class="fa-solid fa-plus"></i>
              </span>
              Assegna Pilota e Scuderia al Campionato
            </h4>
            <p class="text-xs mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
              Aggiungi un pilota alla griglia ufficiale di questo campionato associandolo alla sua scuderia.
            </p>
          </div>

          <form (ngSubmit)="assignRiderToGrid()" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Seleziona Pilota *
              </label>
              <select
                [(ngModel)]="newGridRiderId"
                name="newGridRider"
                required
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
                <option [ngValue]="null" disabled>Seleziona Pilota...</option>
                <option *ngFor="let r of allRiders" [value]="r.id">
                  #{{ r.number }} {{ r.first_name }} {{ r.last_name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Seleziona Scuderia *
              </label>
              <select
                [(ngModel)]="newGridConstructorId"
                name="newGridConstructor"
                required
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
                <option [ngValue]="null" disabled>Seleziona Scuderia...</option>
                <option *ngFor="let c of constructors" [value]="c.id">
                  {{ c.name }} {{ c.nationality ? '(' + c.nationality + ')' : '' }}
                </option>
              </select>
            </div>

            <div class="flex items-end">
              <button
                type="submit"
                [disabled]="!newGridRiderId || !newGridConstructorId || savingGrid"
                class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                <i class="fa-solid" [ngClass]="savingGrid ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
                <span>Aggiungi alla Griglia</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Elenco Piloti in Griglia -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              Piloti Ufficiali Campionato ({{ gridRiders.length }})
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
            <p class="text-xs mt-2 font-medium">Caricamento griglia...</p>
          </div>

          <div *ngIf="!loading && gridRiders.length === 0" class="py-12 text-center text-zinc-400">
            Nessun pilota associato a questo campionato. Usa il modulo sopra per aggiungere i primi piloti.
          </div>

          <div *ngIf="!loading && gridRiders.length > 0" class="overflow-x-auto rounded-xl border"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900/90 text-zinc-400'">
                  <th class="p-3 font-bold uppercase tracking-wider text-center w-16"># N°</th>
                  <th class="p-3 font-bold uppercase tracking-wider">Pilota</th>
                  <th class="p-3 font-bold uppercase tracking-wider">Scuderia</th>
                  <th class="p-3 font-bold uppercase tracking-wider text-right w-24">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y" [ngClass]="theme.mode() === 'light' ? 'divide-zinc-200' : 'divide-white/5'">
                <tr *ngFor="let g of gridRiders"
                    class="transition-colors"
                    [ngClass]="theme.mode() === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.02]'">
                  <!-- Numero -->
                  <td class="p-3 text-center">
                    <span class="inline-block px-2.5 py-0.5 rounded-lg text-xs font-black bg-red-600 text-white shadow-xs">
                      {{ g.rider_id.number }}
                    </span>
                  </td>

                  <!-- Pilota -->
                  <td class="p-3">
                    <div class="font-black text-sm" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                      {{ g.rider_id.first_name }} {{ g.rider_id.last_name }}
                    </div>
                  </td>

                  <!-- Scuderia -->
                  <td class="p-3">
                    <span class="font-bold text-xs" [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                      {{ g.constructor_id.name }}
                    </span>
                    <span *ngIf="g.constructor_id.nationality" class="text-[10px] text-zinc-400 ml-1.5">
                      ({{ g.constructor_id.nationality }})
                    </span>
                  </td>

                  <!-- Azioni -->
                  <td class="p-3 text-right">
                    <button
                      type="button"
                      (click)="removeFromGrid(g)"
                      class="w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs transition cursor-pointer"
                      [ngClass]="theme.mode() === 'light' ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'"
                      title="Rimuovi dalla griglia">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==========================================
           SUB-TAB 2: ANAGRAFICA PILOTI
      ========================================== -->
      <div *ngIf="activeSubTab === 'riders'" class="flex flex-col gap-6">
        <!-- Form Aggiungi/Modifica Pilota -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="flex items-center justify-between mb-4 pb-3 border-b"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
            <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              {{ editingRiderId ? 'Modifica Anagrafica Pilota' : 'Inserisci Nuovo Pilota MotoGP' }}
            </h4>
            <button
              type="button"
              *ngIf="editingRiderId"
              (click)="cancelRiderEdit()"
              class="text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer">
              Annulla
            </button>
          </div>

          <form (ngSubmit)="saveRider()" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Numero di Gara *
              </label>
              <input
                type="number"
                [(ngModel)]="riderForm.number"
                name="riderNum"
                required
                placeholder="Es. 93"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Nome *
              </label>
              <input
                type="text"
                [(ngModel)]="riderForm.first_name"
                name="riderFirst"
                required
                placeholder="Es. Marc"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Cognome *
              </label>
              <input
                type="text"
                [(ngModel)]="riderForm.last_name"
                name="riderLast"
                required
                placeholder="Es. Marquez"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div class="flex items-end">
              <button
                type="submit"
                [disabled]="!riderForm.first_name || !riderForm.last_name || !riderForm.number || savingRider"
                class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                <i class="fa-solid" [ngClass]="savingRider ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                <span>{{ editingRiderId ? 'Aggiorna Pilota' : 'Aggiungi Pilota' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Lista Piloti -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              Tutti i Piloti MotoGP Registrati ({{ allRiders.length }})
            </h4>

            <input
              type="text"
              [(ngModel)]="riderSearch"
              placeholder="Filtra per nome o numero..."
              class="text-xs font-semibold rounded-xl px-3 py-1.5 border outline-none w-48 sm:w-64"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-50 border-zinc-300 text-zinc-900'
                : 'bg-zinc-900 border-white/15 text-white'" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            <div *ngFor="let r of filteredRiders"
                 class="p-3 rounded-xl border flex items-center justify-between gap-2"
                 [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                  {{ r.number }}
                </span>
                <div class="truncate">
                  <div class="text-xs font-black truncate" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                    {{ r.first_name }} {{ r.last_name }}
                  </div>
                  <div class="text-[10px] text-zinc-400">ID: {{ r.id }}</div>
                </div>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  (click)="editRider(r)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                  [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-white/10 hover:bg-white/15 text-zinc-300'"
                  title="Modifica">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
                  type="button"
                  (click)="deleteRider(r)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                  [ngClass]="theme.mode() === 'light' ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'"
                  title="Elimina">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==========================================
           SUB-TAB 3: SCUDERIE MOTOGP
      ========================================== -->
      <div *ngIf="activeSubTab === 'constructors'" class="flex flex-col gap-6">
        <!-- Form Aggiungi/Modifica Costruttore -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="flex items-center justify-between mb-4 pb-3 border-b"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
            <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              {{ editingConstructorId ? 'Modifica Scuderia' : 'Inserisci Nuova Scuderia MotoGP' }}
            </h4>
            <button
              type="button"
              *ngIf="editingConstructorId"
              (click)="cancelConstructorEdit()"
              class="text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer">
              Annulla
            </button>
          </div>

          <form (ngSubmit)="saveConstructor()" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Nome Scuderia / Costruttore *
              </label>
              <input
                type="text"
                [(ngModel)]="constructorForm.name"
                name="cName"
                required
                placeholder="Es. Ducati Lenovo Team"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Nazionalità
              </label>
              <input
                type="text"
                [(ngModel)]="constructorForm.nationality"
                name="cNat"
                placeholder="Es. ITA"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div class="flex items-end">
              <button
                type="submit"
                [disabled]="!constructorForm.name || savingConstructor"
                class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                <i class="fa-solid" [ngClass]="savingConstructor ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                <span>{{ editingConstructorId ? 'Aggiorna Scuderia' : 'Aggiungi Scuderia' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Lista Scuderie -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <h4 class="text-sm font-black mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
            Scuderie Registrate ({{ constructors.length }})
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div *ngFor="let c of constructors"
                 class="p-4 rounded-xl border flex items-center justify-between gap-3"
                 [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
              <div>
                <div class="text-sm font-black" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                  {{ c.name }}
                </div>
                <div class="text-xs text-red-500 font-bold mt-0.5">
                  {{ c.nationality ? 'Nazionalità: ' + c.nationality : 'Nessuna nazione' }}
                </div>
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  (click)="editConstructor(c)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                  [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-white/10 hover:bg-white/15 text-zinc-300'"
                  title="Modifica">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
                  type="button"
                  (click)="deleteConstructor(c)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                  [ngClass]="theme.mode() === 'light' ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'"
                  title="Elimina">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RidersAdminComponent implements OnInit, OnChanges {
  @Input() championshipId!: number;

  activeSubTab: 'grid' | 'riders' | 'constructors' = 'grid';

  gridRiders: AdminChampionshipRider[] = [];
  allRiders: AdminRider[] = [];
  constructors: AdminConstructor[] = [];
  loading = false;

  // Grid
  newGridRiderId: number | null = null;
  newGridConstructorId: number | null = null;
  savingGrid = false;

  // Riders form
  riderSearch = '';
  editingRiderId: number | null = null;
  savingRider = false;
  riderForm = {
    first_name: '',
    last_name: '',
    number: null as number | null
  };

  // Constructors form
  editingConstructorId: number | null = null;
  savingConstructor = false;
  constructorForm = {
    name: '',
    nationality: ''
  };

  constructor(
    private adminService: AdminService,
    public theme: ThemeService,
    private snackBar: MatSnackBar,
    private notificationService: NotificationServiceService
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

    // Load Grid
    this.adminService.getChampionshipRiders(this.championshipId).subscribe({
      next: (res) => {
        this.gridRiders = res || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching grid riders:', err);
      }
    });

    // Load All Riders
    this.adminService.getRiders().subscribe({
      next: (res) => this.allRiders = res || [],
      error: (err) => console.error('Error fetching riders:', err)
    });

    // Load Constructors
    this.adminService.getConstructors().subscribe({
      next: (res) => this.constructors = res || [],
      error: (err) => console.error('Error fetching constructors:', err)
    });
  }

  get filteredRiders(): AdminRider[] {
    if (!this.riderSearch) return this.allRiders;
    const q = this.riderSearch.toLowerCase();
    return this.allRiders.filter(r =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
      String(r.number).includes(q)
    );
  }

  // --- Grid Actions ---
  assignRiderToGrid(): void {
    if (!this.newGridRiderId || !this.newGridConstructorId) return;
    this.savingGrid = true;

    this.adminService.assignRiderToChampionship(this.championshipId, {
      rider_id: this.newGridRiderId,
      constructor_id: this.newGridConstructorId
    }).subscribe({
      next: () => {
        this.savingGrid = false;
        this.newGridRiderId = null;
        this.newGridConstructorId = null;
        this.notificationService.showSuccessMessage('Pilota aggiunto alla griglia del campionato!');
        this.loadData();
      },
      error: (err) => {
        this.savingGrid = false;
        console.error('Error assigning rider:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore associazione pilota');
      }
    });
  }

  removeFromGrid(g: AdminChampionshipRider): void {
    const ok = confirm(`Rimuovere ${g.rider_id?.first_name} ${g.rider_id?.last_name} dalla griglia del campionato?`);
    if (!ok) return;

    this.adminService.removeRiderFromChampionship(this.championshipId, g.id).subscribe({
      next: () => {
        this.notificationService.showSuccessMessage('Pilota rimosso dalla griglia!');
        this.loadData();
      },
      error: (err) => {
        console.error('Error removing rider from grid:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore rimozione');
      }
    });
  }

  // --- Riders Actions ---
  editRider(r: AdminRider): void {
    this.editingRiderId = r.id!;
    this.riderForm = {
      first_name: r.first_name,
      last_name: r.last_name,
      number: r.number
    };
  }

  cancelRiderEdit(): void {
    this.editingRiderId = null;
    this.riderForm = { first_name: '', last_name: '', number: null };
  }

  saveRider(): void {
    if (!this.riderForm.first_name || !this.riderForm.last_name || !this.riderForm.number) return;
    this.savingRider = true;

    if (this.editingRiderId) {
      this.adminService.updateRider(this.editingRiderId, {
        first_name: this.riderForm.first_name,
        last_name: this.riderForm.last_name,
        number: this.riderForm.number
      }).subscribe({
        next: () => {
          this.savingRider = false;
          this.cancelRiderEdit();
          this.notificationService.showSuccessMessage('Pilota aggiornato!');
          this.loadData();
        },
        error: (err) => {
          this.savingRider = false;
          console.error('Error updating rider:', err);
          this.notificationService.showErrorMessage(err?.error?.message || 'Errore aggiornamento pilota');
        }
      });
    } else {
      this.adminService.createRider({
        first_name: this.riderForm.first_name,
        last_name: this.riderForm.last_name,
        number: this.riderForm.number
      }).subscribe({
        next: () => {
          this.savingRider = false;
          this.cancelRiderEdit();
          this.notificationService.showSuccessMessage('Pilota creato con successo!');
          this.loadData();
        },
        error: (err) => {
          this.savingRider = false;
          console.error('Error creating rider:', err);
          this.notificationService.showErrorMessage(err?.error?.message || 'Errore creazione pilota');
        }
      });
    }
  }

  deleteRider(r: AdminRider): void {
    const ok = confirm(`Eliminare definitivamente il pilota ${r.first_name} ${r.last_name} (#${r.number})?`);
    if (!ok) return;

    this.adminService.deleteRider(r.id!).subscribe({
      next: () => {
        this.notificationService.showSuccessMessage('Pilota eliminato!');
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting rider:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore eliminazione pilota (potrebbe essere assegnato a gare o rose)');
      }
    });
  }

  // --- Constructors Actions ---
  editConstructor(c: AdminConstructor): void {
    this.editingConstructorId = c.id!;
    this.constructorForm = {
      name: c.name,
      nationality: c.nationality || ''
    };
  }

  cancelConstructorEdit(): void {
    this.editingConstructorId = null;
    this.constructorForm = { name: '', nationality: '' };
  }

  saveConstructor(): void {
    if (!this.constructorForm.name) return;
    this.savingConstructor = true;

    if (this.editingConstructorId) {
      this.adminService.updateConstructor(this.editingConstructorId, {
        name: this.constructorForm.name,
        nationality: this.constructorForm.nationality || null
      }).subscribe({
        next: () => {
          this.savingConstructor = false;
          this.cancelConstructorEdit();
          this.notificationService.showSuccessMessage('Scuderia aggiornata!');
          this.loadData();
        },
        error: (err) => {
          this.savingConstructor = false;
          console.error('Error updating constructor:', err);
          this.notificationService.showErrorMessage(err?.error?.message || 'Errore aggiornamento scuderia');
        }
      });
    } else {
      this.adminService.createConstructor({
        name: this.constructorForm.name,
        nationality: this.constructorForm.nationality || null
      }).subscribe({
        next: () => {
          this.savingConstructor = false;
          this.cancelConstructorEdit();
          this.notificationService.showSuccessMessage('Scuderia creata!');
          this.loadData();
        },
        error: (err) => {
          this.savingConstructor = false;
          console.error('Error creating constructor:', err);
          this.notificationService.showErrorMessage(err?.error?.message || 'Errore creazione scuderia');
        }
      });
    }
  }

  deleteConstructor(c: AdminConstructor): void {
    const ok = confirm(`Eliminare la scuderia "${c.name}"?`);
    if (!ok) return;

    this.adminService.deleteConstructor(c.id!).subscribe({
      next: () => {
        this.notificationService.showSuccessMessage('Scuderia eliminata!');
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting constructor:', err);
        this.notificationService.showErrorMessage(err?.error?.message || 'Errore eliminazione scuderia');
      }
    });
  }
}
