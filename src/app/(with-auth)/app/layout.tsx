import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/(with-auth)/_components/app-sidebar";
import { redirect } from "next/navigation";
import { LOGIN_URL } from "@/utils/constants";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await stackServerApp.getUser({ tokenStore: "nextjs-cookie" });
  if (!user) {
    redirect(LOGIN_URL);
  }
  return (
    <StackProvider app={stackServerApp}>
      <StackTheme>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          {children}
        </SidebarProvider>
      </StackTheme>
    </StackProvider>
  );
}
