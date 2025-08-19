// src/app/components/admin/admin-dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '../../pipes/translate.pipe';

// Import your entity admin components here:
import { ChampionshipAdminComponent } from './championship-admin/championship-admin.component';
/*import { ChampionshipRiderAdminComponent } from './championship-rider-admin/championship-rider-admin.component';
import { ConfigurationAdminComponent } from './configuration-admin/configuration-admin.component';
import { ConstructorAdminComponent } from './constructor-admin/constructor-admin.component';
import { FantasyTeamAdminComponent } from './fantasy-team-admin/fantasy-team-admin.component';
import { PaymentAdminComponent } from './payment-admin/payment-admin.component';
import { RaceAdminComponent } from './race-admin/race-admin.component';
import { RiderAdminComponent } from './rider-admin/rider-admin.component';
import { UserAdminComponent } from './user-admin/user-admin.component';
import { UserSettingAdminComponent } from './user-setting-admin/user-setting-admin.component';
import { UserRoleAdminComponent } from './user-role-admin/user-role-admin.component';*/
import { style, animate, transition, trigger } from '@angular/animations';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    TranslatePipe,
    MatCardModule,
    // Register each admin subcomponent so they can be used in the template.
    ChampionshipAdminComponent,
    /*ChampionshipRiderAdminComponent,
    ConfigurationAdminComponent,
    ConstructorAdminComponent,
    FantasyTeamAdminComponent,
    PaymentAdminComponent,
    RaceAdminComponent,
    RiderAdminComponent,
    UserAdminComponent,
    UserSettingAdminComponent,
    UserRoleAdminComponent*/
  ],
  template: `
    <mat-card class="admin-dashboard" @fadeIn>
      <mat-card-header>
        <mat-card-title>
        <button (click)="goBack()">
          <i class="fa-solid fa-home"></i>
        </button>
          {{ 'admin.dashboardTitle' | t }}
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-tab-group animationDuration="200ms">
          <mat-tab label="{{ 'admin.championships' | t }}">
            <app-championship-admin></app-championship-admin>
          </mat-tab>
          <mat-tab label="{{ 'admin.championshipRiders' | t }}">
            <!--<app-championship-rider-admin></app-championship-rider-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.configurations' | t }}">
            <!--<app-configuration-admin></app-configuration-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.constructors' | t }}">
            <!--<app-constructor-admin></app-constructor-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.fantasyTeams' | t }}">
            <!--<app-fantasy-team-admin></app-fantasy-team-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.payments' | t }}">
            <!--<app-payment-admin></app-payment-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.races' | t }}">
            <!--<app-race-admin></app-race-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.riders' | t }}">
            <!--<app-rider-admin></app-rider-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.users' | t }}">
            <!--<app-user-admin></app-user-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.userSettings' | t }}">
            <!--<app-user-setting-admin></app-user-setting-admin>-->
          </mat-tab>
          <mat-tab label="{{ 'admin.userRoles' | t }}">
            <!--<app-user-role-admin></app-user-role-admin>-->
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .admin-card {
      margin: 1rem;
    }
    @media (max-width: 600px) {
      .admin-card {
        margin: 0.5rem;
      }
      mat-tab-group {
        font-size: 0.85rem;
      }
    }
  `],
  animations: [
    // Simple fade‑in animation for the dashboard container
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AdminDashboardComponent {

  constructor(private router: Router) {
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

}
