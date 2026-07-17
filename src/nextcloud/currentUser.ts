import type { Config } from "../config.js";

interface OcsEnvelope<T> {
  ocs: {
    meta: { status: string; statuscode: number; message: string };
    data: T;
  };
}

export async function fetchCurrentUserId(config: Config): Promise<string> {
  const token = Buffer.from(`${config.username}:${config.appPassword}`).toString("base64");

  const response = await fetch(`${config.baseUrl}/ocs/v1.php/cloud/user`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${token}`,
      "OCS-APIRequest": "true",
      Accept: "application/json",
    },
  });

  const envelope = (await response.json()) as OcsEnvelope<{ id: string }>;

  if (!response.ok) {
    throw new Error(`Failed to resolve the current Nextcloud user: ${envelope.ocs.meta.message}`);
  }

  return envelope.ocs.data.id;
}
