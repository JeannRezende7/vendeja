/**
 * Retorna a URL base da API baseado no ambiente
 */
export const getApiUrl = (): string => {
  // Se está em produção (Netlify)
  if (window.location.hostname === 'caixafacil.netlify.app') {
    return 'https://caixafacil-production.up.railway.app';
  }
  // Desenvolvimento local
  return 'http://localhost:8080';
};

/**
 * Retorna a URL completa da API com /api
 */
export const getApiBaseUrl = (): string => {
  return `${getApiUrl()}/api`;
};
