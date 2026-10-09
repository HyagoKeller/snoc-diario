import { describe, expect, test } from "bun:test";
import { invgateAuthorization, invgateBaseUrl } from "./invgate-auth.server";

describe("InvGate API credentials", () => {
  test("Basic uses the credential username and API key", () => {
    expect(invgateAuthorization("api-user", "api-key", undefined)).toBe("Basic YXBpLXVzZXI6YXBpLWtleQ==");
  });
  test("incomplete Basic credentials do not fall back to another identity", () => {
    expect(invgateAuthorization("api-user", undefined, "old-token")).toBeNull();
    expect(invgateAuthorization(undefined, "api-key", "old-token")).toBeNull();
  });
  test("existing token authentication remains compatible", () => {
    expect(invgateAuthorization(undefined, undefined, "old-token")).toBe("Bearer old-token");
    expect(invgateAuthorization(undefined, undefined, "api-user:api-key")).toBe("Basic YXBpLXVzZXI6YXBpLWtleQ==");
  });
  test("credentials are sent only to HTTPS without embedded credentials", () => {
    expect(invgateBaseUrl("https://example.invgate.net/")).toBe("https://example.invgate.net");
    expect(invgateBaseUrl("http://example.invgate.net")).toBeNull();
    expect(invgateBaseUrl("https://user:pass@example.invgate.net")).toBeNull();
  });
});