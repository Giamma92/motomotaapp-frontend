import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { LineupsResult } from '../../../services/race-detail.service';
import { MatButtonModule } from '@angular/material/button';
import { ChampionshipRider } from '../../../services/dashboard.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-lineup-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'lineupModal.title' | t }}</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="data.lineups" class="mat-elevation-z4">
        <ng-container matColumnDef="race_rider">
          <th mat-header-cell *matHeaderCellDef>{{ 'lineupModal.raceRider' | t }}</th>
          <td mat-cell *matCellDef="let lineup">
            {{ getRiderName(lineup.race_rider_id) || ('lineupModal.unknownRider' | t) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="qualifying_rider">
          <th mat-header-cell *matHeaderCellDef>{{ 'lineupModal.qualifyingRider' | t }}</th>
          <td mat-cell *matCellDef="let lineup">
            {{ getRiderName(lineup.qualifying_rider_id) || ('lineupModal.unknownRider' | t) }}
          </td>
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
        {{ 'lineupModal.close' | t }}
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
export class LineupModalComponent {
  displayedColumns: string[] = ['race_rider', 'qualifying_rider'];

  constructor(@Inject(MAT_DIALOG_DATA) public data: {lineups: LineupsResult[], riders: ChampionshipRider[]}) {}

  getRiderName(riderId: number): string {
    const rider = this.data.riders.find(r => r.rider_id.id === riderId)?.rider_id;
    return rider ? `${rider.first_name} ${rider.last_name}` : 'Unknown Rider';
  }
}
