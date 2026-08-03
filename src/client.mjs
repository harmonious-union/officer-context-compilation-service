import { randomUUID } from "node:crypto";
import { Message, Role } from "@a2a-js/sdk";
import { a2aResultParts, sendRmnTask } from "@red-cup-engineering/a2a-rmn-task-client-service";
import { extractRmnPart, rmnPart } from "@red-cup-engineering/a2a-rmn-part-service";
import { contextCompilationProtocol } from "./protocol.mjs";

export const OFFICER_CONTEXT_AGENT = process.env.OFFICER_CONTEXT_COMPILATION_AGENT_CARD_URL
  ?? "https://bare-cedar-fog.561.group/a2a/officer-context-compilation/.well-known/agent-card.json";
export const OFFICER_CONTEXT_ACCOUNT = "eip155:5615610:0x3b9fb6ec8ece45d974a17cc14a358f2b0dc69fdd";
const REQUEST_KIND = "org.harmonious-union.officer-context-compilation.a2a-request.v1";
const RESPONSE_KIND = "org.harmonious-union.officer-context-compilation.a2a-response.v1";

export async function hireOfficerContextCompilation(request, { agentUrl = OFFICER_CONTEXT_AGENT, signal } = {}) {
  const encoded = contextCompilationProtocol.encodeRequest("compile-officer-context", request);
  const requestNi = encoded.id;
  const message = Message.toJSON({
    messageId: randomUUID(), contextId: "", taskId: "", role: Role.ROLE_USER,
    parts: [rmnPart(encoded.bytes, "officer-context-compilation-request.rmn.cbor")],
    metadata: {}, extensions: [], referenceTaskIds: [],
  });
  const exchange = await sendRmnTask({ agentUrl, message, requireSignature: true, signal });
  const output = extractRmnPart(a2aResultParts(exchange.result));
  const response = contextCompilationProtocol.admitResponse(output.bytes, output.ni);
  if (response.request !== requestNi) throw new Error("officer-context response does not close this exact request");
  if (response.disposition !== "accepted") throw new Error(response.reason ?? "officer-context provider refused");
  return Object.freeze({
    result: response.result,
    receipt: Object.freeze({
      type: "OfficerContextCompilationHireReceipt",
      provider: "urn:ame:officer-context-compilation-service",
      account: OFFICER_CONTEXT_ACCOUNT,
      response: output.ni,
      bundle: response.result?.bundle?.id,
      compilationReceipt: response.result?.receipt?.id,
      agentCardSignatureVerified: exchange.authentication.agentCardSignatureVerified,
      disposition: "accepted",
    }),
  });
}
