import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVisitSettings } from "./operational-settings";
describe("Configuração de visitas", () => {
  it("oferece as duas sedes solicitadas por padrão", () => {
    assert.deepEqual(parseVisitSettings().zonas, ["Data Center Sede 1", "Data Center Sede 3"]);
  });
  it("aplica zonas personalizadas sem duplicatas", () => {
    assert.deepEqual(parseVisitSettings('{"zonas":[" Sede 2 ","Sede 2"]}').zonas, ["Sede 2"]);
  });
});