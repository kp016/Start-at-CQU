import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.appdata',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      // Refresh the access token if it has expired
      if (
        token.expiresAt &&
        Date.now() / 1000 > (token.expiresAt as number) &&
        token.refreshToken
      ) {
        try {
          const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID ?? '',
              client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
          });
          const refreshed = await res.json();
          if (res.ok) {
            token.accessToken = refreshed.access_token;
            token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
          }
        } catch {
          // keep the stale token; API calls will 401 and surface to the UI
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};
