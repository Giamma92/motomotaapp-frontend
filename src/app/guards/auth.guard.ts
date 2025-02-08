import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    // Check for an authentication token using your custom AuthService.
    const token = this.authService.getToken();
    if (token) {
      // If token exists, allow access.
      return true;
    } else {
      // Otherwise, redirect to the login page.
      return this.router.parseUrl('/login');
    }
  }
}
