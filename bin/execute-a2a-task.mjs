#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { executeRelationalOperationMessage } from "@emsenn/a2a-sovereign-operation-boundary-service";
import { compileOfficerContext, refusalFor } from "../src/compile.mjs";
import { appendInvocation } from "../src/journal.mjs";
import { contextCompilationProtocol } from "../src/protocol.mjs";

const recordRoot = process.env.OFFICER_CONTEXT_RECORD_ROOT ?? resolve("data/records/invocations");
const operations = Object.freeze({
  "compile-officer-context": (input) => {
    let outcome;
    try {
      outcome = compileOfficerContext(input);
    } catch (error) {
      outcome = refusalFor(error, input);
    }
    appendInvocation(recordRoot, input, outcome);
    return outcome;
  },
});

export function executeA2aMessage(source) {
  return executeRelationalOperationMessage(source, {
    protocol: contextCompilationProtocol,
    operations,
    runtimeLoader: async () => Object.freeze({}),
    responseFilename: "officer-context-compilation-response.rmn.cbor",
    unknownOperationMessage: "unknown officer context operation",
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(`${JSON.stringify(await executeA2aMessage(JSON.parse(readFileSync(0, "utf8"))))}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}
