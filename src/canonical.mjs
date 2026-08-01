import { rawNiUri } from "@red-cup-engineering/rmn-semantic-conformance-die/canonical-cbor";

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function bytesNi(bytes) {
  return rawNiUri(bytes);
}

export function valueNi(value) {
  return bytesNi(Buffer.from(canonical(value), "utf8"));
}
