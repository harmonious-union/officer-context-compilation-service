export interface ContentAddressedSource {
  readonly identity: string;
  readonly semanticId: `ni:///sha-256;${string}`;
  readonly bytesBase64: string;
}

export interface OfficerContextCompilationRequest {
  readonly type: "OfficerContextCompilationRequest";
  readonly requestId: string;
  readonly requestedAt: string;
  readonly purpose: string;
  readonly leaderSource: readonly ContentAddressedSource[];
  readonly office: { readonly id: string; readonly epoch: string; readonly source: ContentAddressedSource };
  readonly character: { readonly id: string; readonly epoch: string; readonly source: ContentAddressedSource; readonly chronicle: readonly ContentAddressedSource[] };
  readonly materials: readonly (ContentAddressedSource & { readonly owner: string; readonly purpose: string; readonly authorityClass: "current-law" | "current-practice" | "admitted-research" | "legacy-prior-art" | "customer-overlay" })[];
  readonly inferences: readonly (ContentAddressedSource & { readonly author: string })[];
  readonly omissions: readonly { readonly identity: string; readonly reason: string }[];
  readonly authority: { readonly customer: string; readonly office: string; readonly allowedActions: readonly string[]; readonly withheldActions: readonly string[] };
}

export declare const CAPABILITY_LAW: `ni:///sha-256;${string}`;
export declare function compileOfficerContext(request: OfficerContextCompilationRequest): Readonly<Record<string, unknown>>;
export declare function refusalFor(error: unknown, request?: Partial<OfficerContextCompilationRequest>): Readonly<Record<string, unknown>>;
