import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
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

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
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
        // If already going to reset-password, allow it to avoid redirect loops
        if (state.url === '/reset-password') {
          return true;
        }
        try {
          const user = await firstValueFrom(this.authService.getUserInfo());
          if (user?.pwd_reset === 1) {
            return this.router.parseUrl('/reset-password');
          }
        } catch {}
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

