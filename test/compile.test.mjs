import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { bytesNi } from "../src/canonical.mjs";
import { compileOfficerContext, ContextCompilationError, refusalFor, canonical } from "../src/compile.mjs";
import { canonicalJson } from "@red-cup-engineering/json-services-section";
import {loadSchema,assertSchema} from "../src/schema.mjs";

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

test("refuses a source identity reused under another authority class even with identical bytes", () => {
  const input = request();
  input.materials.push({
    ...source("urn:law:1", "office persists across incumbents"),
    owner: "another-owner", purpose: "legacy text", authorityClass: "legacy-prior-art"
  });
  assert.throws(() => compileOfficerContext(input), (error) =>
    error instanceof ContextCompilationError && error.code === "E_DUPLICATE");
});

test("refuses omitted source identities that are present or counted twice", () => {
  const present = request();
  present.omissions.push({ identity: "urn:office:xo", reason: "claimed missing" });
  assert.throws(() => compileOfficerContext(present), (error) =>
    error instanceof ContextCompilationError && error.code === "E_CONTRADICTION");

  const duplicated = request();
  duplicated.omissions.push(
    { identity: "urn:missing:1", reason: "unavailable" },
    { identity: "urn:missing:1", reason: "unavailable twice" }
  );
  assert.throws(() => compileOfficerContext(duplicated), (error) =>
    error instanceof ContextCompilationError && error.code === "E_DUPLICATE");

  const honest = request();
  honest.omissions.push({ identity: "urn:missing:1", reason: "unavailable" });
  assert.equal(compileOfficerContext(honest).bundle.denominator.completeness, "bounded-with-gaps");
});

test("refuses context loadouts that claim an action is both permitted and withheld", () => {
  const input = request();
  input.authority.withheldActions.push("fabricate");
  assert.throws(() => compileOfficerContext(input), (error) =>
    error instanceof ContextCompilationError && error.code === "E_AUTHORITY");
});

test("the public documentation loadout compiles from exact source bytes with publish withheld", () => {
  const input = JSON.parse(readFileSync(new URL("../examples/documentation-officer-context-request.json", import.meta.url), "utf8"));
  const outcome = compileOfficerContext(input);
  assert.equal(outcome.type, "OfficerContextCompilation");
  assert.equal(outcome.bundle.denominator.count, 4);
  assert.equal(outcome.bundle.denominator.omitted, 0);
  assert.equal(outcome.bundle.denominator.completeness, "complete");
  assert.deepEqual(outcome.bundle.authority.allowedActions, ["draft", "read"]);
  assert.deepEqual(outcome.bundle.authority.withheldActions, ["publish"]);
  assert.equal(outcome.bundle.authority.grantsCapabilities, false);
  const repeated = compileOfficerContext({ ...input, requestedAt: "2026-10-18T20:00:00.000Z" });
  assert.equal(outcome.bundle.id, repeated.bundle.id);
  assert.notEqual(outcome.receipt.id, repeated.receipt.id);
});

test("loadout source identity sorts by code units, never locale-specific collation",()=>{
  const original=request();
  const leader=[
    source("urn:leader:z","source z"),
    source("urn:leader:ä","source accent"),
    source("urn:leader:a","source a"),
  ];
  const first=compileOfficerContext({...original,leaderSource:leader});
  const reordered=compileOfficerContext({...original,leaderSource:[...leader].reverse()});
  assert.deepEqual(first.bundle.leaderSource.map(item=>item.identity),[
    "urn:leader:a","urn:leader:z","urn:leader:ä",
  ]);
  assert.equal(first.bundle.id,reordered.bundle.id);
  assert.equal(first.bundle.denominator.id,reordered.bundle.denominator.id);
  assert.equal(first.bundle.authority.conveysIncumbency,false);
  assert.equal(first.bundle.authority.grantsCapabilities,false);
});


test("officer context uses one upstream RFC 8785 canonicalizer, not a second leaf algorithm",()=>{
  const representative={
    z:"last",a:"first",accented:"Jäger",nested:{z:1,a:-0},
    source:["id:one","id:ä","id:two"],
  };
  assert.equal(canonical(representative),canonicalJson(representative));
  assert.equal(canonical({z:1,a:2}),canonical({a:2,z:1}));
  assert.throws(()=>canonical({notJson:NaN}),/finite|invalid-json-value/i);
  assert.throws(()=>canonical({unpaired:"\uD800"}),/unicode|surrogate/i);
  let getterCalled=false;
  const adversarial={};
  Object.defineProperty(adversarial,"stolen",{enumerable:true,get(){getterCalled=true;return "value";}});
  assert.throws(()=>canonical(adversarial),/accessor|invalid-json-value/i);
  assert.equal(getterCalled,false,"canonicalization cannot execute an input getter");
});


test("closed upstream schema graph validates the original cross-file receipt reference",()=>{
  const outcome=compileOfficerContext(request());
  const outputSchema=loadSchema(new URL("../content/schemas/output.schema.json",import.meta.url));
  assert.doesNotThrow(()=>assertSchema(outcome,outputSchema));
  // The deleted leaf validator silently skipped state.schema.json. The shared
  // Data engine must actually enforce its receipt's exact type and fields.
  const counterfeit={
    ...outcome,
    receipt:{...outcome.receipt,disposition:"not-compiled"},
  };
  assert.throws(()=>assertSchema(counterfeit,outputSchema),/disposition|const|compiled/iu);
  const missingField={
    ...outcome,
    receipt:{...outcome.receipt},
  };
  delete missingField.receipt.recordedAt;
  assert.throws(()=>assertSchema(missingField,outputSchema),/recordedAt|required/iu);
  const nonOriginal={
    ...outputSchema,
    $id:"https://unapproved.invalid/not-an-officer-context-schema",
  };
  assert.throws(()=>assertSchema(outcome,nonOriginal),/admitted original source documents/u);
});

test("shared JSON Schema rejects extra fields and wrong types on live compiler intake",()=>{
  const input=request();
  input.authority.allowedActions.push(7);
  assert.throws(()=>compileOfficerContext(input),error=>
    error instanceof ContextCompilationError &&
    error.code==="E_SCHEMA");
  const extra=request();
  extra.office.grantsCapabilities=true;
  assert.throws(()=>compileOfficerContext(extra),error=>
    error instanceof ContextCompilationError &&
    error.code==="E_SCHEMA");
});
