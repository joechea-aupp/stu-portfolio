import { cookies } from "next/headers";
import { DirectoryApp } from "@/components/directory/DirectoryApp";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";

export default async function Home() {
  const cookieStore = await cookies();
  const initialKnownSession = Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return <DirectoryApp initialKnownSession={initialKnownSession} />;
}
