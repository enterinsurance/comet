import { type NextRequest, NextResponse } from "next/server"
import { addCorsHeaders, createSecurityHeaders, handleCorsPreflightRequest } from "./cors"

export type ApiHandler = (
  request: NextRequest,
  ...args: any[]
) => Promise<NextResponse> | NextResponse | Promise<Response> | Response

export function withApiMiddleware(handler: ApiHandler) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        return handleCorsPreflightRequest(request)
      }

      // Execute the handler
      const handlerResponse = await handler(request, ...args)

      // Convert Response to NextResponse if needed
      const response =
        handlerResponse instanceof NextResponse
          ? handlerResponse
          : new NextResponse(handlerResponse.body, {
              status: handlerResponse.status,
              statusText: handlerResponse.statusText,
              headers: handlerResponse.headers,
            })

      // Add CORS headers to the response
      const responseWithCors = addCorsHeaders(response, request)

      // Add security headers
      const securityHeaders = createSecurityHeaders()
      Object.entries(securityHeaders).forEach(([key, value]) => {
        responseWithCors.headers.set(key, value)
      })

      return responseWithCors
    } catch (error) {
      console.error("API middleware error:", error)

      // Create error response with CORS headers
      const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 })

      // Add CORS headers to error response
      const errorResponseWithCors = addCorsHeaders(errorResponse, request)

      // Add security headers
      const securityHeaders = createSecurityHeaders()
      Object.entries(securityHeaders).forEach(([key, value]) => {
        errorResponseWithCors.headers.set(key, value)
      })

      return errorResponseWithCors
    }
  }
}

// Helper function to create a standardized API response
export function createApiResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  const response = NextResponse.json(data, { status })

  // Add custom headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Helper function to create error responses
export function createErrorResponse(message: string, status = 500, details?: any) {
  const errorData: any = { error: message }
  if (details) {
    errorData.details = details
  }

  return createApiResponse(errorData, status)
}
