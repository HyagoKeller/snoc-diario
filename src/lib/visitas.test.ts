import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validarSaida } from "./visitas";

describe("Assinatura de saída no tablet", () => {
  it("não permite check-out sem assinatura", () => {
    assert.notEqual(validarSaida(undefined), null);
  });
  it("permite check-out com assinatura PNG não vazia", () => {
    assert.equal(validarSaida(new File(["assinatura"], "saida.png", { type: "image/png" })), null);
  });
});