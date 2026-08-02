import { materializeRmnActivity, ACTIVITYSTREAMS_PUBLIC } from "@red-cup-engineering/activitypub-services-section/rmn-activity";
import { semanticBytes } from "@red-cup-engineering/relation-model-notation-runtime";
import { encodeRelationalValue } from "@red-cup-engineering/relation-model-notation-runtime/relational-value";

export const CONTEXT_COMPILATION_OFFER = Object.freeze({
  kind: "org.emsenn.capability-offer.v3",
  provider: "urn:ame:officer-context-compilation-service",
  operation: "compile-officer-context",
  agentCard: "https://bare-cedar-fog.561.group/a2a/officer-context-compilation/.well-known/agent-card.json",
  authorization: Object.freeze({ profile: "none", grantRequired: false }),
  price: Object.freeze({ protocol: "x402", asset: "USD", amount: "0", network: "eip155:5615610" }),
  expiresAt: "2027-07-24T00:00:00.000Z",
});

function offerBytes() {
  const encoded = encodeRelationalValue(CONTEXT_COMPILATION_OFFER);
  return semanticBytes(["ascribe", encoded.type, encoded.term]);
}

export function createContextCompilationOfferOutbox({ origin, identifier }) {
  const activity = materializeRmnActivity({
    type: "Offer",
    origin,
    identifier,
    recipient: ACTIVITYSTREAMS_PUBLIC,
    objectBytes: offerBytes(),
    agentCard: CONTEXT_COMPILATION_OFFER.agentCard,
  });
  return async ({ cursor }) => cursor === undefined || cursor === null ? { items: [await activity] } : { items: [] };
}
