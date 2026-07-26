import { randomUUID } from "node:crypto";
import { Message, Role } from "@a2a-js/sdk";
import { a2aResultParts, sendRmnTask } from "@emsenn/a2a-rmn-task-client-service";
import { extractRmnPart, rmnPart } from "@emsenn/a2a-rmn-part-service";
import { decodeSemantic, semanticBytes, semanticId } from "@emsenn/rmn-semantic-conformance";
import { decodeRelationalValue, encodeRelationalValue, RELATIONAL_VALUE_TYPE } from "@emsenn/rmn-semantic-conformance/relational-value";

export const OFFICER_CONTEXT_AGENT = process.env.OFFICER_CONTEXT_COMPILATION_AGENT_CARD_URL
  ?? "https://bare-cedar-fog.561.group/a2a/officer-context-compilation/.well-known/agent-card.json";
export const OFFICER_CONTEXT_CELL = "ni:///sha-256;2OII7sQmAt8nlHr0mKH5zIxZFQCzmoOHE9MFVY5_GhI";
export const OFFICER_CONTEXT_SKU = "ni:///sha-256;xs0qL_lt7I8u6EorpcnNpBiajWUq5BkiYp80DuVihSM";
export const OFFICER_CONTEXT_LAW = "ni:///sha-256;wYClx9ZyN64CUIaHDO_44U9n83aOhK1FKbryOcYyi7E";
export const OFFICER_CONTEXT_ACCOUNT = "eip155:5615610:0x3b9fb6ec8ece45d974a17cc14a358f2b0dc69fdd";
const REQUEST_KIND = "org.harmonious-union.officer-context-compilation.a2a-request.v1";
const RESPONSE_KIND = "org.harmonious-union.officer-context-compilation.a2a-response.v1";

function ascription(value) {
  const encoded = encodeRelationalValue(value);
  return ["ascribe", encoded.type, encoded.term];
}

function decodeResponse(term) {
  if (!Array.isArray(term) || term.length !== 3 || term[0] !== "ascribe"
    || JSON.stringify(term[1]) !== JSON.stringify(RELATIONAL_VALUE_TYPE)) {
    throw new Error("officer-context provider returned an untyped or foreign RMN value");
  }
  const value = decodeRelationalValue(term[1], term[2]);
  if (value?.kind !== RESPONSE_KIND) throw new Error("officer-context provider returned the wrong protocol object");
  return value;
}

function verifyCard(card) {
  const params = card.capabilities?.extensions?.find(({ uri }) => uri === OFFICER_CONTEXT_LAW)?.params;
  if (params?.cell !== OFFICER_CONTEXT_CELL || params?.sku !== OFFICER_CONTEXT_SKU
    || params?.law !== OFFICER_CONTEXT_LAW || params?.account !== OFFICER_CONTEXT_ACCOUNT) {
    throw new Error("officer-context Agent Card does not bind the contracted cell, SKU, law, and account");
  }
}

export async function hireOfficerContextCompilation(request, { agentUrl = OFFICER_CONTEXT_AGENT, signal } = {}) {
  const term = ascription({ kind: REQUEST_KIND, operation: "compile-officer-context", input: request });
  const requestNi = semanticId(term);
  const message = Message.toJSON({
    messageId: randomUUID(), contextId: "", taskId: "", role: Role.ROLE_USER,
    parts: [rmnPart(semanticBytes(term), "officer-context-compilation-request.rmn.cbor")],
    metadata: {}, extensions: [], referenceTaskIds: [],
  });
  const exchange = await sendRmnTask({ agentUrl, message, requireSignature: true, signal });
  verifyCard(exchange.agentCard);
  const output = extractRmnPart(a2aResultParts(exchange.result));
  const responseTerm = decodeSemantic(output.bytes);
  if (!semanticBytes(responseTerm).equals(output.bytes)) throw new Error("officer-context provider returned noncanonical bytes");
  const response = decodeResponse(responseTerm);
  if (response.request !== requestNi) throw new Error("officer-context response does not close this exact request");
  if (response.disposition !== "accepted") throw new Error(response.reason ?? "officer-context provider refused");
  return Object.freeze({
    result: response.result,
    receipt: Object.freeze({
      type: "OfficerContextCompilationHireReceipt",
      provider: "urn:ame:officer-context-compilation-service",
      cell: OFFICER_CONTEXT_CELL,
      sku: OFFICER_CONTEXT_SKU,
      law: OFFICER_CONTEXT_LAW,
      account: OFFICER_CONTEXT_ACCOUNT,
      response: output.ni,
      bundle: response.result?.bundle?.id,
      compilationReceipt: response.result?.receipt?.id,
      agentCardSignatureVerified: exchange.authentication.agentCardSignatureVerified,
      disposition: "accepted",
    }),
  });
}
