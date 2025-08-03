"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, LogOut, User2, MessageCircle, CreditCard } from "lucide-react";
import * as React from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import { useUser } from "@stackframe/stack";
import { trpc } from "@/lib/trpc";

const UserSettings = () => {
  const user = useUser();

  const { data: userInfo } = trpc.user.get.useQuery(undefined, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <SidebarMenuButton
          asChild
          className="rounded-xl hover:bg-black/15 transition-colors duration-200 px-1"
        >
          <div className="flex items-center gap-2">
            <Avatar className="border-2 border-gray-200 dark:border-gray-700 w-8 h-8 flex items-center justify-center rounded-full shadow-sm">
              <AvatarFallback className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gradient-to-br from-[#AD46FF]/10 to-purple-100 dark:from-[#AD46FF]/20 dark:to-purple-900/30">
                {(user?.displayName ?? user?.primaryEmail ?? "A")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
              {user?.displayName}
            </p>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-72 rounded-3xl border-0 shadow-2xl bg-white dark:bg-gray-900 p-2"
      >
        <DropdownMenuLabel className="p-2 rounded-2xl  dark:from-gray-800 dark:to-gray-900 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 truncate">
                <User2 className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <span className="truncate">{user?.displayName || "User"}</span>
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{user?.primaryEmail}</span>
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuLabel className="rounded-2xl p-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 focus:bg-blue-50 dark:focus:bg-blue-900/20 mb-2">
          <a href="mailto:hello@memic.app">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  Contact Us
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email us at hello@memic.app
                </p>
              </div>
            </div>
          </a>
        </DropdownMenuLabel>

        {userInfo?.subscription_status === "active" && (
          <DropdownMenuItem
            className="rounded-2xl p-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 focus:bg-purple-50 dark:focus:bg-purple-900/20 mb-2"
            onClick={() => {
              window.location.href = "/api/portal";
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  Billing Portal
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage your subscription
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="rounded-2xl p-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 focus:bg-red-50 dark:focus:bg-red-900/20"
          onClick={() => user?.signOut()}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                Sign Out
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                End your current session
              </p>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserSettings;
