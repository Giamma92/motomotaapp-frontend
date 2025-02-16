// src/app/calendar/calendar.component.ts
import { Component, OnInit, ViewChildren, ElementRef, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, CdkDrag, CdkDropList],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Championship Calendar</h1>
      </header>
      <main class="main-content">
      <mat-card class="dashboard-card">

        <!-- Desktop Table -->
        <div class="desktop-view">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Event</th>
                <th>Date</th>
                <th>Qualifying</th>
                <th>Sprint</th>
                <th>Race</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let race of calendar" [class.current-race]="race === calendar[currentRaceIndex]">
                <td class="round-number">{{ race.race_order }}</td>
                <td class="event-info">
                  <div class="event-name">{{ race.race_id.name }}</div>
                  <div class="event-location">
                    <mat-icon>location_on</mat-icon>
                    {{ race.race_id.location }}
                  </div>
                </td>
                <td>{{ race.event_date | date:'mediumDate' }}</td>
                <td>{{ race.qualifications_time || 'TBD' }}</td>
                <td>{{ race.sprint_time || 'TBD' }}</td>
                <td>{{ race.event_time || 'TBD' }}</td>
                <td>
                  <button mat-icon-button color="primary" (click)="goToRaceDetail(race)">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>

      <!-- Modified Mobile Cards - Remove CDK directives -->
      <div class="mobile-view">
        <mat-card #raceCards class="race-card" *ngFor="let race of calendar">
          <mat-card-header>
            <mat-card-title-group class="card-header">
              <div class="header-content">
                <div class="round-badge">Race #{{ race.race_order }}</div>
                <mat-card-title>{{ race.race_id.name }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-icon>event</mat-icon>
                  {{ race.event_date | date:'mediumDate' }}
                </mat-card-subtitle>
              </div>
            </mat-card-title-group>
          </mat-card-header>

          <mat-card-content>
            <div class="race-content">
              <div class="race-details-grid">
                <div class="detail-item">
                  <mat-icon class="detail-icon">sports_motorsports</mat-icon>
                  <div class="detail-text">
                    <span class="detail-label">Race</span>
                    {{ race.event_time || 'TBD' }}
                  </div>
                </div>
                <div class="detail-item">
                  <mat-icon class="detail-icon">flag</mat-icon>
                  <div class="detail-text">
                    <span class="detail-label">Sprint</span>
                    {{ race.sprint_time || 'TBD' }}
                  </div>
                </div>
                <div class="detail-item">
                  <mat-icon class="detail-icon">timer</mat-icon>
                  <div class="detail-text">
                    <span class="detail-label">Qualifying</span>
                    {{ race.qualifications_time || 'TBD' }}
                  </div>
                </div>
              </div>
              <div class="location-section">
                <mat-icon>location_on</mat-icon>
                <span class="location-text">{{ race.race_id.location }}</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="goToRaceDetail(race)" class="action-button">
              View Full Details
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      </main>
    </div>
  `,
  styles: [`
    .main-content {
      color: black;
      padding: 70px 0px 0px 0px;

      .mat-mdc-card-header {
        padding: 0px;
      }
    }

    @media(max-width: 768px) {
      .main-content {
        padding: 140px 0px 0px 0px;
      }
    }

    /* Unified Dashboard Styling */
    .dashboard-container {
      padding: 2rem;
      background: #f5f5f5;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      h1 {
        color: var(--primary-color);
        font-family: 'MotoGP Bold', sans-serif;
        margin: 0;
        font-size: 2rem;
      }
    }

    .dashboard-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(var(--primary-color), 0.1);
      width: 90%;
    }

    .card-header {
      color: var(--primary-color);
      padding: 1.5rem;

      mat-card-title {
        font-family: 'MotoGP Bold' !important;
        display: flex;
        align-items: center;
        gap: 1rem;
      }
    }

    /* Desktop Table Styling */
    .desktop-view {
      display: block;
      padding: 1.5rem;

      @media (max-width: 768px) {
        display: none;  // Hide table on mobile
      }

      .dashboard-table {
        width: 100%;
        border-collapse: collapse;

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background: rgba(var(--primary-color), 0.1);
          color: var(--primary-color);
          font-family: 'MotoGP Bold', sans-serif;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .round-number {
          font-family: 'MotoGP Bold', sans-serif;
          color: var(--primary-color);
        }

        .event-info {

          .event-name {
            font-weight: 500;
          }

          .event-location {
            color: #666;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
          }
        }
      }
    }

    /* Updated Mobile Card Styling */
    .mobile-view {
      display: none;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 1rem 0;
      width: 100%;
      -webkit-overflow-scrolling: auto;
      overscroll-behavior: contain;
      touch-action: pan-x pan-y;
      overflow-y: hidden;

      &::-webkit-scrollbar {
        display: none;
      }

      @media (max-width: 768px) {
        display: flex;
      }

      .race-card {
        scroll-snap-align: start;
        flex: 0 0 85%;
        margin: 0 1rem;
        box-sizing: border-box;
        transition: transform 0.3s ease;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

        &:active {
          transform: none;
        }

        &:first-child {
          margin-left: 2rem;
        }

        &:last-child {
          margin-right: 2rem;
        }

        .card-header {
          padding: 1rem;
          background: linear-gradient(45deg, var(--primary-color), #006db3);
          color: white;

          .header-content {
            width: 100%;

            .round-badge {
              background: rgba(255, 255, 255, 0.2);
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 0.9rem;
              margin-bottom: 8px;
              display: inline-block;
            }

            mat-card-title {
              font-size: 1.4rem;
              margin: 8px 0;
              font-weight: 600;
            }

            mat-card-subtitle {
              color: rgba(255, 255, 255, 0.9);
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.9rem;
            }
          }
        }

        .race-content {
          padding: 1rem;

          .race-details-grid {
            display: grid;
            gap: 1rem;
            margin: 1rem 0;

            .detail-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 8px;

              .detail-icon {
                color: var(--primary-color);
              }

              .detail-text {
                display: flex;
                flex-direction: column;

                .detail-label {
                  font-weight: 500;
                  font-size: 0.9rem;
                  color: #666;
                }
              }
            }
          }

          .location-section {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-top: 1rem;

            mat-icon {
              color: var(--primary-color);
            }

            .location-text {
              font-weight: 500;
            }
          }
        }

        .action-button {
          width: 100%;
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          font-weight: 500;
          transition: all 0.2s ease;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }

    .current-race {
      background: rgba(var(--primary-red), 0.1) !important;
      position: relative;

      &::after {
        content: '•';
        color: var(--primary-red);
        position: absolute;
        right: 1rem;
        font-size: 2rem;
      }
    }

    .mobile-view {
      scroll-behavior: smooth;
    }
  `]
})
export class CalendarComponent implements OnInit, AfterViewInit {
  @ViewChildren('raceCards') raceCards!: QueryList<ElementRef>;
  currentRaceIndex: number = 0;
  calendar: CalendarRace[] = [];

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;
      this.dashboardService.getCalendar(champId).subscribe({
        next: (data: CalendarRace[]) => {
          this.calendar = data;
        },
        error: (err) => {
          console.error('Error fetching calendar data:', err);
          this.calendar = [];
        }
      });
    });
  }

  ngAfterViewInit() {
    this.findCurrentRace();
    setTimeout(() => this.scrollToCurrentRace(), 100); // Allow DOM update
  }

  private findCurrentRace() {
    const now = new Date();
    this.currentRaceIndex = this.calendar.findIndex(race =>
      new Date(race.event_date) >= now
    );
    if (this.currentRaceIndex === -1) {
      this.currentRaceIndex = this.calendar.length - 1; // Show last race if all past
    }
  }

  private scrollToCurrentRace() {
    if (this.raceCards && this.raceCards.length > 0) {
      const mobileView = document.querySelector('.mobile-view') as HTMLElement;
      const raceCard = this.raceCards.toArray()[this.currentRaceIndex].nativeElement;
      const scrollPos = raceCard.offsetLeft - mobileView.offsetWidth / 2 + raceCard.offsetWidth / 2;

      mobileView.scrollTo({
        left: scrollPos,
        behavior: 'smooth'
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);  // Navigates back to the dashboard
  }

  goToRaceDetail(race: CalendarRace): void {
    // Assumes that race.race_id has an 'id' property.
    const calendarRaceId = race.id;
    this.router.navigate(['/race-detail', calendarRaceId]);
  }
}
