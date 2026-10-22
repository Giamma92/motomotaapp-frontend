import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminChampionship } from '../../../services/admin.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-championship-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header Sezione -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-black tracking-tight m-0 flex items-center gap-2"
                [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
              <span class="w-7 h-7 rounded-lg bg-red-600/15 text-red-500 flex items-center justify-center text-xs">
                <i class="fa-solid fa-trophy"></i>
              </span>
              Gestione Campionati
            </h3>
            <p class="text-xs mt-1" [ngClass]="theme.mode() === 'light' ? 'text-zinc-500' : 'text-zinc-400'">
              Crea nuove stagioni o aggiorna le impostazioni e le date dei campionati Fanta MotoGP.
            </p>
          </div>

          <button
            type="button"
            (click)="resetForm()"
            *ngIf="editingId"
            class="px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
            <i class="fa-solid fa-xmark"></i>
            <span>Annulla Modifica</span>
          </button>
        </div>
      </div>

      <!-- Form Creazione/Modifica Campionato -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <h4 class="text-sm font-black mb-4 pb-2 border-b"
            [ngClass]="theme.mode() === 'light' ? 'text-zinc-900 border-zinc-200' : 'text-white border-white/10'">
          {{ editingId ? 'Modifica Campionato' : 'Crea Nuovo Campionato' }}
        </h4>

        <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Descrizione / Titolo *
              </label>
              <input
                type="text"
                formControlName="description"
                placeholder="Es. MotoGP 2026"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Anno Solare *
              </label>
              <input
                type="number"
                formControlName="year"
                placeholder="2026"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider mb-1.5"
                     [ngClass]="theme.mode() === 'light' ? 'text-zinc-700' : 'text-zinc-300'">
                Data Inizio (YYYY-MM-DD) *
              </label>
              <input
                type="date"
                formControlName="start_date"
                class="w-full text-xs font-semibold rounded-xl px-3 py-2.5 border outline-none transition"
                [ngClass]="theme.mode() === 'light'
                  ? 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                  : 'bg-zinc-900 border-white/15 text-white focus:border-red-500'" />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || saving"
              class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2">
              <i class="fa-solid" [ngClass]="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
              <span>{{ editingId ? 'Salva Modifiche' : 'Aggiungi Campionato' }}</span>
            </button>

            <button
              type="button"
              *ngIf="editingId"
              (click)="resetForm()"
              class="px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'">
              Annulla
            </button>
          </div>
        </form>
      </div>

      <!-- Elenco Campionati -->
      <div class="rounded-2xl p-4 sm:p-5 border"
           [ngClass]="theme.mode() === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#141720] border-white/10 shadow-md'">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-black m-0" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
            Campionati Registrati ({{ championships.length }})
          </h4>

          <button
            type="button"
            (click)="loadChampionships()"
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
          <p class="text-xs mt-2 font-medium">Caricamento campionati...</p>
        </div>

        <div *ngIf="!loading && championships.length === 0" class="py-12 text-center text-zinc-400">
          Nessun campionato registrato.
        </div>

        <div *ngIf="!loading && championships.length > 0" class="overflow-x-auto rounded-xl border"
             [ngClass]="theme.mode() === 'light' ? 'border-zinc-200' : 'border-white/10'">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr [ngClass]="theme.mode() === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900/90 text-zinc-400'">
                <th class="p-3 font-bold uppercase tracking-wider text-center w-16">ID</th>
                <th class="p-3 font-bold uppercase tracking-wider">Titolo / Descrizione</th>
                <th class="p-3 font-bold uppercase tracking-wider text-center">Anno</th>
                <th class="p-3 font-bold uppercase tracking-wider">Data Inizio</th>
                <th class="p-3 font-bold uppercase tracking-wider text-right w-24">Azioni</th>
              </tr>
            </thead>
            <tbody class="divide-y" [ngClass]="theme.mode() === 'light' ? 'divide-zinc-200' : 'divide-white/5'">
              <tr *ngFor="let c of championships"
                  class="transition-colors"
                  [ngClass]="theme.mode() === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.02]'">
                <td class="p-3 text-center font-mono font-bold text-zinc-400">
                  {{ c.id }}
                </td>
                <td class="p-3">
                  <div class="font-black text-sm" [ngClass]="theme.mode() === 'light' ? 'text-zinc-900' : 'text-white'">
                    {{ c.description }}
                  </div>
                </td>
                <td class="p-3 text-center font-bold">
                  {{ c.year }}
                </td>
                <td class="p-3 font-mono text-zinc-400">
                  {{ c.start_date }}
                </td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      (click)="edit(c)"
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                      [ngClass]="theme.mode() === 'light' ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-white/10 hover:bg-white/15 text-zinc-300'"
                      title="Modifica">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button
                      type="button"
                      (click)="deleteChamp(c)"
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer"
                      [ngClass]="theme.mode() === 'light' ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'"
                      title="Elimina">
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
  `
})
export class ChampionshipAdminComponent implements OnInit {
  championships: AdminChampionship[] = [];
  form: FormGroup;
  editingId: number | null = null;
  loading = false;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    public theme: ThemeService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      start_date: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]]
    });
  }

  ngOnInit(): void {
    this.loadChampionships();
  }

  loadChampionships(): void {
    this.loading = true;
    this.adminService.getChampionships().subscribe({
      next: (champs) => {
        this.championships = champs || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching championships', err);
        this.snackBar.open('Errore caricamento campionati', 'Chiudi', { duration: 4000 });
      }
    });
  }

  resetForm(): void {
    this.form.reset({
      year: new Date().getFullYear(),
      description: '',
      start_date: ''
    });
    this.editingId = null;
  }

  edit(c: AdminChampionship): void {
    this.editingId = c.id ?? null;
    let sDate = c.start_date;
    if (sDate && sDate.includes('T')) {
      sDate = sDate.split('T')[0];
    }
    this.form.patchValue({
      description: c.description,
      start_date: sDate,
      year: c.year
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const val = this.form.value;
    const payload: AdminChampionship = {
      description: val.description,
      start_date: val.start_date,
      year: val.year
    };

    if (this.editingId == null) {
      this.adminService.createChampionship(payload).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Campionato creato!', 'OK', { duration: 3000 });
          this.loadChampionships();
          this.resetForm();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error creating championship', err);
          this.snackBar.open(err?.error?.message || 'Errore creazione campionato', 'Chiudi', { duration: 4000 });
        }
      });
    } else {
      this.adminService.updateChampionship(this.editingId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.snackBar.open('Campionato aggiornato!', 'OK', { duration: 3000 });
          this.loadChampionships();
          this.resetForm();
        },
        error: (err) => {
          this.saving = false;
          console.error('Error updating championship', err);
          this.snackBar.open(err?.error?.message || 'Errore aggiornamento campionato', 'Chiudi', { duration: 4000 });
        }
      });
    }
  }

  deleteChamp(c: AdminChampionship): void {
    const ok = confirm(`Eliminare il campionato "${c.description}"?`);
    if (!ok) return;

    this.adminService.deleteChampionship(c.id!).subscribe({
      next: () => {
        this.snackBar.open('Campionato eliminato!', 'OK', { duration: 3000 });
        this.loadChampionships();
      },
      error: (err) => {
        console.error('Error deleting championship', err);
        this.snackBar.open(err?.error?.message || 'Errore eliminazione (contiene gare o team associati)', 'Chiudi', { duration: 5000 });
      }
    });
  }
}
