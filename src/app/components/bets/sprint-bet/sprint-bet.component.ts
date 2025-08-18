// src/app/sprint-bet/sprint-bet.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseBetComponent } from '../base-bet.component';

@Component({
  selector: 'app-sprint-bet',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: '../bets.component.html',
  styleUrl: '../bets.component.scss'
})
export class SprintBetComponent extends BaseBetComponent implements OnInit {
  betForm = this.fb.group({
    rider_id: ['', Validators.required],
    position: ['', Validators.required],
    points: ['', Validators.required]
  });
  betType = 'sprint' as const;

  override get removeRaceRider() {return false;}
  override get formTitle() {return 'bets.title.sprint';}
  override get formSubtitle() { return 'bets.subtitle.sprint'; }
  override get betEndpoint() { return 'sprint_bet'; }
  override get maxPointsPerBet() { return this.championshipConfig?.bets_limit_sprint_points || 0; }
  override get maxBetsPerRace() { return this.championshipConfig?.bets_limit_sprint_race || 0; }
  override get maxBetsPerPilot() { return this.championshipConfig?.bets_limit_sprint_driver || 0; }

  // Keep only sprint-specific overrides
}
