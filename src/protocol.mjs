import { createRelationalOperationProtocol } from "@emsenn/a2a-sovereign-operation-boundary-service";

export const contextCompilationProtocol = createRelationalOperationProtocol({
  requestKind: "org.harmonious-union.officer-context-compilation.a2a-request.v1",
  responseKind: "org.harmonious-union.officer-context-compilation.a2a-response.v1",
  label: "officer context compilation",
});
