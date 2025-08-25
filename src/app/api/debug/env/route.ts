import { NextResponse } from "next/server"

export async function GET() {
  // Only show this in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "[SET - " + process.env.RESEND_API_KEY.substring(0, 5) + "...]" : "[NOT SET]",
    EMAIL_FROM: process.env.EMAIL_FROM || "[NOT SET]",
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO || "[NOT SET]",
    DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : "[NOT SET]",
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? "[SET]" : "[NOT SET]",
    envFileLoaded: "Environment variables loaded at: " + new Date().toISOString()
  })
}