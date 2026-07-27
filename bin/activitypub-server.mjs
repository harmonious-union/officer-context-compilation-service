#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { serveActivityPubProvider } from "@red-cup-engineering/activitypub-services-section/server";
import { createContextCompilationOfferOutbox } from "../src/activitypub-offer.mjs";

const origin = process.env.ACTIVITYPUB_ORIGIN ?? "https://bare-cedar-fog.561.group";
const identifier = process.env.ACTIVITYPUB_IDENTIFIER ?? "officer-context-compilation";

serveActivityPubProvider({
  origin,
  identifier,
  actorName: "Officer Context Compilation Cell",
  summary: "Compiles exact, bounded officer contexts without conveying incumbency or granting capabilities.",
  keyPath: process.env.ACTIVITYPUB_KEYS_PATH,
  statePath: process.env.ACTIVITYPUB_STATE_PATH,
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? "15616"),
  bearerToken: randomBytes(32).toString("base64url"),
  listOutbox: createContextCompilationOfferOutbox({ origin, identifier }),
}).then(() => process.stdout.write(`${origin}/actors/${identifier}\n`)).catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
