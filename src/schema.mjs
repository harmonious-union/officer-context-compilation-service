import { readFileSync } from "node:fs";

const rootPointer = (schema, ref) => ref.slice(2).split("/").reduce((value, key) => value[key.replaceAll("~1", "/").replaceAll("~0", "~")], schema);

export function loadSchema(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

export function assertSchema(value, selected, { root = selected, field = "$" } = {}) {
  if (selected.$ref) {
    if (!selected.$ref.startsWith("#/")) return;
    return assertSchema(value, rootPointer(root, selected.$ref), { root, field });
  }
  if (selected.const !== undefined && value !== selected.const) throw new TypeError(`${field} must equal ${JSON.stringify(selected.const)}`);
  if (selected.enum && !selected.enum.includes(value)) throw new TypeError(`${field} must be one of ${selected.enum.join("|")}`);
  if (selected.type === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${field} must be an object`);
    for (const key of selected.required ?? []) if (!(key in value)) throw new TypeError(`${field}.${key} is required`);
    if (selected.additionalProperties === false) {
      const extras = Object.keys(value).filter((key) => !(key in (selected.properties ?? {})));
      if (extras.length) throw new TypeError(`${field} has unexpected fields: ${extras.join(", ")}`);
    }
    for (const [key, child] of Object.entries(selected.properties ?? {})) {
      if (key in value) assertSchema(value[key], child, { root, field: `${field}.${key}` });
    }
  } else if (selected.type === "array") {
    if (!Array.isArray(value)) throw new TypeError(`${field} must be an array`);
    if (value.length < (selected.minItems ?? 0)) throw new TypeError(`${field} requires at least ${selected.minItems} items`);
    value.forEach((item, index) => assertSchema(item, selected.items ?? {}, { root, field: `${field}[${index}]` }));
  } else if (selected.type === "string") {
    if (typeof value !== "string") throw new TypeError(`${field} must be a string`);
    if (value.length < (selected.minLength ?? 0)) throw new TypeError(`${field} must not be empty`);
    if (selected.pattern && !(new RegExp(selected.pattern, "u")).test(value)) throw new TypeError(`${field} does not match ${selected.pattern}`);
  }
}
