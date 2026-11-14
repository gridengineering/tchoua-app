import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        firebaseToken: { label: "Firebase Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Si on a un token Firebase, on bypass le mot de passe (on devrait vérifier le token ici avec firebase-admin)
        if (credentials.firebaseToken) {
          console.log(`[AUTH] Firebase login for: ${credentials.email}`);
          
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { systemRole: { include: { permissions: true } } },
          });

          // Si l'utilisateur n'existe pas encore, on le crée
          if (!user) {
            console.log(`[AUTH] Creating new user via Social Login: ${credentials.email}`);
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split("@")[0], // Placeholder name
                password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
                role: "MEMBER",
                isActive: true,
              },
              include: { systemRole: { include: { permissions: true } } },
            });
          }

          if (!user.isActive || user.quarantinedAt) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            level: user.level,
            score: user.score,
            avatar: user.avatar,
            systemRoleId: user.systemRoleId,
            systemRoleName: user.systemRole?.name ?? null,
          };
        }

        if (!credentials?.password) return null;

        console.log(`[AUTH] Attempting login for: ${credentials.email}`);
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { systemRole: { include: { permissions: true } } },
        });

        if (!user) {
          console.log(`[AUTH] User not found: ${credentials.email}`);
          return null;
        }
        
        if (!user.isActive || user.quarantinedAt) {
          console.log(`[AUTH] User is inactive or quarantined: ${credentials.email}`);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.log(`[AUTH] Invalid password for: ${credentials.email}`);
          return null;
        }

        console.log(`[AUTH] Login successful: ${credentials.email} (Role: ${user.role})`);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          level: user.level,
          score: user.score,
          avatar: user.avatar,
          systemRoleId: user.systemRoleId,
          systemRoleName: user.systemRole?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.level = (user as any).level;
        token.score = (user as any).score;
        token.avatar = (user as any).avatar;
        token.systemRoleId = (user as any).systemRoleId ?? null;
        token.systemRoleName = (user as any).systemRoleName ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).level = token.level;
        (session.user as any).score = token.score;
        (session.user as any).avatar = token.avatar;
        (session.user as any).systemRoleId = token.systemRoleId ?? null;
        (session.user as any).systemRoleName = token.systemRoleName ?? null;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
