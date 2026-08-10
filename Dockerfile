# ── Step 1: Build the Angular app (production) ─────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching). No package-lock.json in the
# repo, so use `npm install` rather than `npm ci`.
COPY package*.json ./
RUN npm install

COPY . .

# Bake the target environment into the build. Defaults keep the local/dev URLs;
# override at build time for a real deployment, e.g.:
#   docker build --build-arg API_URL=https://app.example.com/api \
#                --build-arg KEYCLOAK_URL=https://auth.example.com ...
ARG API_URL=http://localhost:8080
ARG KEYCLOAK_URL=http://localhost:8081
ARG KEYCLOAK_REALM=vibes-mobility
ARG KEYCLOAK_CLIENT_ID=vibes-mobility-ui
RUN printf "export const environment = {\n\
  production: true,\n\
  apiUrl: '%s',\n\
  devBypassAuth: false,\n\
  keycloak: {\n\
    url: '%s',\n\
    realm: '%s',\n\
    clientId: '%s'\n\
  }\n\
};\n" "$API_URL" "$KEYCLOAK_URL" "$KEYCLOAK_REALM" "$KEYCLOAK_CLIENT_ID" \
  > src/environments/environments.ts

# `production` is the default build configuration (see angular.json).
RUN npm run build

# ── Step 2: Serve the static build via Nginx ───────────────────────────────
FROM nginx:alpine AS runtime

# SPA-aware config (deep-link fallback to index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular 19 (application builder) emits the browser bundle under `browser/`.
COPY --from=build /app/dist/vibes-mobility-ui/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
