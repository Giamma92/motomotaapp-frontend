export const environment = {
  production: false,
  apiUrl: `http://${typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost'}:3000/api`
};
