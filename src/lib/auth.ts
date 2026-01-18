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
