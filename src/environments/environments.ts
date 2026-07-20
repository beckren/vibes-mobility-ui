export const environment = {
  production: false,
  //apiUrl: 'https://vibes-mobility.onrender.com',
  apiUrl: 'http://localhost:8080',
  devBypassAuth: false,   // keep false so real auth is used
  keycloak: {
    url: 'http://localhost:8081',
    realm: 'vibes-mobility',
    clientId: 'vibes-mobility-ui'
  }
};
