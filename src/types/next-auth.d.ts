import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string | null
      isPremium?: boolean
      isVerified?: boolean
      waxScore?: number
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    username?: string | null
    isPremium?: boolean
    isVerified?: boolean
    waxScore?: number
  }
}
