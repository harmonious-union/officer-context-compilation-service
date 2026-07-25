import { materializeRmnActivity, ACTIVITYSTREAMS_PUBLIC } from "@emsenn/activitypub-services-section/rmn-activity";
import { semanticBytes } from "@emsenn/rmn-semantic-conformance";
import { encodeRelationalValue } from "@emsenn/rmn-semantic-conformance/relational-value";

export const CONTEXT_COMPILATION_OFFER = Object.freeze({
  kind: "org.emsenn.capability-offer.v3",
  cell: "ni:///sha-256;2OII7sQmAt8nlHr0mKH5zIxZFQCzmoOHE9MFVY5_GhI",
  sku: "ni:///sha-256;xs0qL_lt7I8u6EorpcnNpBiajWUq5BkiYp80DuVihSM",
  provider: "urn:ame:officer-context-compilation-service",
  operation: "compile-officer-context",
  law: "ni:///sha-256;wYClx9ZyN64CUIaHDO_44U9n83aOhK1FKbryOcYyi7E",
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
