import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import type { Provider } from "next-auth/providers"

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

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      })

      if (!user || !user.password) {
        return null
      }

      const passwordMatch = await bcrypt.compare(
        credentials.password as string,
        user.password
      )

      if (!passwordMatch) {
        return null
      }

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
  callbacks: {
    // Handle account linking - if user signs in with Google but already has an email account, link them
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })

        if (existingUser) {
          // Check if this Google account is already linked
          const hasGoogleAccount = existingUser.accounts.some(
            (acc) => acc.provider === "google"
          )

          if (!hasGoogleAccount) {
            // Link the Google account to the existing user
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

            // Update user image from Google if they don't have one
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
