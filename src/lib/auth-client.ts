import { createAuthClient } from "better-auth/react"
import type { Session, User } from "./auth"

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
})

export const { signIn, signOut, signUp, useSession, getSession } = authClient

export type { Session, User }
