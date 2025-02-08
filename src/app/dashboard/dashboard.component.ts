import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PilotService, Pilot } from '../services/pilot.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h2>Pilots</h2>
    <ul>
      <li *ngFor="let pilot of pilots">
        {{ pilot.first_name }} ({{ pilot.last_name }})
      </li>
    </ul>
  `,
  providers: [PilotService],
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit {
  pilots: Pilot[] = [];

  constructor(private pilotService: PilotService) {}

  ngOnInit() {
    this.pilotService.getPilots().subscribe({
      next: (data) => this.pilots = data,
      error: (err) => console.error('Error fetching pilots', err)
    });
  }
}
