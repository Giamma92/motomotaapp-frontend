// src/app/race-bet/race-bet.component.ts
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
import { MatTooltipModule } from '@angular/material/tooltip';

import { BaseBetComponent } from '../base-bet.component';

@Component({
  selector: 'app-race-bet',
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
    MatTooltipModule
  ],
  templateUrl: '../bets.component.html',
  styleUrl: '../bets.component.scss'
})
export class RaceBetComponent extends BaseBetComponent implements OnInit {
  betForm = this.fb.group({
    rider_id: ['', Validators.required],
    position: ['', Validators.required],
    points: ['', Validators.required]
  });
  betType = 'race' as const;

  override get removeRaceRider() {return true;}
  override get formTitle() {return 'bets.title.race';}
  override get formSubtitle() { return 'bets.subtitle.race'; }
  override get betEndpoint() { return 'race_bet'; }
  override get maxPointsPerBet() { return this.championshipConfig?.bets_limit_points || 0; }
  override get maxBetsPerRace() { return this.championshipConfig?.bets_limit_race || 0; }
  override get maxBetsPerPilot() { return this.championshipConfig?.bets_limit_driver || 0; }


}
