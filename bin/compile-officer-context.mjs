#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { compileOfficerContext, refusalFor } from "../src/compile.mjs";

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
  process.stdout.write(`${JSON.stringify(compileOfficerContext(input))}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify(refusalFor(error, input))}\n`);
  process.exitCode = 2;
}
