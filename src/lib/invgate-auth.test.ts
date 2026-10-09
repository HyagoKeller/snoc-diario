import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { invgateAuthorization, invgateBaseUrl } from "./invgate-auth.server";

describe("InvGate API credentials", () => {
  test("Basic uses the credential username and API key", () => {
    assert.equal(invgateAuthorization("api-user", "api-key", undefined), "Basic YXBpLXVzZXI6YXBpLWtleQ==");
  });
  test("incomplete Basic credentials do not fall back to another identity", () => {
    assert.equal(invgateAuthorization("api-user", undefined, "old-token"), null);
    assert.equal(invgateAuthorization(undefined, "api-key", "old-token"), null);
  });
  test("existing token authentication remains compatible", () => {
    assert.equal(invgateAuthorization(undefined, undefined, "old-token"), "Bearer old-token");
    assert.equal(invgateAuthorization(undefined, undefined, "api-user:api-key"), "Basic YXBpLXVzZXI6YXBpLWtleQ==");
  });
  test("credentials are sent only to HTTPS without embedded credentials", () => {
    assert.equal(invgateBaseUrl("https://example.invgate.net/"), "https://example.invgate.net");
    assert.equal(invgateBaseUrl("http://example.invgate.net"), null);
    assert.equal(invgateBaseUrl("https://user:pass@example.invgate.net"), null);
  });
});