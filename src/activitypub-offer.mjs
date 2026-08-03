import { materializeRmnActivity, ACTIVITYSTREAMS_PUBLIC } from "@red-cup-engineering/activitypub-services-section/rmn-activity";
import { EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/semantic-content-identify-service";

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
  return identifyJsonSemanticContent({ objectKind: CONTEXT_COMPILATION_OFFER.kind, value: CONTEXT_COMPILATION_OFFER, witnessRoot: EMPTY_WITNESS_ROOT }).bytes;
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
