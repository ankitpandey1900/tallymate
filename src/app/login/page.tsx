import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

function isGoogleAuthConfigured() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return !!(clientId && clientSecret);
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient googleEnabled={isGoogleAuthConfigured()} />
    </Suspense>
  );
}
