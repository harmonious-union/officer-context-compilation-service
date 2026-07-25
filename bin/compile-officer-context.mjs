#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonical, valueNi } from "../src/canonical.mjs";
import { compileOfficerContext, refusalFor } from "../src/compile.mjs";

function option(name) {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
}

function appendInvocation(root, request, outcome) {
  if (!root) return;
  const record = {
    type: "OfficerContextCompilationInvocation",
    request,
    outcome,
  };
  const id = outcome?.receipt?.id ?? valueNi(record);
  const directory = resolve(root);
  const path = resolve(directory, `${id.split(";").at(-1)}.json`);
  mkdirSync(directory, { recursive: true });
  const bytes = `${JSON.stringify({ id, ...record }, null, 2)}\n`;
  try {
    writeFileSync(path, bytes, { flag: "wx", mode: 0o644 });
  } catch (error) {
    if (error?.code !== "EEXIST" || canonical(JSON.parse(readFileSync(path, "utf8"))) !== canonical(JSON.parse(bytes))) {
      throw error;
    }
  }
}

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
  const outcome = compileOfficerContext(input);
  appendInvocation(option("--record-root"), input, outcome);
  process.stdout.write(`${JSON.stringify(outcome)}\n`);
} catch (error) {
  const outcome = refusalFor(error, input);
  appendInvocation(option("--record-root"), input ?? null, outcome);
  process.stdout.write(`${JSON.stringify(outcome)}\n`);
  process.exitCode = 2;
}
