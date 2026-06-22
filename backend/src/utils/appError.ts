type AppErrorOptions = {
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.status = options.status || 400;
    this.code = options.code || "APP_ERROR";
    this.details = options.details;

    if (options.cause) {
      (this as any).cause = options.cause;
    }
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error || "Error desconocido");
}

export function getErrorDetails(error: any): Record<string, unknown> | undefined {
  if (!error || typeof error !== "object") return undefined;

  if (error instanceof AppError) {
    const causeDetails: Record<string, unknown> | undefined = getErrorDetails(
      (error as any).cause
    );

    return {
      code: error.code,
      details: error.details,
      cause: causeDetails,
    };
  }

  return {
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
  };
}

export function logError(scope: string, error: unknown, context?: Record<string, unknown>) {
  const details = getErrorDetails(error);

  console.error(`[${scope}] ${getErrorMessage(error)}`, {
    context,
    details,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
