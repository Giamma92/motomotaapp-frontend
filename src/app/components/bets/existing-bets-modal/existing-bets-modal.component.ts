import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { BetResult } from '../../../services/race-detail.service';
import { ChampionshipRider } from '../../../services/dashboard.service';
import { MatButtonModule } from '@angular/material/button';
import { HttpService } from '../../../services/http.service';
import { NotificationServiceService } from '../../../services/notification.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'existingBets.title' | t }}</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="data.bets" class="mat-elevation-z4">
        <ng-container matColumnDef="rider">
          <th mat-header-cell *matHeaderCellDef>{{ 'existingBets.rider' | t }}</th>
          <td mat-cell *matCellDef="let bet">
            {{ getRiderName(bet.rider_id) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="position">
          <th mat-header-cell *matHeaderCellDef>{{ 'existingBets.position' | t }}</th>
          <td mat-cell *matCellDef="let bet"> {{ bet.position }} </td>
        </ng-container>

        <ng-container matColumnDef="points">
          <th mat-header-cell *matHeaderCellDef>{{ 'existingBets.points' | t }}</th>
          <td mat-cell *matCellDef="let bet"> {{ bet.points }} </td>
        </ng-container>

        <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>{{ 'existingBets.actions' | t }}</th>
        <td mat-cell *matCellDef="let bet">
          <button mat-button color="warn" (click)="deleteBet(bet)">{{ 'existingBets.delete' | t }}</button>
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
        {{ 'existingBets.close' | t }}
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
  displayedColumns: string[] = ['rider', 'position', 'points', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<ExistingBetsModalComponent>,
    private http: HttpService,
    private notificationService: NotificationServiceService,
    @Inject(MAT_DIALOG_DATA) public data: {
      bets: BetResult[];
      riders: ChampionshipRider[];
      champId: number;
      raceId: string;
      betEndpoint: string;
    }
  ) {}

  deleteBet(bet: BetResult) {
    const url = `championship/${this.data.champId}/${this.data.betEndpoint}/${this.data.raceId}/${bet.rider_id}`;
    this.http.genericDelete(url).subscribe({
      next: () => {
        // remove the deleted bet locally so the row disappears
        this.data.bets = this.data.bets.filter(b => b.rider_id !== bet.rider_id);
        this.notificationService.showSuccess('bets.deleteSuccess');
        this.dialogRef.close();
      },
      error: (err: any) => {
        console.error('Delete failed', err);
        this.notificationService.showError('bets.deleteFail');
      },
    });
  }

  getRiderName(riderId: number): string {
    const rider = this.data.riders.find(r => r.rider_id.id === riderId)?.rider_id;
    return rider ? `${rider.first_name} ${rider.last_name}` : 'Unknown Rider';
  }
}
