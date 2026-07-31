#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { compileOfficerContext, refusalFor } from "../src/compile.mjs";
import { appendInvocation } from "../src/journal.mjs";

function option(name) {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
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
