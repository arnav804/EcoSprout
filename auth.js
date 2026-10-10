import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHmac } from "node:crypto";

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.COGNITO_REGION;
const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;

const cognito = new CognitoIdentityProviderClient({
  region,
});

function getSecretHash(username) {
  return createHmac("sha256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "EcoSprout Login",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();

        const password = String(credentials?.password || "");

        if (!email || !password) {
          return null;
        }

        if (!region || !clientId || !clientSecret) {
          console.error("Cognito environment variables are missing.");
          return null;
        }

        try {
          const response = await cognito.send(
            new InitiateAuthCommand({
              AuthFlow: "USER_PASSWORD_AUTH",
              ClientId: clientId,

              AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: getSecretHash(email),
              },
            })
          );

          if (!response.AuthenticationResult?.AccessToken) {
            console.error(
              "Cognito returned an authentication challenge."
            );
            return null;
          }

          const userResponse = await cognito.send(
            new GetUserCommand({
              AccessToken:
                response.AuthenticationResult.AccessToken,
            })
          );

          const attributes = Object.fromEntries(
            (userResponse.UserAttributes || []).map((attribute) => [
              attribute.Name,
              attribute.Value,
            ])
          );

          return {
            id: attributes.sub || userResponse.Username,
            email: attributes.email || email,
            name:
              attributes.name ||
              attributes.email?.split("@")[0] ||
              email.split("@")[0],
          };
        } catch (error) {
          console.error("Cognito login failed:", {
  name: error.name,
  message: error.message,
});
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },

  trustHost: true,

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId || token.sub;
      }

      return session;
    },
  },
});