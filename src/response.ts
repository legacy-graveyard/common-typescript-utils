/**
 * The two fields validationError reads from an issue. Typed structurally
 * rather than as zod's ZodIssue so the signature does not pin a zod major:
 * zod 3 issues and zod 4 issues both satisfy it, and a consumer on either
 * version can pass `err.issues` straight through. Importing ZodIssue here
 * made this package's zod version part of its public API — bumping it to
 * zod 4 broke every consumer still on zod 3 at the type level.
 */
export type ValidationIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

const VERSION = "v1" as const;

export type SuccessEnvelope<T> = {
  data: T;
  meta: { version: typeof VERSION; count?: number } & Record<string, unknown>;
};

export type ErrorEnvelope = {
  error: { code: string; message: string };
};

export function success<T>(data: T, meta?: Record<string, unknown>): SuccessEnvelope<T> {
  return {
    data,
    meta: { version: VERSION, ...meta },
  };
}

export function successList<T>(
  data: T[],
  meta?: Record<string, unknown>
): SuccessEnvelope<T[]> {
  return {
    data,
    meta: { version: VERSION, count: data.length, ...meta },
  };
}

export function error(code: string, message: string): ErrorEnvelope {
  return { error: { code, message } };
}

export const CommonErrors = {
  unauthorized(): ErrorEnvelope {
    return error("UNAUTHORIZED", "Authentication required");
  },
  forbidden(): ErrorEnvelope {
    return error("FORBIDDEN", "Admin access required");
  },
  notFound(resource?: string): ErrorEnvelope {
    return error("NOT_FOUND", resource ? `${resource} not found` : "Not found");
  },
  badRequest(message: string): ErrorEnvelope {
    return error("BAD_REQUEST", message);
  },
  internalError(message = "Internal server error"): ErrorEnvelope {
    return error("INTERNAL", message);
  },
  validationError(issues: readonly ValidationIssue[]): ErrorEnvelope {
    const message = issues
      .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
      .join("; ");
    return error("VALIDATION_ERROR", message || "Validation failed");
  },
};
