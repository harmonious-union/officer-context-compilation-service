import { makeNiUri } from "@red-cup-engineering/ni-uri-services-section";
import { EMPTY_WITNESS_ROOT, identifyJsonSemanticContent } from "@red-cup-engineering/semantic-content-identify-service";

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function bytesNi(bytes) {
  return makeNiUri(bytes);
}

export function valueNi(value) {
  return identifyJsonSemanticContent({ objectKind: `officer-context.${value?.type ?? "material"}`, value, witnessRoot: EMPTY_WITNESS_ROOT }).token;
}
