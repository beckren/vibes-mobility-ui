import { Injectable, inject } from '@angular/core';
import Keycloak from 'keycloak-js';

import { User } from '../_model/user';

/** Für die App relevante Keycloak-Token-Claims (Standard-OIDC + Custom `Permission`). */
interface VmTokenClaims {
    Permission?: string | string[];
    given_name?: string;
    family_name?: string;
    email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    private readonly keycloak = inject(Keycloak);

    public get isAuthenticated(): boolean {
        return this.keycloak.authenticated ?? false;
    }

    public get permissions(): string[] {
        const claim = (this.keycloak.tokenParsed as VmTokenClaims | undefined)?.Permission;
        if (Array.isArray(claim)) {
            return claim;
        }
        return typeof claim === 'string' ? [claim] : [];
    }

    public hasPermission(permission: string): boolean {
        return this.permissions.includes(permission);
    }

    public get userValue(): User | null {
        if (!this.keycloak.authenticated) {
            return null;
        }
        const claims = (this.keycloak.tokenParsed ?? {}) as VmTokenClaims;
        return {
            firstname: claims.given_name,
            lastname: claims.family_name,
            email: claims.email,
            roles: this.keycloak.realmAccess?.roles ?? []
        };
    }

    login(redirectUri: string = window.location.href): Promise<void> {
        return this.keycloak.login({ redirectUri });
    }

    logout(): Promise<void> {
        return this.keycloak.logout({ redirectUri: window.location.origin });
    }

    getAccessToken(): string | null {
        return this.keycloak.token ?? null;
    }

    /** Opens the Keycloak Account Console (self-service: profile, email, password, 2FA, sessions). */
    manageAccount(): Promise<void> {
        return this.keycloak.accountManagement();
    }

    /** Triggers the Keycloak "update password" required-action flow. */
    changePassword(redirectUri: string = window.location.href): Promise<void> {
        return this.keycloak.login({ action: 'UPDATE_PASSWORD', redirectUri });
    }

    /** Triggers the Keycloak "update profile" flow (name, email). */
    updateProfile(redirectUri: string = window.location.href): Promise<void> {
        return this.keycloak.login({ action: 'UPDATE_PROFILE', redirectUri });
    }
}
