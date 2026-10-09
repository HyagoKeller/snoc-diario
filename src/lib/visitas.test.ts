import { describe, expect, it } from "bun:test";
import { validarSaida } from "./visitas";

describe("Assinatura de saída no tablet", () => {
  it("não permite check-out sem assinatura", () => {
    expect(validarSaida(undefined)).not.toBeNull();
  });
  it("permite check-out com assinatura PNG não vazia", () => {
    expect(validarSaida(new File(["assinatura"], "saida.png", { type: "image/png" }))).toBeNull();
  });
});