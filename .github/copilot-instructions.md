# Copilot Instructions – vibes-mobility-ui

## Projektübersicht

- **Typ**: Angular 19 Single-Page-App (Standalone Components) – Frontend für die Car-Rental-App
- **UI-Bibliothek**: Angular Material (`@angular/material` ~19.1) + CDK
- **State**: NgRx (`@ngrx/store`, `@ngrx/effects`) – aktuell nur ein `auth`-Slice
- **Weitere Libs**: `chart.js` + `ng2-charts`, `moment` + `material-moment-adapter`, `ngx-material-timepicker`, `xng-breadcrumb`
- **Backend**: .NET 8 API (`vibes-mobility`), erreichbar über `environment.apiUrl` (Standard `http://localhost:8080`)

## Befehle

```bash
npm start        # ng serve  → http://localhost:4200
npm run build    # ng build  → dist/
npm run watch    # ng build --watch (development)
npm test         # ng test   (Karma + Jasmine)
ng generate component components/<name> --standalone
```

## Projektstruktur (`src/app/`)

- `components/` – Feature-Komponenten (eine Ordner pro Feature, z.B. `check-out/`, `vehicles-table/`, `dash/`)
- `components/_common/` – **geteilter Kern-Code**:
  - `_service/` – **kanonischer Ort für alle Domain-Services** (siehe unten)
  - `_model/` – geteilte Interfaces/Modelle (`user.ts`, `alert.ts`)
  - `auth.guard.ts` – aktiver Route-Guard
- `layouts/` – `default-layout`, `default-header` (Shell um die geschützten Routen)
- `store/auth/` – NgRx auth-Slice (`actions`, `reducer`, `selectors`)
- `services/` – **nur noch `invoice.service.ts`** (von `check-out` genutzt; übrige Alt-Duplikate wurden entfernt)
- `shared/constants/` – statische Daten (z.B. `countries.ts`)
- `environments/environments.ts` – `apiUrl`, `production`, `devBypassAuth`

## Wichtige Konventionen

### Komponenten
- **Standalone Components** (`standalone: true`), kein NgModule.
- Benötigte Material-/Common-Module direkt im `imports:[]` der Komponente deklarieren.
- Routing über **lazy `loadComponent`** in `app.routes.ts`:
  ```ts
  { path: 'vehicles',
    loadComponent: () => import('./components/vehicles-table/vehicles-table.component')
      .then(m => m.VehiclesTableComponent),
    title: 'Vehicles' }
  ```
- Geschützte Routen sind Kinder von `default-layout` mit `canActivate: [AuthGuard]`.
- Tabellen: `MatTableDataSource` + `MatSort` + `MatPaginator` (Muster siehe `vehicles-table`).

### Services & HTTP
- **Alle Domain-Services liegen in `components/_common/_service/`** und sind `@Injectable({ providedIn: 'root' })`.
  Vorhanden: `authentication`, `user`, `vehicle`, `rental`, `checkout`, `checkin`, `price`, `fee`, `damage`, `maintenance`, `invoice`, `alert`.
- HTTP-Aufrufe geben `Observable<T>` zurück und nutzen `${environment.apiUrl}/<endpoint>`.
- Response-Interfaces direkt in der jeweiligen Service-Datei definieren (z.B. `Vehicle` in `vehicle.service.ts`).
- **Kein manuelles Setzen von Auth-Headern in Services** – der Interceptor übernimmt das (Ausnahmen im Altcode existieren, nicht nachahmen).

