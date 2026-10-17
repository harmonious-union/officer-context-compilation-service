import { bytesNi, canonical, valueNi } from "./canonical.mjs";
import { assertSchema, loadSchema } from "./schema.mjs";

const INPUT_SCHEMA = loadSchema(new URL("../content/schemas/input.schema.json", import.meta.url));
const OUTPUT_SCHEMA = loadSchema(new URL("../content/schemas/output.schema.json", import.meta.url));
const REFUSAL_SCHEMA = loadSchema(new URL("../content/schemas/refusal.schema.json", import.meta.url));
const STATE_SCHEMA = loadSchema(new URL("../content/schemas/state.schema.json", import.meta.url));

export class ContextCompilationError extends Error {
  constructor(code, reason, field) {
    super(reason);
    this.name = "ContextCompilationError";
    this.code = code;
    this.field = field;
  }
}

function verified(source, field) {
  let bytes;
  try {
    bytes = Buffer.from(source.bytesBase64, "base64");
  } catch {
    throw new ContextCompilationError("E_IDENTITY", "source bytes are not valid base64", `${field}.bytesBase64`);
  }
  if (bytes.toString("base64").replaceAll("=", "") !== source.bytesBase64.replaceAll("=", "")) {
    throw new ContextCompilationError("E_IDENTITY", "source bytes are not canonical base64", `${field}.bytesBase64`);
  }
  const observed = bytesNi(bytes);
  if (observed !== source.semanticId) {
    throw new ContextCompilationError("E_IDENTITY", `semantic identity mismatch: observed ${observed}`, `${field}.semanticId`);
  }
  return Object.freeze({ ...source });
}

function sorted(values) {
  return Object.freeze([...values].sort((left, right) => left.identity.localeCompare(right.identity)));
}

function verifyNoContradiction(partitions) {
  const identities = new Map();
  for (const [name, values] of Object.entries(partitions)) {
    for (const value of values) {
      const prior = identities.get(value.identity);
      if (prior && prior.semanticId !== value.semanticId) {
        throw new ContextCompilationError("E_CONTRADICTION", `identity ${value.identity} carries conflicting semantic values`, `${name}.${value.identity}`);
      }
      if (prior) {
        throw new ContextCompilationError("E_DUPLICATE", `identity ${value.identity} occurs more than once in the context`, `${name}.${value.identity}`);
      }
      identities.set(value.identity, value);
    }
  }
}

export function compileOfficerContext(request) {
  try {
    assertSchema(request, INPUT_SCHEMA);
  } catch (error) {
    throw new ContextCompilationError("E_SCHEMA", error.message, error.message.split(" ")[0]);
  }
  if (request.authority.office !== request.office.id) {
    throw new ContextCompilationError("E_AUTHORITY", "authority office does not match the compiled office", "$.authority.office");
  }
  const leaderSource = sorted(request.leaderSource.map((source, index) => verified(source, `$.leaderSource[${index}]`)));
  const officeSource = verified(request.office.source, "$.office.source");
  const characterSource = verified(request.character.source, "$.character.source");
  const chronicle = sorted(request.character.chronicle.map((source, index) => verified(source, `$.character.chronicle[${index}]`)));
  const materials = sorted(request.materials.map((source, index) => verified(source, `$.materials[${index}]`)));
  const inferences = sorted(request.inferences.map((source, index) => verified(source, `$.inferences[${index}]`)));
  const laws = materials.filter(({ authorityClass }) => authorityClass === "current-law");
  if (laws.length !== 1) {
    throw new ContextCompilationError("E_AUTHORITY", "context compilation requires exactly one current-law material", "$.materials");
  }
  verifyNoContradiction({ leaderSource, office: [officeSource], character: [characterSource], chronicle, materials, inferences });
  const omissions = sorted(request.omissions);
  const observedIdentities = new Set(
    [...leaderSource, officeSource, characterSource, ...chronicle, ...materials, ...inferences]
      .map(({ identity }) => identity)
  );
  const omittedIdentities = new Set();
  for (const omission of omissions) {
    if (observedIdentities.has(omission.identity)) {
      throw new ContextCompilationError("E_CONTRADICTION", `identity ${omission.identity} is both supplied and omitted`, "$.omissions");
    }
    if (omittedIdentities.has(omission.identity)) {
      throw new ContextCompilationError("E_DUPLICATE", `omission ${omission.identity} occurs more than once`, "$.omissions");
    }
    omittedIdentities.add(omission.identity);
  }
  const forbidden = new Set(request.authority.withheldActions);
  for (const action of request.authority.allowedActions) {
    if (forbidden.has(action)) {
      throw new ContextCompilationError("E_AUTHORITY", `action ${action} is both allowed and withheld`, "$.authority");
    }
  }
  const denominatorMembers = [...leaderSource, officeSource, characterSource, ...chronicle, ...materials, ...inferences]
    .map(({ identity, semanticId }) => ({ identity, semanticId }));
  const denominator = Object.freeze({
    count: denominatorMembers.length + omissions.length,
    observed: denominatorMembers.length,
    omitted: omissions.length,
    completeness: omissions.length === 0 ? "complete" : "bounded-with-gaps",
    id: valueNi({ members: denominatorMembers, omissions }),
  });
  const body = Object.freeze({
    type: "OfficerContextBundle",
    law: laws[0].semanticId,
    purpose: request.purpose,
    leaderSource,
    office: Object.freeze({ id: request.office.id, epoch: request.office.epoch, source: officeSource }),
    character: Object.freeze({ id: request.character.id, epoch: request.character.epoch, source: characterSource, chronicle }),
    materials,
    inferences,
    omissions,
    denominator,
    authority: Object.freeze({
      customer: request.authority.customer,
      office: request.authority.office,
      allowedActions: Object.freeze([...new Set(request.authority.allowedActions)].sort()),
      withheldActions: Object.freeze([...new Set(request.authority.withheldActions)].sort()),
      conveysIncumbency: false,
      grantsCapabilities: false,
    }),
  });
  const bundle = Object.freeze({ id: valueNi(body), ...body });
  const receiptBody = Object.freeze({
    type: "ContextCompilationReceipt",
    requestId: request.requestId,
    bundle: bundle.id,
    recordedAt: request.requestedAt,
    disposition: "compiled",
  });
  const receipt = Object.freeze({ ...receiptBody, id: valueNi(receiptBody) });
  assertSchema(receipt, STATE_SCHEMA);
  const output = Object.freeze({ type: "OfficerContextCompilation", bundle, receipt });
  assertSchema(output, OUTPUT_SCHEMA);
  return output;
}

export function refusalFor(error, request = {}) {
  const refusal = Object.freeze({
    type: "OfficerContextCompilationRefusal",
    requestId: typeof request.requestId === "string" && request.requestId ? request.requestId : "unidentified-request",
    code: error instanceof ContextCompilationError ? error.code : "E_SCHEMA",
    reason: error instanceof Error ? error.message : String(error),
    field: error instanceof ContextCompilationError ? error.field : "$",
  });
  assertSchema(refusal, REFUSAL_SCHEMA);
  return refusal;
}

export { canonical };
