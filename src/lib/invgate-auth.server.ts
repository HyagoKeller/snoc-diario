import { Buffer } from "node:buffer";

/** Credentials are supplied by the server secret store, never browser settings. */
export function invgateAuthorization(username: string | undefined, key: string | undefined, legacyToken: string | undefined): string | null {
  if (username || key) {
    if (!username || !key || username.includes(":")) return null;
    return `Basic ${Buffer.from(`${username}:${key}`, "utf8").toString("base64")}`;
  }
  if (!legacyToken) return null;
  return legacyToken.includes(":")
    ? `Basic ${Buffer.from(legacyToken, "utf8").toString("base64")}`
    : `Bearer ${legacyToken}`;
}

export function invgateBaseUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}