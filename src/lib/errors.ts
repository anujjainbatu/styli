import { NextResponse } from "next/server"

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message)
    this.name = "AppError"
  }
}

export const Errors = {
  Unauthorized: () => new AppError("Authentication required", "UNAUTHORIZED", 401),
  NotFound: (resource: string) => new AppError(`${resource} not found`, "NOT_FOUND", 404),
  BadRequest: (message: string) => new AppError(message, "BAD_REQUEST", 400),
  Conflict: (message: string) => new AppError(message, "CONFLICT", 409),
  Internal: () => new AppError("Internal server error", "INTERNAL_ERROR", 500),
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }
  console.error("[API Error]", error)
  const detail =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error"
  return NextResponse.json({ error: detail, code: "INTERNAL_ERROR" }, { status: 500 })
}
