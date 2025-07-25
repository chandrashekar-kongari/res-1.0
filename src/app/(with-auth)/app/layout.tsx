import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
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
