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
import { Mail, LogOut, User2, MessageCircle } from "lucide-react";
import * as React from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import { useUser } from "@stackframe/stack";

const UserSettings = () => {
  const user = useUser();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <SidebarMenuButton asChild className="rounded-full hover:bg-gray-300 ">
          <div className="flex items-center gap-2">
            <Avatar className="border-2 w-8 h-8 flex items-center justify-center rounded-full">
              <AvatarFallback className="text-xs font-bold text-muted-foreground">
                {(user?.displayName ?? user?.primaryEmail ?? "A")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs truncate">{user?.displayName}</p>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-xs rounded-2xl">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium flex items-center gap-2">
            <User2 className="w-4 h-4 text-muted-foreground" />{" "}
            {user?.displayName}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            <Mail className="w-3 h-3" /> {user?.primaryEmail}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            window.open("https://tally.so/r/w505Ob", "_blank");
          }}
        >
          <MessageCircle className="w-4 h-4 mr-2" /> Contact Us
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
          onClick={() => user?.signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserSettings;
