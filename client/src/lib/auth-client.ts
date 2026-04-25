import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string" },
      },
    } as const),
  ],
});

// ✅ Important: export typed hooks from this instance
export const { signIn, signOut, useSession } = authClient;

type SessionUser = NonNullable<
  ReturnType<typeof authClient.useSession>["data"]
>["user"];

export const getRole = (user: SessionUser): string =>
  (user as unknown as { role: string }).role;
