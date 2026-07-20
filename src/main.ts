import { bootstrapApplication } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { authReducer } from './app/store/auth/auth.reducer';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideKeycloak,
  createInterceptorCondition,
  IncludeBearerTokenCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  includeBearerTokenInterceptor
} from 'keycloak-angular';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AppComponent } from './app/app.component';
import { environment } from './environments/environments';
// Robust bootstrap: Keycloak-Preflight + Fehlerseite statt leerer Seite.

const apiUrlPattern = new RegExp(
  '^' + environment.apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(/.*)?$',
  'i'
);

const apiBearerCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: apiUrlPattern,
  bearerPrefix: 'Bearer'
});

/**
 * Prueft, ob der Keycloak-Server erreichbar ist, bevor der App-Bootstrap
 * versucht, sich per check-sso zu initialisieren. Ohne diese Pruefung
 * schlaegt provideKeycloak() bei nicht laufendem Keycloak fehl und die
 * App bleibt als leere Seite haengen.
 *
 * Der Request laeuft mit mode: 'no-cors', damit fehlende CORS-Header nicht
 * faelschlich als "nicht erreichbar" gewertet werden: Ein laufender Server
 * liefert eine (opaque) Antwort, ein nicht laufender Server wirft.
 */
async function isKeycloakReachable(timeoutMs = 4000): Promise<boolean> {
  const probeUrl = `${environment.keycloak.url}/realms/${environment.keycloak.realm}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(probeUrl, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Rendert eine verstaendliche Fehlerseite (statt einer leeren Seite),
 * wenn der Start der App fehlschlaegt.
 */
function renderStartupError(message: string): void {
  const host = document.querySelector('app-root') ?? document.body;
  host.innerHTML = `
    <div style="
      font-family: 'Inter', 'Roboto', sans-serif;
      max-width: 560px;
      margin: 12vh auto;
      padding: 32px;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      color: #263238;
      text-align: center;">
      <div style="font-size: 48px; line-height: 1;">&#9888;&#65039;</div>
      <h1 style="font-size: 20px; margin: 16px 0 8px;">Anwendung konnte nicht gestartet werden</h1>
      <p style="margin: 0 0 8px; color: #546e7a;">${message}</p>
      <p style="margin: 0 0 24px; color: #90a4ae; font-size: 13px;">
        Auth-Server (Keycloak): <code>${environment.keycloak.url}</code>
      </p>
      <button id="vm-retry" style="
        cursor: pointer;
        background: #1976d2;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-size: 14px;">Erneut versuchen</button>
    </div>`;
  document.getElementById('vm-retry')?.addEventListener('click', () => window.location.reload());
}

async function main(): Promise<void> {
  if (!(await isKeycloakReachable())) {
    console.error(
      `Keycloak ist unter ${environment.keycloak.url} nicht erreichbar. ` +
      `Bitte den Auth-Server starten (z. B. "docker compose up -d vibes_mobility_keycloak").`
    );
    renderStartupError(
      'Der Auth-Server (Keycloak) ist nicht erreichbar. Bitte starte ihn und versuche es erneut.'
    );
    return;
  }

  try {
    await bootstrapApplication(AppComponent, {
      providers: [
        provideKeycloak({
          config: {
            url: environment.keycloak.url,
            realm: environment.keycloak.realm,
            clientId: environment.keycloak.clientId
          },
          initOptions: {
            onLoad: 'check-sso',
            pkceMethod: 'S256',
            silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html'
          }
        }),
        {
          provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
          useValue: [apiBearerCondition]
        },
        provideStore({ auth: authReducer }),
        importProvidersFrom(
          FormsModule,
          ReactiveFormsModule,
          MatFormFieldModule,
          MatInputModule,
          MatButtonModule,
          MatIconModule
        ),
        provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
        provideRouter(routes),
        provideEffects(),
        provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
        provideAnimationsAsync(),
      ],
    });
  } catch (err) {
    console.error(err);
    renderStartupError(
      'Beim Initialisieren der Anwendung ist ein Fehler aufgetreten. Details stehen in der Browser-Konsole.'
    );
  }
}

main();
