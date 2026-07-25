import test from "node:test";
import assert from "node:assert/strict";
import { bytesNi } from "../src/canonical.mjs";
import { compileOfficerContext, ContextCompilationError, refusalFor } from "../src/compile.mjs";

const source = (identity, text) => {
  const bytes = Buffer.from(text);
  return { identity, semanticId: bytesNi(bytes), bytesBase64: bytes.toString("base64") };
};

const request = () => ({
  type: "OfficerContextCompilationRequest",
  requestId: "urn:demand:test",
  requestedAt: "2026-07-24T22:00:00.000Z",
  purpose: "select and fabricate the XO capabilities required to execute the Leader objective",
  leaderSource: [source("urn:leader:utterance:1", "Build the XO faculties, not another prompt.")],
  office: { id: "executive-officer-to-the-leader", epoch: "office-epoch-1", source: source("urn:office:xo", "{\"duties\":[]}") },
  character: { id: "codex-interactive-session", epoch: "character-epoch-1", source: source("urn:character:codex", "{\"disposition\":\"bounded\"}"), chronicle: [source("urn:play:1", "inspected the repository")] },
  materials: [{ ...source("urn:law:1", "office persists across incumbents"), owner: "union-officer-academy", purpose: "office law", authorityClass: "current-law" }],
  inferences: [{ ...source("urn:inference:1", "context compilation is the first missing faculty"), author: "urn:session:test" }],
  omissions: [],
  authority: { customer: "urn:leader:emsenn", office: "executive-officer-to-the-leader", allowedActions: ["inspect", "fabricate"], withheldActions: ["settle-leader-decision"] }
});

test("compiles a deterministic bundle while keeping receipt time outside bundle identity", () => {
  const first = compileOfficerContext(request());
  const secondRequest = request();
  secondRequest.requestedAt = "2026-07-25T01:00:00.000Z";
  const second = compileOfficerContext(secondRequest);
  assert.equal(first.bundle.id, second.bundle.id);
  assert.notEqual(first.receipt.id, second.receipt.id);
  assert.equal(first.bundle.authority.conveysIncumbency, false);
  assert.equal(first.bundle.denominator.completeness, "complete");
});

test("refuses changed bytes under a claimed semantic identity", () => {
  const input = request();
  input.leaderSource[0].bytesBase64 = Buffer.from("different").toString("base64");
  assert.throws(() => compileOfficerContext(input), (error) => error instanceof ContextCompilationError && error.code === "E_IDENTITY");
  const refusal = (() => { try { return compileOfficerContext(input); } catch (error) { return refusalFor(error, input); } })();
  assert.equal(refusal.type, "OfficerContextCompilationRefusal");
  assert.equal(refusal.code, "E_IDENTITY");
});

test("refuses one identity carrying contradictory values across partitions", () => {
  const input = request();
  input.inferences.push({ ...source("urn:law:1", "a conflicting value"), author: "urn:session:test" });
  assert.throws(() => compileOfficerContext(input), (error) => error instanceof ContextCompilationError && error.code === "E_CONTRADICTION");
});
