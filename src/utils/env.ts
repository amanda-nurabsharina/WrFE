export const getEnvValue = (key: string): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return window?.Cypress ? window?.Cypress?.env(key) : import.meta.env[key];
};

export const apiURL = (path = "") => {
  let baseUrl = getEnvValue("VITE_API_URL");
  if (baseUrl && !baseUrl.endsWith("/")) {
    baseUrl += "/";
  }
  return new URL(path, baseUrl);
};

export const isProduction = !window?.Cypress && import.meta.env.MODE === "production";
export const isDevelopment = !window?.Cypress && import.meta.env.MODE === "development";