### Authentifizierung (Keycloak / OIDC)
- **Login/Logout via Keycloak** (`keycloak-angular` + `keycloak-js`). Init in `src/main.ts` über `provideKeycloak` (Auth Code + PKCE, `onLoad: 'check-sso'`, `silentCheckSsoRedirectUri` → `src/assets/silent-check-sso.html`). Konfig unter `environment.keycloak`.
- **Service**: `components/_common/_service/authentication.service.ts` – dünner Wrapper um die injizierte `Keycloak`-Instanz: `login(redirectUri?)`, `logout()`, `getAccessToken()` (= `keycloak.token`), `isAuthenticated`, `userValue` (aus `tokenParsed`). **Kein** `localStorage`, **kein** `/authentication/*`-Call, **kein** manueller Refresh (die Lib refresht selbst).
- **Interceptor**: kein eigener mehr – `includeBearerTokenInterceptor` aus `keycloak-angular` (in `main.ts` via `withInterceptors`), gefiltert auf `environment.apiUrl` (`INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG`).
- **Guard**: `components/_common/auth.guard.ts` – `isAuthenticated` prüfen, sonst `authenticationService.login(returnUrl)` (Keycloak-Redirect). `environment.devBypassAuth` bleibt respektiert.
- Es gibt **keine** eigenen `login`/`forgot-password`/`reset-password`-Komponenten/Routen mehr – Keycloak übernimmt das.

### NgRx
- Nur `auth`-Slice registriert in `main.ts` (`provideStore({ auth: authReducer })`).
- Actions: `loginSuccess({token})`, `logout`. Selectors: `isAuthenticated`, `getToken`.
- Neue globale State-Slices analog unter `store/<feature>/` anlegen und in `main.ts` registrieren.

### Bootstrapping
- Einstieg: `src/main.ts` via `bootstrapApplication(AppComponent, {...})`.
  Hier werden Store, Effects, Router, HttpClient + Interceptor und Animations provided.
- `app.config.ts` existiert ebenfalls, aber die **aktive** Provider-Liste steht in `main.ts`.

## Stale / Duplicate Files

Die früheren Alt-Duplikate wurden am 2026-08-06 entfernt (`services/auth.service.ts`,
`services/api.service.ts`, `services/fee.service.ts`, `core/interceptors/auth.interceptor.ts`,
`components/_common/_service/auth.guard.ts`). Kanonische Quelle ist ausschließlich
`components/_common/_service/*` bzw. `components/_common/_interceptor/` und
`components/_common/auth.guard.ts`.

| Concern      | Kanonisch (in Benutzung)                                        |
|--------------|-----------------------------------------------------------------|
| Auth-Service | `components/_common/_service/authentication.service.ts`         |
| Interceptor  | `includeBearerTokenInterceptor` (keycloak-angular, in `main.ts`) |
| Auth-Guard   | `components/_common/auth.guard.ts`                              |
| Fee-Service  | `components/_common/_service/fee.service.ts`                    |

**Verbleibende Altlast:** `services/invoice.service.ts` wird noch von `check-out` importiert
(es existiert zusätzlich eine ungenutzte Kopie unter `components/_common/_service/invoice.service.ts`).
Konsolidierung offen – bewusst noch nicht angefasst.

## Verhaltensrichtlinien

### 1. Erst denken, dann coden
- Annahmen explizit benennen. Bei Unsicherheit fragen.
- Bei mehreren Interpretationen: alle aufzeigen, nicht still entscheiden.
- Wenn ein einfacherer Ansatz existiert: benennen. Rückfragen wenn nötig.

### 2. Einfachheit zuerst
- Minimaler Code, der das Problem löst. Nichts Spekulatives.
- Keine Features über das Geforderte hinaus. Keine unnötigen Abstraktionen.

### 3. Chirurgische Änderungen
- Nur anfassen, was nötig ist. Kein „Verbessern" von Nachbar-Code.
- Bestehenden Stil matchen. Neue Services/Guards/Interceptors in `components/_common/` anlegen, NICHT in den veralteten Ordnern.
- Durch EIGENE Änderungen unused gewordene Imports entfernen. Vorher toten Code nur erwähnen.

### 4. Zielgetriebene Umsetzung
- Aufgaben in verifizierbare Ziele transformieren. Bei Mehrstufigem kurzen Plan angeben.
- Nach Änderungen `npm run build` (und ggf. `npm test`) zur Verifikation nutzen.
