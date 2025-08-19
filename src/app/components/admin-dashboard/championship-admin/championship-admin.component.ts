import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
   // Use MatSnackBar for notifications; you can replace this with your NotificationService if preferred
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { ChampionshipService } from '../../../services/championship.service';

// Basic interface matching your table schema
interface Championship {
  id?: number;
  description: string;
  start_date: string;
  year: number;
}

@Component({
  selector: 'app-championship-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatDividerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <mat-card class="champ-admin-card" @fadeIn>
      <mat-card-header>
        <mat-card-title>{{ 'admin.championships.manage' | t }}</mat-card-title>
        <mat-card-subtitle>{{ 'admin.championships.subtitle' | t }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Filter bar -->
        <div class="filter-bar">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'admin.search' | t }}</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="{{ 'admin.searchPlaceholder' | t }}" />
            <i class="fa-solid fa-search" matSuffix></i>
          </mat-form-field>
        </div>

        <mat-divider></mat-divider>

        <!-- Form to add/update championships -->
        <form [formGroup]="form" (ngSubmit)="save()" class="champ-form">
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'admin.championships.description' | t }}</mat-label>
              <input matInput formControlName="description" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'admin.championships.startDate' | t }}</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="start_date" />
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'admin.championships.year' | t }}</mat-label>
              <input matInput type="number" formControlName="year" />
            </mat-form-field>
          </div>

          <mat-card-actions align="start">
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
              {{ editingId ? ('admin.championships.saveBtn' | t) : ('admin.championships.addBtn' | t) }}
            </button>
            <button mat-stroked-button type="button" (click)="resetForm()" *ngIf="editingId">
              {{ 'admin.cancel' | t }}
            </button>
          </mat-card-actions>
        </form>

        <mat-divider></mat-divider>

        <!-- Championship list -->
        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z2">
            <!-- Description column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> {{ 'admin.championships.description' | t }} </th>
              <td mat-cell *matCellDef="let champ">{{ champ.description }}</td>
            </ng-container>

            <!-- Start date column -->
            <ng-container matColumnDef="start_date">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> {{ 'admin.championships.startDate' | t }} </th>
              <td mat-cell *matCellDef="let champ">{{ champ.start_date | date:'yyyy-MM-dd' }}</td>
            </ng-container>

            <!-- Year column -->
            <ng-container matColumnDef="year">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> {{ 'admin.championships.year' | t }} </th>
              <td mat-cell *matCellDef="let champ">{{ champ.year }}</td>
            </ng-container>

            <!-- Actions column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> {{ 'admin.championships.actions' | t }} </th>
              <td mat-cell *matCellDef="let champ">
                <button mat-icon-button color="accent" (click)="edit(champ)" matTooltip="{{ 'admin.edit' | t }}">
                  <i class="fa-solid fa-pencil"></i>
                </button>
                <button mat-icon-button color="warn" (click)="delete(champ)" matTooltip="{{ 'admin.delete' | t }}">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </div>

        <mat-paginator [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons></mat-paginator>
      </mat-card-content>
    </mat-card>

  `,
  styles: [`
    .champ-admin-card {
      margin: 1rem;
    }

    .filter-bar {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .champ-form {
      margin-top: 1rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .table-wrapper {
      overflow-x: auto;
      margin-top: 1rem;
    }

    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ChampionshipAdminComponent implements OnInit, AfterViewInit  {
  championships: Championship[] = [];
  displayedColumns: string[] = ['description', 'start_date', 'year', 'actions'];
  form: FormGroup;
  editingId: number | null = null;

  dataSource = new MatTableDataSource<Championship>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(
    private fb: FormBuilder,
    private championshipService: ChampionshipService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      start_date: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900)]]
    });
  }

  ngOnInit(): void {
    this.loadChampionships();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /** Fetch all championships from Supabase */
  private loadChampionships() {
    this.championshipService.getChampionships().subscribe({
      next: (champs: Championship[]) => {
        this.dataSource.data = champs;
      },
      error: (err: any) => {
        console.error('Error fetching championships', err);
        this.snackBar.open('Error loading championships', '', { duration: 4000 });
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }


  /** Reset form and editing state */
  resetForm() {
    this.form.reset();
    this.editingId = null;
  }

  /** Populate form with championship values for editing */
  edit(champ: Championship) {
    this.editingId = champ.id ?? null;
    this.form.patchValue({
      description: champ.description,
      start_date: new Date(champ.start_date),
      year: champ.year
    });
  }

  /** Add or update a championship */
  save() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    const payload: Championship = {
      description: formValue.description,
      start_date: this.toISODate(formValue.start_date),
      year: formValue.year
    };

    if (this.editingId == null) {
      // Add new championship
      this.championshipService.addChampionship(payload).subscribe({
        next: () => {
          this.snackBar.open('Championship added', '', { duration: 3000 });
          this.loadChampionships();
          this.resetForm();
        },
        error: (err: any) => {
          console.error('Error adding championship', err);
          this.snackBar.open('Error adding championship', '', { duration: 4000 });
        }
      });
    } else {
      // Update existing championship
      this.championshipService.updateChampionship(this.editingId, payload).subscribe({
        next: () => {
          this.snackBar.open('Championship updated', '', { duration: 3000 });
          this.loadChampionships();
          this.resetForm();
        },
        error: (err: any) => {
          console.error('Error updating championship', err);
          this.snackBar.open('Error updating championship', '', { duration: 4000 });
        }
      });
    }
  }

  /** Delete a championship after confirmation */
  delete(champ: Championship) {
    // Use a confirmation dialog or simple confirm() as a placeholder
    const ok = confirm('Are you sure you want to delete this championship?');
    if (!ok) return;

    this.championshipService.deleteChampionship(champ.id!).subscribe({
      next: () => {
        this.snackBar.open('Championship deleted', '', { duration: 3000 });
        this.loadChampionships();
      },
      error: (err: any) => {
        console.error('Error deleting championship', err);
        this.snackBar.open('Error deleting championship', '', { duration: 4000 });
      }
    });
  }

  /** Convert Date object to ISO date string (yyyy-MM-dd) */
  private toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
    // Alternatively use Angular DatePipe
  }
}
