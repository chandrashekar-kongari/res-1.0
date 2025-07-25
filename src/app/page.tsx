import { Button } from "@/components/ui/button";
import { stackServerApp } from "@/stack";
import { LOGIN_URL, SIGNUP_URL } from "@/utils/constants";
import { redirect } from "next/navigation";

export default async function Page() {
  // SSR: Check if user is logged in
  const user = await stackServerApp.getUser({ tokenStore: "nextjs-cookie" });
  if (user) {
    redirect("/app");
  }

  return (
    <div>
      <a href={LOGIN_URL}>
        <Button variant="outline">Login</Button>
      </a>
      <a href={SIGNUP_URL}>
        <Button variant="outline">Signup</Button>
      </a>
    </div>
  );
}
