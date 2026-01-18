import { DefaultSession, DefaultUser } from "next-auth"

export type UserRole = "USER" | "PREMIUM" | "ADMIN"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string | null
      role?: UserRole
      isPremium?: boolean
      isVerified?: boolean
      waxScore?: number
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    username?: string | null
    role?: UserRole
    isPremium?: boolean
    isVerified?: boolean
    waxScore?: number
  }
}
