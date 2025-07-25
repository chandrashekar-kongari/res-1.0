"use client";

import {
  Home,
  Inbox,
  Calendar,
  Search,
  Settings,
  PanelLeftClose,
  PanelLeft,
  TrashIcon,
  Trash2Icon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DotsVerticalIcon,
  FileIcon,
  FileTextIcon,
  Pencil1Icon,
  PersonIcon,
  PlusIcon,
  SketchLogoIcon,
} from "@radix-ui/react-icons";
import { Separator } from "@radix-ui/react-separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import UserSettings from "../../../components/user-settings";
import React from "react";

const menuItems = [
  { title: "Resume 1", icon: Inbox },
  { title: "Resume 2", icon: Calendar },
  { title: "Resume 3", icon: Search },
  { title: "Resume 4", icon: Settings },
  { title: "Resume 5", icon: Settings },
  { title: "Resume 6", icon: Settings },
  { title: "Resume 7", icon: Settings },
  { title: "Resume 8", icon: Settings },
  { title: "Resume 9", icon: Settings },
  { title: "Resume 10", icon: Settings },
  { title: "Resume 11", icon: Settings },
  { title: "Resume 12", icon: Settings },
  { title: "Resume 13", icon: Settings },
  { title: "Resume 14", icon: Settings },
  { title: "Resume 15", icon: Settings },
  { title: "Resume 16", icon: Settings },
  { title: "Resume 17", icon: Settings },
  { title: "Resume 18", icon: Settings },
  { title: "Resume 19", icon: Settings },
  { title: "Resume 20", icon: Settings },
  { title: "Resume 21", icon: Settings },
  { title: "Resume 22", icon: Settings },
  { title: "Resume 23", icon: Settings },
  { title: "Resume 24", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" variant="inset" className="bg-gray-100">
      <SidebarContent className="p-0 m-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="flex flex-col h-[calc(100vh-1rem)] pb-2">
                <SidebarMenuItem key="app">
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2">
                      <Home />
                      <p>Point</p>
                    </div>
                  </SidebarMenuButton>
                  <Separator className="my-2" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        className="rounded-xl bg-gray-200 hover:bg-gray-300 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <PlusIcon />
                          <p className="text-xs">Create</p>
                        </div>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <p className="text-xs">Duplicate default resume</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <p className="text-xs">Create from scratch</p>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
                <Separator className="my-2" />
                <p className="text-xs text-gray-500 p-2">All resumes</p>
                <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className="rounded-xl hover:bg-gray-300"
                      >
                        <a href="#">
                          <FileTextIcon className="w-4 h-4" />
                          <span className="text-xs">{item.title}</span>
                          <div className="flex items-center gap-2 ml-auto">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <DotsVerticalIcon className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem>
                                  <Pencil1Icon className="w-4 h-4" />
                                  <p className="text-xs">Rename</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Trash2Icon className="w-4 h-4" />
                                  <p className="text-xs">Delete</p>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {menuItems.length === 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500 p-2">
                        No resumes found
                      </p>
                    </div>
                  )}
                </div>
                <Separator className="my-2" />
                <div className="mt-auto">
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2">
                      <SketchLogoIcon className="w-4 h-4" />
                      <p className="text-xs">Upgrade</p>
                    </div>
                  </SidebarMenuButton>

                  <React.Suspense
                    fallback={
                      <div className="p-2 text-xs text-gray-400">
                        Loading user...
                      </div>
                    }
                  >
                    <UserSettings />
                  </React.Suspense>
                </div>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
