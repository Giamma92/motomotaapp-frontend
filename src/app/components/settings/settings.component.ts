import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChampionshipService, Championship } from '../../services/championship.service';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="settings-container">
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon>
            Settings
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-group">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Select Championship</mat-label>
              <mat-select [(ngModel)]="selectedChampionshipId">
                <mat-option *ngFor="let champ of championships" [value]="champ.id">
                  {{ champ.description }} ({{ champ.year }})
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <!-- Additional inputs can be added here as new form-group blocks -->
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="save()">Save</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      padding: 20px;
    }
    mat-card-header.mat-mdc-card-header {
        background: none;
        border-bottom: none;
        padding-bottom: 20px;
    }
    .settings-card {
      width: 100%;
      max-width: 500px;
      padding: 20px;
    }
    mat-card-header {
      background: rgba(0, 0, 0, 0.05);
      border-bottom: 1px solid #ccc;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      font-weight: bold;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .full-width {
      width: 100%;
    }
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class SettingsComponent implements OnInit {
  championships: Championship[] = [];
  selectedChampionshipId: number = 0;

  constructor(
    private championshipService: ChampionshipService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampionships().subscribe({
      next: (data: Championship[]) => {
        this.championships = data;
        const currentYear = new Date().getFullYear();
        const defaultChamp = data.find(champ => champ.year === currentYear);
        this.selectedChampionshipId = defaultChamp ? defaultChamp.id : data[0]?.id;
      },
      error: (err) => console.error('Error fetching championships', err)
    });
  }

  save(): void {
    this.championshipService.selectedChampionshipId = this.selectedChampionshipId;
  }
}
