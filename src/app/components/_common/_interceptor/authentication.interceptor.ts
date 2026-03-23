import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthenticationService } from '../_service/authentication.service';

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authenticationService: AuthenticationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip adding auth header for login and refresh endpoints
    if (req.url.includes('/authentication/login') || req.url.includes('/authentication/refresh')) {
      return next.handle(req);
    }

    const token = this.authenticationService.getAccessToken();
    let authReq = req;

    if (token) {
      authReq = this.addTokenHeader(req, token);
    }
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !authReq.url.includes('/authentication/refresh')) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authenticationService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;

          const newToken = response?.accessToken;
          if (!newToken) {
            this.authenticationService.logout();
            return throwError(() => new Error('No token returned'));
          }

          this.authenticationService.setAccessToken(newToken);
          this.refreshTokenSubject.next(newToken);

          return next.handle(this.addTokenHeader(request, newToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authenticationService.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(this.addTokenHeader(request, token!)))
      );
    }
  }
}
