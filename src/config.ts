export interface Config {
  baseUrl: string;
  username: string;
  appPassword: string;
}

function requireEnv(env: Record<string, string | undefined>, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const baseUrl = requireEnv(env, "NEXTCLOUD_BASE_URL").replace(/\/+$/, "");
  const username = requireEnv(env, "NEXTCLOUD_USERNAME");
  const appPassword = requireEnv(env, "NEXTCLOUD_APP_PASSWORD");

  return { baseUrl, username, appPassword };
}
