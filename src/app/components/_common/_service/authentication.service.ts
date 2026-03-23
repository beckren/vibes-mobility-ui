import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environments';
import { User } from '../_model/user';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private userSubject: BehaviorSubject<User | null>;
    public user: Observable<User | null>;
    private accessToken: string | null = null;
    private isRefreshing = false;
    private refreshTokenSubject = new BehaviorSubject<string | null>(null);

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.userSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('user')!));
        this.user = this.userSubject.asObservable();
    }

    public get userValue() {
        return this.userSubject.value;
    }

    login(email: string, password: string) {

        return this.http.post<User>(`${environment.apiUrl}/authentication/login`, { email, password })
            .pipe(map(user => {
                // store user details and jwt token in local storage to keep user logged in between page refreshes
                localStorage.setItem('userToken', JSON.stringify(user));
                localStorage.setItem('userName', email.substring(0, email.indexOf("@")));

                this.userSubject.next(user);
                return user;
            }));
    }

    logout() {
        // remove user from local storage and set current user to null
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        this.userSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    register(user: User) {
        return this.http.post(`${environment.apiUrl}/users/register`, user);
    }

    getAll() {
        return this.http.get<User[]>(`${environment.apiUrl}/users`);
    }

    getByEmail(email: string) {
        return this.http.get<User>(`${environment.apiUrl}/users/${email}`);
    }

    update(email: string, params: any) {
        return this.http.put(`${environment.apiUrl}/users/${email}`, params)
            .pipe(map(x => {
                // update stored user if the logged in user updated their own record
                if (email == this.userValue?.email) {
                    // update local storage
                    const user = { ...this.userValue, ...params };
                    localStorage.setItem('user', JSON.stringify(user));

                    // publish updated user to subscribers
                    this.userSubject.next(user);
                }
                return x;
            }));
    }

    refreshToken(): Observable<{ accessToken: string } | null> {
        if (this.isRefreshing) {
            return this.refreshTokenSubject.asObservable().pipe(
                map(token => token ? { accessToken: token } : null)
            );
        }

        this.isRefreshing = true;
        return this.http.post<{ accessToken: string }>('/authentication/refresh', {}, { withCredentials: true }).pipe(
            tap(response => {
                this.setAccessToken(response.accessToken);
                this.refreshTokenSubject.next(response.accessToken);
                this.isRefreshing = false;
            }),
            catchError(err => {
                this.isRefreshing = false;
                this.logout();
                return of(null);
            })
        );
    }

    setAccessToken(accessToken: string) {
        this.accessToken = accessToken;
    }

    getAccessToken(): string | null {
        const tokenString = localStorage.getItem("userToken");
        if (tokenString) {
            try {
                const tokenObject = JSON.parse(tokenString);
                // Token is inside result object: { result: { token: "..." } }
                const result = tokenObject.result || tokenObject;
                const token = result.token || result.accessToken || result.access_token || result.jwt;
                return token || null;
            } catch (e) {
                console.error('Failed to parse token from localStorage', e);
                return null;
            }
        }
        return this.accessToken;
    }

    delete(email: string) {
        return this.http.delete(`${environment.apiUrl}/users/${email}`)
            .pipe(map(x => {
                // auto logout if the logged in user deleted their own record
                if (email == this.userValue?.email) {
                    this.logout();
                }
                return x;
            }));
    }
}