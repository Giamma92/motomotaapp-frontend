import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jwtDecode}  from 'jwt-decode';

interface TokenPayload {
  exp: number;
  // other token properties if needed...
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        const currentTime = Date.now() / 1000; // current time in seconds
        if (decoded.exp && decoded.exp < currentTime) {
          // Token has expired.
          this.authService.logout();
          return this.router.parseUrl('/login');
        }
        // Token exists and is not expired.
        return true;
      } catch (error) {
        console.error('Error decoding token:', error);
        this.authService.logout();
        return this.router.parseUrl('/login');
      }
    } else {
      return this.router.parseUrl('/login');
    }
  }
}

