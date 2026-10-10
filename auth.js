import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID,
      clientSecret: process.env.COGNITO_CLIENT_SECRET,
      issuer: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    }),
  ],

  trustHost: true,
  debug: true,

  pages: {
    signIn: "/login",
  },

});