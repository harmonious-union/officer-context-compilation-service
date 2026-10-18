/** All JSON canonicalization is owned by Computer Data's RFC 8785 implementation.
 * Preserve byte NI and typed semantic-content identity through their existing
 * independent source owners; no local JSON traversal, sorting, or hashing. */
export { canonicalJson as canonical } from "@red-cup-engineering/json-services-section";
import { makeNiUri } from "@red-cup-engineering/ni-uri-services-section";
import { EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/semantic-content-identify-service";

export function bytesNi(bytes) {
  return makeNiUri(bytes);
}

export function valueNi(value) {
  return identifyJsonSemanticContent({
    objectKind: `officer-context.${value?.type ?? "material"}`,
    value,
    witnessRoot: EMPTY_WITNESS_ROOT,
  }).token;
}
