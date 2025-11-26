import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch additional user data
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            username: true,
            isPremium: true,
            isVerified: true,
            waxScore: true,
          }
        })
        if (dbUser) {
          session.user.username = dbUser.username
          session.user.isPremium = dbUser.isPremium
          session.user.isVerified = dbUser.isVerified
          session.user.waxScore = dbUser.waxScore
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/onboarding',
  },
  events: {
    async createUser({ user }) {
      // Create default notification settings for new users
      if (user.id) {
        await prisma.notificationSettings.create({
          data: {
            userId: user.id,
          }
        })
      }
    }
  }
})
