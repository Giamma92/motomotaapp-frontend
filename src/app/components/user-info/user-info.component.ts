import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <mat-card *ngIf="userInfo; else notLoggedIn">
      <mat-card-title>User Information</mat-card-title>
      <mat-card-content>
        <p><strong>Username:</strong> {{ userInfo.username }}</p>
        <p><strong>Email:</strong> {{ userInfo.email }}</p>
        <!-- Add additional fields as needed -->
      </mat-card-content>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="goToDashboard()">Back to Dashboard</button>
        <button mat-raised-button color="warn" (click)="logout()">Logout</button>
      </mat-card-actions>
    </mat-card>
    <ng-template #notLoggedIn>
      <mat-card>
        <mat-card-title>No User Info Available</mat-card-title>
        <mat-card-content>
          <p>You are not logged in.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="accent" (click)="goToLogin()">Login</button>
        </mat-card-actions>
      </mat-card>
    </ng-template>
  `,
  styles: [`
    mat-card {
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
    }
  `]
})
export class UserInfoComponent implements OnInit {
  userInfo: UserInfo | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.getUserInfo().subscribe({
      next: (data: UserInfo) => this.userInfo = data,
      error: (err) => {
        console.error('Error fetching user info:', err);
        this.userInfo = null;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Navigate back to the dashboard
  goToDashboard(): void {
    this.router.navigate(['/']);
  }
}
