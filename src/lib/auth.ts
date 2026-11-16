import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import InstagramProvider from "next-auth/providers/instagram";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const oauthProviders: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  oauthProviders.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        url: "https://www.facebook.com/v23.0/dialog/oauth",
        params: { scope: "email,public_profile" },
      },
      token: "https://graph.facebook.com/v23.0/oauth/access_token",
      userinfo: {
        url: "https://graph.facebook.com/v23.0/me",
        params: { fields: "id,name,email,picture" },
      },
    })
  );
}

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  oauthProviders.push({
    id: "linkedin",
    name: "LinkedIn",
    type: "oauth",
    wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
    authorization: { params: { scope: "openid profile email" } },
    idToken: true,
    checks: ["pkce", "state"],
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    profile(profile: {
      sub: string;
      name?: string;
      email?: string;
      picture?: string;
    }) {
      return {
        id: profile.sub,
        name: profile.name ?? profile.email ?? "Membre LinkedIn",
        email: profile.email ?? null,
        image: profile.picture ?? null,
      };
    },
  } as NextAuthOptions["providers"][number]);
}

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
    ...oauthProviders,
    ...(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET
      ? [
          InstagramProvider({
            clientId: process.env.INSTAGRAM_CLIENT_ID,
            clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;

      const rawEmail = user.email?.trim().toLowerCase();
      const email = rawEmail || `${account.provider}-${account.providerAccountId}@sso.tchoua.local`;

      let dbUser = await prisma.user.findUnique({
        where: { email },
        include: { systemRole: { include: { permissions: true } } },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name?.trim() || email.split("@")[0],
            password: await bcrypt.hash(Math.random().toString(36) + Date.now().toString(36), 10),
            role: "MEMBER",
            isActive: true,
            isVerified: Boolean(rawEmail),
            emailVerifiedAt: rawEmail ? new Date() : null,
            kycLevel: rawEmail ? 1 : 0,
            kycStatus: rawEmail ? "VERIFIED" : "NONE",
            avatar: user.image ?? null,
          },
          include: { systemRole: { include: { permissions: true } } },
        });
      }

      if (!dbUser.isActive || dbUser.quarantinedAt) return false;

      (user as any).id = dbUser.id;
      (user as any).role = dbUser.role;
      (user as any).level = dbUser.level;
      (user as any).score = dbUser.score;
      (user as any).avatar = dbUser.avatar;
      (user as any).systemRoleId = dbUser.systemRoleId;
      (user as any).systemRoleName = dbUser.systemRole?.name ?? null;

      return true;
    },
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
