import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-race',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="race-detail">
      <h2>Race Details for Race ID: {{ raceId }}</h2>
      <!-- Form or controls to place/update bet go here -->
      <button (click)="placeBet()">Place/Update Bet</button>
    </div>
  `,
  styles: [`
    .race-detail {
      padding: 20px;
    }
  `]
})
export class RaceComponent implements OnInit {
  raceId!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.raceId = Number(this.route.snapshot.paramMap.get('id'));
    // Load race details and bet information based on raceId
  }

  placeBet(): void {
    // Handle bet placement logic
    alert(`Place or update bet for race ${this.raceId}`);
  }
}
