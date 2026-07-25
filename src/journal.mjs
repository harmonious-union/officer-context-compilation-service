import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonical, valueNi } from "./canonical.mjs";

export function appendInvocation(root, request, outcome) {
  if (!root) return null;
  const record = { type: "OfficerContextCompilationInvocation", request, outcome };
  const id = outcome?.receipt?.id ?? valueNi(record);
  const directory = resolve(root);
  const path = resolve(directory, `${id.split(";").at(-1)}.json`);
  mkdirSync(directory, { recursive: true });
  const bytes = `${JSON.stringify({ id, ...record }, null, 2)}\n`;
  try {
    writeFileSync(path, bytes, { flag: "wx", mode: 0o644 });
  } catch (error) {
    if (error?.code !== "EEXIST" || canonical(JSON.parse(readFileSync(path, "utf8"))) !== canonical(JSON.parse(bytes))) throw error;
  }
  return Object.freeze({ id, path });
}
