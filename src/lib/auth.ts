import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import type { Provider } from "next-auth/providers"

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_LOGIN_ATTEMPTS = 5 // Max attempts per window
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now()
  const key = email.toLowerCase()
  const attempt = loginAttempts.get(key)

  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return true
  }

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return false // Rate limited
  }

  attempt.count++
  return true
}

function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase())
}

// Build providers array conditionally
const providers: Provider[] = []

// Only add Google if credentials are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Only add GitHub if credentials are present
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  )
}

// Always add credentials provider
providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null
      }

      const email = credentials.email as string

      // Check rate limit before processing
      if (!checkLoginRateLimit(email)) {
        // Rate limited - return null (failed auth)
        // Note: NextAuth doesn't support custom error messages in authorize
        return null
      }

      const user = await prisma.user.findUnique({
        where: { email },
      })

      // Always hash something to prevent timing attacks
      // This makes response time consistent whether user exists or not
      const passwordToCompare = user?.password || '$2a$10$fakehashtopreventtimingattacks000000000000000000'

      const passwordMatch = await bcrypt.compare(
        credentials.password as string,
        passwordToCompare
      )

      if (!user || !user.password || !passwordMatch) {
        return null
      }

      // Successful login - reset rate limit counter
      resetLoginAttempts(email)

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }
    },
  })
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    // Handle account linking - if user signs in with OAuth but already has an email account, link them
    async signIn({ user, account }) {
      if ((account?.provider === "google" || account?.provider === "github") && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })

        if (existingUser) {
          // Check if this OAuth account is already linked
          const hasOAuthAccount = existingUser.accounts.some(
            (acc) => acc.provider === account.provider
          )

          if (!hasOAuthAccount) {
            // Link the OAuth account to the existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            })

            // Update user image from OAuth if they don't have one
            if (!existingUser.image && user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { image: user.image },
              })
            }
          }

          // Override the user id so JWT uses existing user
          user.id = existingUser.id
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        // Fetch additional user data (including image to keep in sync)
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            username: true,
            role: true,
            isPremium: true,
            isVerified: true,
            waxScore: true,
            image: true,
          }
        })
        if (dbUser) {
          session.user.username = dbUser.username
          session.user.role = dbUser.role
          // ADMIN and PREMIUM roles always have premium features
          session.user.isPremium = dbUser.isPremium || dbUser.role === 'ADMIN' || dbUser.role === 'PREMIUM'
          session.user.isVerified = dbUser.isVerified
          session.user.waxScore = dbUser.waxScore
          // Only override image if DB has one (preserve OAuth image otherwise)
          if (dbUser.image) {
            session.user.image = dbUser.image
          }
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
})
