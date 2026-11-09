export type ErrorDetail = { field?: string; message: string };

/** A failure the API reports on purpose. Anything else becomes a generic 500. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (resource: string, code = "NOT_FOUND") =>
  new ApiError(404, code, `${resource} not found.`);

export const forbidden = (message = "You do not have permission to do this.") =>
  new ApiError(403, "FORBIDDEN", message);

export const moduleNotAllowed = (signedIn: string, needed: string) =>
  new ApiError(403, "MODULE_NOT_ALLOWED", `This session is signed in to ${signedIn}. Sign in to ${needed} to continue.`);

export const unauthorized = () =>
  new ApiError(401, "UNAUTHORIZED", "Sign in with a valid token to continue.");
