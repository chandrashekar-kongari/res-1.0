import { stackServerApp } from "@/stack";

export async function requireStackUser() {
  return stackServerApp.getUser({ or: "redirect" });
}
