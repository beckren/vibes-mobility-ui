# Mobile Plan: Capacitor + Mobile Subset

Angular 19 App mit Capacitor wrappen, ein dediziertes Mobile-Layout (Bottom-Nav statt Sidebar) einführen, und die Field-Worker-relevanten Screens responsive machen. Admin-Screens bleiben Desktop-only und werden nicht angefasst.

---

## Phase 1 – Capacitor Setup

1. Dependencies installieren: `npm install @capacitor/core @capacitor/cli`
2. `npx cap init` ausführen (App-Name, Bundle-ID konfigurieren)
3. `capacitor.config.ts` anlegen — `webDir: "dist/vibes-mobility-ui/browser"`
4. Platforms hinzufügen: `npx cap add android` / `npx cap add ios`
5. `package.json` um Script ergänzen: `"build:mobile": "ng build && npx cap sync"`

---

## Phase 2 – Platform Detection & Mobile Layout

6. `PlatformService` in `src/app/core/services/platform.service.ts` erstellen
   - Nutzt `Capacitor.getPlatform()` → `'ios' | 'android' | 'web'`
   - Exposed `isMobile: boolean` als Angular Signal
7. `MobileLayoutComponent` in `src/app/layouts/mobile-layout/` erstellen
   - Kein Sidebar
   - Bottom Navigation Bar (5 Tabs: Home, Check-Out, Check-In, Cars, Profil)
   - Gleicher `AuthGuard` wie Default-Layout
8. In `app.routes.ts`: zur Laufzeit per `PlatformService` zwischen `DefaultLayoutComponent` und `MobileLayoutComponent` wählen — **keine separaten URLs**, gleiche Routen für Desktop und Mobile

---

## Phase 3 – Responsive Fixes (Mobile Subset)

| Screen | Status | Maßnahme |
|---|---|---|
| `check-in` | Anpassung nötig | MatStepper vertikal, Form-Felder full-width |
| `check-out` | Anpassung nötig | Stepper + UploadOptions touch-freundlich |
| `damage-marker` | 850px-Breakpoint ✓ | Nur verifizieren |
| `car-status` | Mobile-Cards ✓ | Nur verifizieren |
| `available-vehicles` | Mobile-Cards ✓ | Nur verifizieren |
| `login` / `reset-password` | Wahrscheinlich ok | Verifizieren |

---

## Phase 4 – Native Plugins (optional, nachträglich)

9. `@capacitor/camera` → Damage-Marker mit nativer Kamera statt `<input type="file">`
10. `@capacitor/push-notifications` → Push-Benachrichtigungen
11. `@capacitor/geolocation` → Fahrzeug-Standort

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `package.json` | Capacitor-Dependencies + Build-Script |
| `capacitor.config.ts` | Neu erstellen |
| `src/app/core/services/platform.service.ts` | Neu erstellen |
| `src/app/layouts/mobile-layout/` | Neu erstellen |
| `src/app/layouts/default-layout/default-layout.component.ts` | Platform-Check einbauen |
| `src/app/app.routes.ts` | Layout-Switching per Platform |
| `src/app/components/check-in/` | Responsive Fixes |
| `src/app/components/check-out/` | Responsive Fixes |

---

## Verification

1. `ng build` fehlerfrei
2. `npx cap sync` überträgt Build erfolgreich
3. Emulator-Test auf 375px: Login → Check-In → Damage-Marker → Check-Out
4. `ng test` — bestehende Unit Tests bleiben grün

---

## Scope-Abgrenzung

**Eingeschlossen (Field-Worker-Screens):**
- `check-in`, `check-out`, `damage-marker`, `car-status`, `available-vehicles`, `login`, `reset-password`, `forgot-password`

**Ausgeschlossen (Admin-Screens, Desktop-only):**
- `users-table`, `edit-vehicle`, `add-vehicle`, `update-fees`, `rental-lists`, `edit-user`, `add-user`, `vehicle-maintenance-history`, `vehicle-rental-history`

> Phase 4 (Native Plugins) ist optional und jederzeit nachrüstbar ohne Architekturänderung.
