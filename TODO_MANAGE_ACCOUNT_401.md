# TODO – 401 bei „Manage Account“ / Self-Service (Keycloak)

> Handoff-Notiz zum Weitermachen. Stand: 2026-07-05

## Symptom
- Nach Klick auf **„Manage Account“** (My-Profile-Seite) bzw. im Self-Service-Flow kommt weiterhin
  ein **HTTP 401**.
- Noch **unklar, welcher Request** die 401 liefert. Das muss zuerst geklärt werden
  (Browser-DevTools → Network → die rot markierte Anfrage ansehen: URL, Status, Response).

## Was bereits verifiziert wurde (funktioniert server-seitig) ✅
- `account-console`-Client im Realm ist **enabled**, `baseUrl=/realms/vibes-mobility/account/`,
  redirectUris `['/realms/vibes-mobility/account/*']`.
- Redirect-URI-Validierung für `/account`, `/account/` und `/account?referrer=...` liefert die
  Login-Seite (kein „Invalid parameter: redirect_uri“).
- Account-Console-SPA wird ausgeliefert (`GET /realms/vibes-mobility/account/` → 200, index.html).
- SMTP/MailHog: Realm lädt `smtpServer`; Testmail (`execute-actions-email`) landet in MailHog.
- Frontend-Build ist grün.
- Keycloak wurde per `--force-recreate` frisch mit aktuellem Realm gestartet.

## Konfiguration (Ist)
- Frontend `src/environments/environments.ts`: `keycloak.url=http://localhost:8081`,
  `realm=vibes-mobility`, `clientId=vibes-mobility-ui`.
- `main.ts`: `provideKeycloak` mit `onLoad: 'check-sso'`, `pkceMethod: 'S256'`,
  `silentCheckSsoRedirectUri = origin + '/assets/silent-check-sso.html'`.
- API läuft auf `http://localhost:8080`, Bearer-Token via `includeBearerTokenInterceptor`
  (Condition `apiBearerCondition`).

## Zu prüfende Hypothesen für die 401
1. **API-401, nicht Keycloak-401:** Der Button navigiert per `window.location.href` weg; evtl. ist
   die 401 in Wahrheit ein **`GET`/`PUT /user`** o.ä. auf die App-API (`:8080`), z.B. weil das
   Access-Token abgelaufen/nicht mitgeschickt wird.
   - Prüfen: Kommt die 401 von `localhost:8080/...` oder `localhost:8081/...`?
   - Backend erwartet Keycloak-Token (Issuer/Audience). Token-Claims prüfen (`aud`, `azp`, `iss`).
2. **Audience/Issuer-Mismatch:** Backend `JwtBearer` validiert Issuer
   `http://localhost:8081/realms/vibes-mobility` und ggf. Audience. Falls das Frontend-Token
   `aud` nicht den vom Backend erwarteten Wert hat → 401 auf API-Calls.
   - Datei: `vibes-mobility/vibes-mobility-api/Program.cs` (JwtBearer-Setup) und
     `appsettings.Development.json` (Keycloak-Authority/Audience).
   - Läuft die **API im Container** noch mit alter Config? Ggf. `docker compose up -d --build`.
3. **Token vom falschen Issuer:** Wenn API-Container Keycloak über internen Hostnamen
   (`vibes_mobility_keycloak:8080`) erwartet, das Frontend-Token aber Issuer `localhost:8081` hat,
   scheitert die Issuer-Validierung. Prüfen: `ValidIssuer`/`Authority`/`MetadataAddress` +
   `ValidateIssuer`. Ggf. `Authority=localhost:8081` konsistent halten.
4. **Account-Console-401:** Falls die 401 wirklich von `:8081/.../account` kommt: Session/Cookie
   fehlt (nicht eingeloggt) → einmal sauber neu einloggen und erneut testen.
5. **Uhrzeit/Token-Expiry:** System-Datum steht auf **2026** – falls Keycloak/Token-Validierung
   Zeitbezug hat, Clock-Skew prüfen (unwahrscheinlich, aber notieren).

## Nächste konkrete Schritte
1. In DevTools die 401-Anfrage identifizieren (Host `:8080` vs `:8081`, Pfad, Response-Body).
2. Access-Token dekodieren (`aud`, `iss`, `azp`, `exp`) und mit Backend-Erwartung abgleichen.
3. Backend-Auth-Config gegen Token abgleichen:
   - `vibes-mobility/vibes-mobility-api/Program.cs`
   - `vibes-mobility/vibes-mobility-api/appsettings.Development.json`
4. Prüfen, ob der **laufende API-Container** die aktuelle Config nutzt
   (`docker compose up -d --build vibes_mobility_api`).
5. Fix umsetzen (Issuer/Audience/Authority angleichen **oder** in Keycloak passende Audience/Client-
   Scope-Mapper ergänzen), dann API-Call erneut testen (200).

## Nützliche Kommandos
```bash
# Container-Status
docker ps --format '{{.Names}}\t{{.Status}}' | grep mobility

# Admin-Token (master)
curl -s -X POST http://localhost:8081/realms/master/protocol/openid-connect/token \
  -d grant_type=password -d client_id=admin-cli -d username=admin -d password=admin

# User-Token (Direct Access Grant) zum Claim-Check
curl -s -X POST http://localhost:8081/realms/vibes-mobility/protocol/openid-connect/token \
  -d grant_type=password -d client_id=vibes-mobility-ui \
  -d username=agent.user -d password=agent
# -> access_token bei jwt.io / base64-decode ansehen (aud/iss/azp/exp)

# API mit Token testen
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/vehicle \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Relevante Dateien
- Frontend: `src/app/components/user-profile/user-profile.component.{ts,html}`,
  `src/app/components/_common/_service/authentication.service.ts`, `src/main.ts`,
  `src/environments/environments.ts`
- Backend: `vibes-mobility/vibes-mobility-api/Program.cs`,
  `vibes-mobility/vibes-mobility-api/appsettings.Development.json`
- Keycloak: `vibes-mobility/keycloak/import/vibes-mobility-realm.json`
- Doku: `KEYCLOAK_INTEGRATION.md` (Deep Dive „Self-Service & E-Mail (SMTP)“)
