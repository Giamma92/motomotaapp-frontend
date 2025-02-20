import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { BetResult } from '../../../services/race-detail.service';
import { ChampionshipRider, Rider } from '../../../services/dashboard.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Existing Bets</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="data.bets" class="mat-elevation-z4">
        <ng-container matColumnDef="rider">
          <th mat-header-cell *matHeaderCellDef> Rider </th>
          <td mat-cell *matCellDef="let bet">
            {{ getRiderName(bet.rider_id) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef> Position </th>
          <td mat-cell *matCellDef="let bet"> {{ bet.position }} </td>
        </ng-container>

        <ng-container matColumnDef="points">
          <th mat-header-cell *matHeaderCellDef> Points </th>
          <td mat-cell *matCellDef="let bet"> {{ bet.points }} </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-raised-button
        mat-dialog-close
        color="primary"
        class="close-button"
      >
        Close
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    table {
      width: 100%;
      margin: 1rem 0;
    }
    th.mat-header-cell {
      background-color: #f5f5f5;
    }
    .close-button {
      margin: 8px;
      transition: all 0.2s ease;
    }
    .close-button:hover {
      transform: translateY(-1px);
    }
  `]
})
export class ExistingBetsModalComponent {
  displayedColumns: string[] = ['rider', 'position', 'points'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { bets: BetResult[], riders: ChampionshipRider[] }) {}

  getRiderName(riderId: number): string {
    const rider = this.data.riders.find(r => r.rider_id.id === riderId)?.rider_id;
    return rider ? `${rider.first_name} ${rider.last_name}` : 'Unknown Rider';
  }
}
