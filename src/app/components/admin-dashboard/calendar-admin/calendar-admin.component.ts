import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminCalendarRace, AdminRaceMaster } from '../../../services/admin.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-calendar-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  template: `
    <div class="space-y-6">
      <!-- Sub-Tab Header -->
      <div class="rounded-2xl p-2 sm:p-2.5 border flex items-center gap-1.5 overflow-x-auto"
           [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-white/10'">
        <button
          type="button"
          (click)="activeSubTab = 'calendar'"
          class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
          [ngClass]="activeSubTab === 'calendar'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
            : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white')">
          <i class="fa-solid fa-calendar-days"></i>
          <span>Calendario Gare ({{ calendarRaces.length }})</span>
        </button>

        <button
          type="button"
          (click)="activeSubTab = 'circuits'"
          class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
          [ngClass]="activeSubTab === 'circuits'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
            : (theme.mode() === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-white')">
          <i class="fa-solid fa-road"></i>
          <span>Master Circuiti ({{ masterRaces.length }})</span>
        </button>
      </div>

      <!-- ==========================================
           SUB-TAB 1: CALENDARIO CAMPIONATO
      ========================================== -->
      <div *ngIf="activeSubTab === 'calendar'" class="space-y-6">
        <!-- Form Aggiungi/Modifica Gara in Calendario -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="flex items-center justify-between mb-4 pb-3 border-b"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
            <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              {{ editingCalendarId ? 'Modifica Round Calendario' : 'Aggiungi Round al Calendario' }}
            </h4>
            <button
              type="button"
              *ngIf="editingCalendarId"
              (click)="cancelCalendarEdit()"
              class="text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer">
              Annulla
            </button>
          </div>

          <form (ngSubmit)="saveCalendarRace()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <!-- Circuito Master -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Circuito Master *
              </label>
              <select
                [(ngModel)]="calForm.race_id"
                name="calRaceId"
                required
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'">
                <option [ngValue]="null" disabled>Seleziona Circuito...</option>
                <option *ngFor="let mr of masterRaces" [value]="mr.id">
                  {{ mr.name }} ({{ mr.country || 'N/A' }})
                </option>
              </select>
            </div>

            <!-- Numero Round -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Numero Round *
              </label>
              <input
                type="number"
                [(ngModel)]="calForm.race_order"
                name="calOrder"
                required
                min="1"
                placeholder="Es. 1"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <!-- Data Gara (Domenica) -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Data Gara (YYYY-MM-DD) *
              </label>
              <input
                type="date"
                [(ngModel)]="calForm.event_date"
                name="calDate"
                required
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <!-- Ora Qualifiche -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Ora Qualifiche (HH:MM:SS)
              </label>
              <input
                type="text"
                [(ngModel)]="calForm.qualifications_time"
                name="calQTime"
                placeholder="10:50:00"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <!-- Ora Sprint -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Ora Sprint (HH:MM:SS)
              </label>
              <input
                type="text"
                [(ngModel)]="calForm.sprint_time"
                name="calSTime"
                placeholder="15:00:00"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <!-- Ora Gara -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Ora Gara Domenica (HH:MM:SS)
              </label>
              <input
                type="text"
                [(ngModel)]="calForm.event_time"
                name="calETime"
                placeholder="14:00:00"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div class="lg:col-span-3 flex items-center gap-3 pt-2">
              <button
                type="submit"
                [disabled]="!calForm.race_id || !calForm.race_order || !calForm.event_date || savingCalendar"
                class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2">
                <i class="fa-solid" [ngClass]="savingCalendar ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                <span>{{ editingCalendarId ? 'Aggiorna Gara' : 'Salva in Calendario' }}</span>
              </button>

              <button
                type="button"
                *ngIf="editingCalendarId"
                (click)="cancelCalendarEdit()"
                class="px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
                Annulla
              </button>
            </div>
          </form>
        </div>

        <!-- Lista Gare in Calendario -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              Gare in Calendario ({{ calendarRaces.length }})
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
            <p class="text-xs mt-2 font-medium">Caricamento calendario...</p>
          </div>

          <div *ngIf="!loading && calendarRaces.length === 0" class="py-12 text-center text-zinc-400">
            Nessun round in calendario per questo campionato.
          </div>

          <div *ngIf="!loading && calendarRaces.length > 0" class="overflow-x-auto rounded-xl border"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900/90 text-zinc-400'">
                  <th class="p-3 font-bold uppercase tracking-wider text-center w-14">Round</th>
                  <th class="p-3 font-bold uppercase tracking-wider">Gran Premio & Circuito</th>
                  <th class="p-3 font-bold uppercase tracking-wider">Data Gara</th>
                  <th class="p-3 font-bold uppercase tracking-wider">Orari (Q / S / G)</th>
                  <th class="p-3 font-bold uppercase tracking-wider text-center">Stato</th>
                  <th class="p-3 font-bold uppercase tracking-wider text-right w-28">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y" [ngClass]="theme.mode() === 'light' ? 'divide-zinc-200' : 'divide-white/5'">
                <tr *ngFor="let r of calendarRaces"
                    class="transition-colors"
                    [ngClass]="r.cancelled
                      ? (theme.mode() === 'light' ? 'bg-red-50/50 opacity-60' : 'bg-red-950/20 opacity-60')
                      : (theme.mode() === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.02]')">
                  <!-- Round -->
                  <td class="p-3 text-center">
                    <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-black bg-zinc-800 text-white">
                      {{ r.race_order }}
                    </span>
                  </td>

                  <!-- Gran Premio -->
                  <td class="p-3">
                    <div class="font-black text-sm" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                      {{ r.race_id?.name || 'GP' }}
                    </div>
                    <div class="text-[10px] text-zinc-400 mt-0.5">
                      {{ r.race_id?.location }} ({{ r.race_id?.country }})
                    </div>
                  </td>

                  <!-- Data -->
                  <td class="p-3 font-bold" [ngClass]="theme.mode() === 'light' ? 'text-zinc-800' : 'text-zinc-200'">
                    {{ r.event_date }}
                  </td>

                  <!-- Orari -->
                  <td class="p-3 text-[11px] text-zinc-400 font-mono">
                    {{ r.qualifications_time || '--:--' }} / {{ r.sprint_time || '--:--' }} / {{ r.event_time || '--:--' }}
                  </td>

                  <!-- Stato -->
                  <td class="p-3 text-center">
                    <span *ngIf="r.cancelled"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
                      Annullata
                    </span>
                    <span *ngIf="!r.cancelled"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      In Programma
                    </span>
                  </td>

                  <!-- Azioni -->
                  <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        (click)="editCalendarRace(r)"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                        [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-white/10 hover:bg-white/15 text-zinc-300'"
                        title="Modifica">
                        <i class="fa-solid fa-pen"></i>
                      </button>

                      <button
                        type="button"
                        (click)="toggleCancel(r)"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                        [ngClass]="r.cancelled
                          ? (theme.mode() === 'light' ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400')
                          : (theme.mode() === 'light' ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400')"
                        [title]="r.cancelled ? 'Ripristina round' : 'Annulla round'">
                        <i class="fa-solid" [ngClass]="r.cancelled ? 'fa-rotate-left' : 'fa-ban'"></i>
                      </button>

                      <button
                        type="button"
                        (click)="deleteCalendarRace(r)"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                        [ngClass]="theme.mode() === 'light' ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'"
                        title="Elimina dal calendario">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==========================================
           SUB-TAB 2: MASTER CIRCUITI
      ========================================== -->
      <div *ngIf="activeSubTab === 'circuits'" class="space-y-6">
        <!-- Form Aggiungi/Modifica Master Circuito -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <div class="flex items-center justify-between mb-4 pb-3 border-b"
               [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
            <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              {{ editingMasterRaceId ? 'Modifica Circuito Master' : 'Aggiungi Circuito Master' }}
            </h4>
            <button
              type="button"
              *ngIf="editingMasterRaceId"
              (click)="cancelMasterRaceEdit()"
              class="text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer">
              Annulla
            </button>
          </div>

          <form (ngSubmit)="saveMasterRace()" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Nome GP / Gara *
              </label>
              <input
                type="text"
                [(ngModel)]="masterRaceForm.name"
                name="mrName"
                required
                placeholder="Es. GP del Qatar"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Nome Circuito / Location
              </label>
              <input
                type="text"
                [(ngModel)]="masterRaceForm.location"
                name="mrLoc"
                placeholder="Es. Lusail International Circuit"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Nazione
              </label>
              <input
                type="text"
                [(ngModel)]="masterRaceForm.country"
                name="mrCountry"
                placeholder="Es. Qatar"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div class="flex items-end">
              <button
                type="submit"
                [disabled]="!masterRaceForm.name || savingMasterRace"
                class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                <i class="fa-solid" [ngClass]="savingMasterRace ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                <span>{{ editingMasterRaceId ? 'Aggiorna Circuito' : 'Aggiungi Circuito' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Elenco Circuiti Master -->
        <div class="rounded-2xl p-4 sm:p-5 border"
             [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
          <h4 class="text-sm font-black mb-4" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
            Circuiti Master Registrati ({{ masterRaces.length }})
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div *ngFor="let mr of masterRaces"
                 class="p-4 rounded-xl border flex items-center justify-between gap-3"
                 [ngClass]="theme.mode() === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/5'">
              <div class="min-w-0">
                <div class="text-sm font-black truncate" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                  {{ mr.name }}
                </div>
                <div class="text-xs text-red-500 font-bold mt-0.5 truncate">
                  {{ mr.location || 'Circuito non specificato' }}
                </div>
                <div class="text-[10px] text-zinc-400 mt-0.5">
                  Nazione: {{ mr.country || 'N/A' }}
                </div>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  (click)="editMasterRace(mr)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                  [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-white/10 hover:bg-white/15 text-zinc-300'"
                  title="Modifica">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
                  type="button"
                  (click)="deleteMasterRace(mr)"
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
export class CalendarAdminComponent implements OnInit, OnChanges {
  @Input() championshipId!: number;

  activeSubTab: 'calendar' | 'circuits' = 'calendar';

  calendarRaces: AdminCalendarRace[] = [];
  masterRaces: AdminRaceMaster[] = [];
  loading = false;

  // Calendar Race Form
  editingCalendarId: number | null = null;
  savingCalendar = false;
  calForm = {
    race_id: null as number | null,
    race_order: 1,
    event_date: '',
    qualifications_time: '10:50:00',
    sprint_time: '15:00:00',
    event_time: '14:00:00'
  };

  // Master Race Form
  editingMasterRaceId: number | null = null;
  savingMasterRace = false;
  masterRaceForm = {
    name: '',
    location: '',
    country: ''
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

    this.adminService.getCalendar(this.championshipId).subscribe({
      next: (res) => {
        this.calendarRaces = res || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching calendar:', err);
      }
    });

    this.adminService.getRaces().subscribe({
      next: (res) => this.masterRaces = res || [],
      error: (err) => console.error('Error fetching master races:', err)
    });
  }

  // --- Calendar Actions ---
  editCalendarRace(r: AdminCalendarRace): void {
    this.editingCalendarId = r.id!;
    const rId = typeof r.race_id === 'object' ? r.race_id?.id : r.race_id;
    this.calForm = {
      race_id: rId,
      race_order: r.race_order,
      event_date: r.event_date,
      qualifications_time: r.qualifications_time || '',
      sprint_time: r.sprint_time || '',
      event_time: r.event_time || ''
    };
  }

  cancelCalendarEdit(): void {
    this.editingCalendarId = null;
    this.calForm = {
      race_id: null,
      race_order: this.calendarRaces.length + 1,
      event_date: '',
      qualifications_time: '10:50:00',
      sprint_time: '15:00:00',
      event_time: '14:00:00'
    };
  }

  saveCalendarRace(): void {
    if (!this.calForm.race_id || !this.calForm.race_order || !this.calForm.event_date) return;
    this.savingCalendar = true;

    const payload = {
      race_id: this.calForm.race_id,
      race_order: this.calForm.race_order,
      event_date: this.calForm.event_date,
      qualifications_time: this.calForm.qualifications_time || null,
      sprint_time: this.calForm.sprint_time || null,
      event_time: this.calForm.event_time || null
    };

    if (this.editingCalendarId) {
      this.adminService.updateCalendarRace(this.championshipId, this.editingCalendarId, payload).subscribe({
        next: () => {
          this.savingCalendar = false;
          this.cancelCalendarEdit();
          this.snackBar.open('Round aggiornato con successo!', 'OK', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          this.savingCalendar = false;
          console.error('Error updating calendar race:', err);
          this.snackBar.open(err?.error?.message || 'Errore aggiornamento round', 'Chiudi', { duration: 4000 });
        }
      });
    } else {
      this.adminService.createCalendarRace(this.championshipId, payload).subscribe({
        next: () => {
          this.savingCalendar = false;
          this.cancelCalendarEdit();
          this.snackBar.open('Round inserito in calendario!', 'OK', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          this.savingCalendar = false;
          console.error('Error creating calendar race:', err);
          this.snackBar.open(err?.error?.message || 'Errore creazione round', 'Chiudi', { duration: 4000 });
        }
      });
    }
  }

  toggleCancel(r: AdminCalendarRace): void {
    const nextState = !r.cancelled;
    const ok = confirm(`Vuoi ${nextState ? 'annullare' : 'ripristinare'} il round "${r.race_id?.name || 'Round ' + r.race_order}"?`);
    if (!ok) return;

    this.adminService.toggleCancelRace(this.championshipId, r.id!, nextState).subscribe({
      next: () => {
        this.snackBar.open(`Round ${nextState ? 'annullato' : 'ripristinato'} con successo!`, 'OK', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Error toggling cancel race:', err);
        this.snackBar.open(err?.error?.message || 'Errore operazione', 'Chiudi', { duration: 4000 });
      }
    });
  }

  deleteCalendarRace(r: AdminCalendarRace): void {
    const ok = confirm(`Eliminare definitivamente il Round ${r.race_order} dal calendario?`);
    if (!ok) return;

    this.adminService.deleteCalendarRace(this.championshipId, r.id!).subscribe({
      next: () => {
        this.snackBar.open('Round eliminato dal calendario!', 'OK', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting calendar race:', err);
        this.snackBar.open(err?.error?.message || 'Errore eliminazione round', 'Chiudi', { duration: 4000 });
      }
    });
  }

  // --- Master Race Actions ---
  editMasterRace(mr: AdminRaceMaster): void {
    this.editingMasterRaceId = mr.id!;
    this.masterRaceForm = {
      name: mr.name,
      location: mr.location || '',
      country: mr.country || ''
    };
  }

  cancelMasterRaceEdit(): void {
    this.editingMasterRaceId = null;
    this.masterRaceForm = { name: '', location: '', country: '' };
  }

  saveMasterRace(): void {
    if (!this.masterRaceForm.name) return;
    this.savingMasterRace = true;

    const payload = {
      name: this.masterRaceForm.name,
      location: this.masterRaceForm.location || null,
      country: this.masterRaceForm.country || null
    };

    if (this.editingMasterRaceId) {
      this.adminService.updateRace(this.editingMasterRaceId, payload).subscribe({
        next: () => {
          this.savingMasterRace = false;
          this.cancelMasterRaceEdit();
          this.snackBar.open('Circuito master aggiornato!', 'OK', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          this.savingMasterRace = false;
          console.error('Error updating master race:', err);
          this.snackBar.open(err?.error?.message || 'Errore aggiornamento circuito', 'Chiudi', { duration: 4000 });
        }
      });
    } else {
      this.adminService.createRace(payload).subscribe({
        next: () => {
          this.savingMasterRace = false;
          this.cancelMasterRaceEdit();
          this.snackBar.open('Circuito master creato!', 'OK', { duration: 3000 });
          this.loadData();
        },
        error: (err) => {
          this.savingMasterRace = false;
          console.error('Error creating master race:', err);
          this.snackBar.open(err?.error?.message || 'Errore creazione circuito', 'Chiudi', { duration: 4000 });
        }
      });
    }
  }

  deleteMasterRace(mr: AdminRaceMaster): void {
    const ok = confirm(`Eliminare il circuito "${mr.name}"?`);
    if (!ok) return;

    this.adminService.deleteRace(mr.id!).subscribe({
      next: () => {
        this.snackBar.open('Circuito master eliminato!', 'OK', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting master race:', err);
        this.snackBar.open(err?.error?.message || 'Errore eliminazione circuito (potrebbe essere in uso nei calendari)', 'Chiudi', { duration: 5000 });
      }
    });
  }
}
