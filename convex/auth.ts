import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

// Email + password auth. Swap/add providers (GitHub, Google, etc.) here later
// without touching the Stripe code — the rest keys off the authenticated user id.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
