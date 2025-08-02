"use client";

import { DiamondIcon, Gem, Trash2Icon } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DotsVerticalIcon,
  FileTextIcon,
  Pencil1Icon,
  PlusIcon,
  DrawingPinFilledIcon,
  DrawingPinIcon,
} from "@radix-ui/react-icons";
import { Separator } from "@radix-ui/react-separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import UserSettings from "../../../components/user-settings";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import CreateFromScratchModal from "./CreateFromScratchModal";
import RenameModal from "./RenameModal";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { cn } from "@/lib/utils";
import DuplicateFromPinnedResumeModal from "./DuplicateFromPinnedResumeModal";
import Image from "next/image";
import { PricingModal } from "@/components/ui/pricing-modal";

function ResumeItemSkeleton() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="rounded-lg  px-0">
        <div className="flex items-center gap-1 w-full animate-pulse">
          {/* File icon skeleton */}

          {/* Resume name skeleton - varies in width for realism */}
          <div className="flex-1 ">
            <div className={`h-7 bg-black/15 rounded-lg `}></div>
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const params = useParams();
  const currentResumeId = params?.id as string;
  const [createFromScratchModalOpen, setCreateFromScratchModalOpen] =
    useState(false);
  const [hoveredResumeId, setHoveredResumeId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [
    duplicateFromPinnedResumeModalOpen,
    setDuplicateFromPinnedResumeModalOpen,
  ] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: resumes, isLoading: isResumesLoading } =
    trpc.resume.getAllResumeNames.useQuery();

  const { data: userInfo } = trpc.user.get.useQuery(undefined, {});

  const utils = trpc.useUtils();

  const togglePinMutation = trpc.resume.togglePin.useMutation({
    onSuccess: () => {
      // Invalidate and refetch the resumes list
      utils.resume.getAllResumeNames.invalidate();
      utils.resume.list.invalidate();
    },
  });

  const handleTogglePin = (e: React.MouseEvent, resumeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    togglePinMutation.mutate({ id: resumeId });
  };

  const handleRename = (
    e: React.MouseEvent,
    resumeId: string,
    resumeName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedResume({ id: resumeId, name: resumeName });
    setRenameModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleDelete = (
    e: React.MouseEvent,
    resumeId: string,
    resumeName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedResume({ id: resumeId, name: resumeName });
    setDeleteDialogOpen(true);
    setOpenDropdownId(null);
  };

  const [openUpgradeModal, setOpenUpgradeModal] = useState(false);

  return (
    <>
      <PricingModal open={openUpgradeModal} setOpen={setOpenUpgradeModal} />
      <CreateFromScratchModal
        open={createFromScratchModalOpen}
        setOpen={setCreateFromScratchModalOpen}
      />
      <DuplicateFromPinnedResumeModal
        open={duplicateFromPinnedResumeModalOpen}
        setOpen={setDuplicateFromPinnedResumeModalOpen}
      />

      {selectedResume && (
        <>
          <RenameModal
            open={renameModalOpen}
            setOpen={setRenameModalOpen}
            resumeId={selectedResume.id}
            currentName={selectedResume.name}
          />
          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            setOpen={setDeleteDialogOpen}
            resumeId={selectedResume.id}
            resumeName={selectedResume.name}
          />
        </>
      )}

      <Sidebar collapsible="none" variant="inset" className="bg-[#FCFCFC]">
        <SidebarContent className="p-0 m-0">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <div className="flex flex-col h-[calc(100vh-1rem)] pb-2">
                  <SidebarMenuItem key="app">
                    <SidebarMenuButton asChild>
                      <div className="flex items-center ">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                          <Image
                            src="/memic-logo-4.svg"
                            alt="Memic"
                            width={48}
                            height={48}
                          />
                        </div>
                        <p className="text-sm font-semibold">Memic</p>
                      </div>
                    </SidebarMenuButton>
                    <Separator className="my-2" />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className="rounded-xl bg-[#E6D6FF] text-[#AD46FF] border-[#AD46FF]  hover:bg-[#AD46FF]/40 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold px-1">
                            <div className="p-1.5 rounded-lg bg-[#F3EBFD] dark:bg-emerald-900/30 shrink-0">
                              <PlusIcon
                                strokeWidth={2}
                                className=" text-[#AD46FF]"
                              />
                            </div>

                            <p className="text-xs">
                              <span className="text-[#AD46FF]">Create</span>
                            </p>
                          </div>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-3xl p-2 gap-2 w-30 shadow-2xl border-0 bg-white dark:bg-gray-900">
                        <DropdownMenuItem
                          onClick={() =>
                            setDuplicateFromPinnedResumeModalOpen(true)
                          }
                          className="rounded-2xl p-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                              <FileTextIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                Duplicate Pinned Resume
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCreateFromScratchModalOpen(true)}
                          className="rounded-2xl p-2 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 focus:bg-purple-50 dark:focus:bg-purple-900/20"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                              <PlusIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                Create New Resume
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                  <Separator className="my-2" />
                  <p className="text-xs text-gray-500 p-2">All resumes</p>
                  <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
                    {isResumesLoading ? (
                      <div className="flex flex-col gap-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <ResumeItemSkeleton key={`skeleton-${index}`} />
                        ))}
                      </div>
                    ) : resumes && resumes.length > 0 ? (
                      // Show actual resumes
                      resumes.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <div
                            className={`transition-all duration-200 ${
                              item.id === currentResumeId
                                ? "  bg-black/10 rounded-xl"
                                : ""
                            }`}
                            onMouseEnter={() => setHoveredResumeId(item.id)}
                            onMouseLeave={() => setHoveredResumeId(null)}
                          >
                            <SidebarMenuButton
                              asChild
                              className="rounded-xl hover:bg-black/15 transition-colors duration-200"
                            >
                              <Link
                                href={`/app/${item.id}`}
                                className="flex items-center gap-0 px-1"
                              >
                                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                                  <FileTextIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-xs truncate">
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-1 ml-auto">
                                  {/* Pin/Unpin button - shows on hover or if pinned */}
                                  {(hoveredResumeId === item.id ||
                                    item.pinned) && (
                                    <button
                                      onClick={(e) =>
                                        handleTogglePin(e, item.id)
                                      }
                                      className="p-1 hover:bg-black/10 rounded-full transition-colors duration-200"
                                    >
                                      {item.pinned ? (
                                        hoveredResumeId === item.id ? (
                                          <DrawingPinIcon className="w-[14px] h-[14px] text-black/50" />
                                        ) : (
                                          <DrawingPinFilledIcon className="w-[14px] h-[14px] text-[#FA2C37]" />
                                        )
                                      ) : (
                                        <DrawingPinFilledIcon className="w-[14px] h-[14px] text-black/50" />
                                      )}
                                    </button>
                                  )}
                                  <DropdownMenu
                                    onOpenChange={(open) =>
                                      setOpenDropdownId(open ? item.id : null)
                                    }
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className={cn(
                                          "p-1 hover:bg-black/10 rounded-full transition-colors duration-200 opacity-0",
                                          (item.id === hoveredResumeId ||
                                            item.id === openDropdownId) &&
                                            "opacity-100"
                                        )}
                                      >
                                        <DotsVerticalIcon className="w-3 h-3" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="start"
                                      className="rounded-3xl p-2 w-30 gap-2 shadow-2xl border-0 bg-white dark:bg-gray-900"
                                    >
                                      <DropdownMenuItem
                                        className="rounded-2xl p-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 focus:bg-blue-50 dark:focus:bg-blue-900/20"
                                        onClick={(e) =>
                                          handleRename(
                                            e,
                                            item.id,
                                            item.name || "Untitled"
                                          )
                                        }
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                            <Pencil1Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-xs  text-gray-900 dark:text-gray-100">
                                              Rename Resume
                                            </p>
                                          </div>
                                        </div>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="rounded-2xl p-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 focus:bg-red-50 dark:focus:bg-red-900/20"
                                        onClick={(e) =>
                                          handleDelete(
                                            e,
                                            item.id,
                                            item.name || "Untitled"
                                          )
                                        }
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                                            <Trash2Icon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-xs  text-gray-900 dark:text-gray-100">
                                              Delete Resume
                                            </p>
                                          </div>
                                        </div>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </Link>
                            </SidebarMenuButton>
                          </div>
                        </SidebarMenuItem>
                      ))
                    ) : (
                      // Show empty state
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 p-2">
                          No resumes found
                        </p>
                      </div>
                    )}
                  </div>
                  <Separator className="my-2" />
                  {userInfo?.subscription_status === "active" ? (
                    <SidebarMenuButton
                      asChild
                      onClick={() => setOpenUpgradeModal(true)}
                      className="rounded-xl cursor-pointer"
                    >
                      <div className="flex items-center ">
                        <Gem className="w-4 h-4 text-[#AD46FF]" />
                        <p className="text-xs">Upgrade to Pro</p>
                      </div>
                    </SidebarMenuButton>
                  ) : null}
                  <Separator className="my-2" />
                  <div className="mt-auto">
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
    </>
  );
}
