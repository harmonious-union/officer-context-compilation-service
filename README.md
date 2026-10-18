# Officer context compilation

Compile an exact, purpose-specific **officer context** from source-addressed Leader instructions, office law, character history and admitted materials. A compiled bundle can serve as an agent **loadout** or **spacesuit**: it says what context is present, what is absent, and which actions the *request* describes as allowed or withheld. It does **not** install a model, grant credentials, confer office incumbency, or execute those actions.

The existing source owner is this service; it uses shared NI/content-identification and A2A/ActivityPub suppliers instead of introducing its own context hash, messenger or permission engine. The executable interfaces are [`src/compile.mjs`](src/compile.mjs) and [`scripts/compile-officer-context.mjs`](scripts/compile-officer-context.mjs). Source data, executable compilation and downstream agent execution are different stages.

## Tutorial — compile the supplied documentation-office loadout

From a checkout with the repository's Node dependencies installed:

```sh
npm ci
node scripts/compile-officer-context.mjs < examples/documentation-officer-context-request.json
```

The [example request](examples/documentation-officer-context-request.json) has four exact source byte strings: a Leader task, an office definition, a character description and one current-law material. Each carries its real SHA-256 `ni:` URI. It names two allowed *descriptions* (`read`, `draft`) and withholds `publish`.

The successful result is a JSON `OfficerContextCompilation` containing a content-addressed `OfficerContextBundle` and a separate `ContextCompilationReceipt`. The example's denominator records four observed sources, zero omissions and `complete` relative to the **declared request**. Completeness does not imply these four toy sources are a real institution's complete law. A refusal is JSON `OfficerContextCompilationRefusal` with process exit code 2. This exercise needs no credentials, model call or remote agent.

## How-to — prepare a real context for one task

1. Start with a real office and admitted duty, not a personality prompt. Assign `office.id` and `office.epoch`; set `authority.office` to the identical ID and name the actual customer.
2. Load the exact current Leader instruction, office definition, character definition and allowed chronicle. Give every distinct source a stable `identity`, its original UTF-8 bytes encoded as canonical Base64, and the RFC 6920 SHA-256 `ni:` URI of **those bytes**. Do not hash the Base64 text or invent an identity from a title.
3. Add materials labeled with their real owner, purpose and authority class. Exactly one material must be marked `current-law`. Put admitted research, older practices and customer overlays in their distinct authority classes; do not reclassify them as law to satisfy the gate.
4. Put actual gaps in `omissions` with distinct identities and reasons. A missing source must not simultaneously appear in the supplied material. Keep unverified interpretations in `inferences`, with an author; they do not become law.
5. Set separate `allowedActions` and `withheldActions` lists, without overlap. These are **context descriptors**, not executable capabilities; downstream principals must still check their own authority and policies.
6. Submit to `compileOfficerContext(request)` or the documented CLI. Keep both the returned bundle ID and the separate request-time receipt. Replace the whole requested source if its bytes or source revision change; do not edit an output hash.

To preserve a local invocation journal, pass `--record-root PATH` to the CLI with an authorized writable path. Without that flag the CLI does not use this optional recording root. For remotely hired contexts, the [A2A client](src/client.mjs) sends the same source-bound request through the shared signed agent operation protocol; do not interpret successful compilation as a remotely executed duty.

## Reference — contract and refusal surfaces

The canonical input contract is [`content/schemas/input.schema.json`](content/schemas/input.schema.json); the output and refusal contracts are [output](content/schemas/output.schema.json) and [refusal](content/schemas/refusal.schema.json). The TypeScript view is [`types/index.d.mts`](types/index.d.mts). The library exports `compileOfficerContext`, `ContextCompilationError`, `refusalFor` and `canonical` at package root. The CLI reads one JSON request from standard input, writes one JSON result to standard output and exits nonzero on refusal.

Source partitions are `leaderSource[]`, `office.source`, `character.source`, `character.chronicle[]`, `materials[]` and `inferences[]`. Each source identity must occur once. Conflicting bytes, reused identities, falsely omitted present identities, repeated omissions and contradictory allow/withhold claims are refusals. `denominator` states observed and omitted counts; `bundle.authority.grantsCapabilities` and `conveysIncumbency` are always false. Request time belongs to the receipt, **not** the deterministic bundle identity.

See [`test/compile.test.mjs`](test/compile.test.mjs) for successful compilation, stable identity, changed-source refusal and authority-boundary counterexamples. The [A2A client](src/client.mjs) and [ActivityPub server](scripts/activitypub-server.mjs) are separate network-facing consumers; neither follows merely from compiling a local JSON request.

## Source-edition note — stable identities across agent locales

Source edition `0.1.6` retains deterministic UTF-16 source-identity ordering and delegates JSON canonicalization to `@red-cup-engineering/json-services-section@0.4.0` (RFC 8785), instead of repeating a recursive local serializer. That shared Data package also requires Node 24.2.0 or newer. A spacesuit with the same exact source bytes and identities must not change merely because its agent runs with a different OS language or region. An earlier edition could sort some non-ASCII identifiers differently: source-identity consumers must recompile from originals when selecting the new edition and retain both old and new bundle identities in their own migration records. It also replaces the old local JSON Schema interpreter—which silently ignored `state.schema.json` relative references—with the original Computer Data `@red-cup-engineering/json-schema-services-section@0.5.0` closed-source-graph evaluator. The original input/output/refusal/state schemas remain under this service's source custody, and unknown schema sources or unresolved references must refuse. This is a source-code change, **not** proof of registry publication, runtime installation or a renewed office grant. The native regression in `test/compile.test.mjs` covers accented identifiers in different input orders. It now additionally checks canonical output against the source-owned JCS function and refuses nonfinite values, unpaired surrogates, and accessor-backed source objects without invoking getters.

**Installation state:** the repository's `package-lock.json` was already behind its own `package.json` before these shared JSON and JSON Schema dependencies. It still names older supplier identities and lacks the exact registry artifact for the new JCS dependency. Source version `0.1.5` therefore does **not** establish a frozen-installed application; the original workspace-publication operation must receive each exact registry release, update the native lock through the package manager, and install it. Do not hand-invent integrity hashes or reinterpret old identities as the new source edition.

## Explanation — why a context is not an agent or a permission token

Context compilation assembles **what an agent can be shown about a particular office and demand**. The agent's operative abilities remain downstream of the sovereign authority, service contracts and deployment. A source-addressed law paragraph tells a compiler the text was received unchanged; it does not prove the paragraph is valid law or give the recipient a credential.

An officer's current instruction, a character's accumulated chronicle and a candidate inference are deliberately separate. Collapsing them into a free-form system prompt silently promotes memories and guesses into authority. Likewise, a finite `denominator` measures the declared collection, not everything the agent ought to know. That is why an honest omission remains explicit instead of being filled with plausible prose.

**Identity-profile compatibility.** This service's current `package.json` still pins `@red-cup-engineering/semantic-content-identify-service@0.2.2`. Its source owner now classifies that supplier as a historical RMN v2 boundary, not the active SEN v3 / SignCell semantic-identity provider. Preserve already-issued bundle and receipt IDs for their original profile; do not silently reinterpret them as new SEN/SignCell identity or update that dependency without a versioned original-consumer migration. The current README documents the installed code's behavior, not acceptance of that legacy supplier as a new canonical upstream.

This documentation follows [Diátaxis](https://diataxis.fr/): the tutorial teaches one completed action; the how-to supports a task; the reference enumerates the contract; the explanation names the system's conceptual and authority boundaries. PTGAE and locale choices belong to the source language bundles and their owning selectors, not to the generic context compiler.
