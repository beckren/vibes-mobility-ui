import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '../_common/_service/authentication.service';
import { environment } from '../../../environments/environments';


@Injectable({ providedIn: 'root' })
export class AuthGuard {
    constructor(
        private authenticationService: AuthenticationService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (environment.devBypassAuth) {
            return true;
        }
        if (this.authenticationService.isAuthenticated) {
            return true;
        }

        // not authenticated -> redirect to Keycloak login and return to the requested url
        this.authenticationService.login(window.location.origin + state.url);
        return false;
    }
}