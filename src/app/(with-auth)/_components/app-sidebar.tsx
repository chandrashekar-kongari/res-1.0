"use client";

import { Home, Trash2Icon } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";

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
  DrawingPinFilledIcon,
  DrawingPinIcon,
  CubeIcon,
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

// Loading skeleton component for resume items
function ResumeItemSkeleton({ width = "w-3/4" }: { width?: string }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="rounded-lg">
        <div className="flex items-center gap-2 w-full animate-pulse">
          {/* File icon skeleton */}
          <div className="w-4 h-4 bg-black/15 rounded-sm"></div>

          {/* Resume name skeleton - varies in width for realism */}
          <div className="flex-1 min-w-0">
            <div className={`h-4 bg-black/15 rounded-full ${width}`}></div>
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
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  const { data: resumes, isLoading: isResumesLoading } =
    trpc.resume.getAllResumeNames.useQuery();

  const utils = trpc.useUtils();

  const togglePinMutation = trpc.resume.togglePin.useMutation({
    onSuccess: () => {
      // Invalidate and refetch the resumes list
      utils.resume.getAllResumeNames.invalidate();
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

  // Initialize Stripe
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
  );

  const handleUpgradeClick = async () => {
    try {
      setIsLoadingCheckout(true);
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      // Create a checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { sessionId } = await response.json();

      // Redirect to checkout
      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Error:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  return (
    <>
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

      <Sidebar collapsible="none" variant="inset" className="bg-[#F5F5F5]">
        <SidebarContent className="p-0 m-0">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <div className="flex flex-col h-[calc(100vh-1rem)] pb-2">
                  <SidebarMenuItem key="app">
                    <SidebarMenuButton asChild>
                      <div className="flex items-center ">
                        <div className="w-6 h-6 rounded-lg bg-[#AD46FF]  flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            M
                          </span>
                        </div>
                        <p className="text-sm font-semibold">Memic</p>
                      </div>
                    </SidebarMenuButton>
                    <Separator className="my-2" />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className="rounded-xl bg-[#F3EBFD] text-[#AD46FF] border-[#AD46FF]  hover:bg-[#E6D6FF] cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <PlusIcon
                              strokeWidth={2}
                              className=" text-[#AD46FF]"
                            />
                            <p className="text-xs">
                              <span className="text-[#AD46FF]">
                                Create or Upload
                              </span>
                            </p>
                          </div>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-2xl w-xs p-2 shadow-none">
                        <DropdownMenuItem
                          onClick={() =>
                            setDuplicateFromPinnedResumeModalOpen(true)
                          }
                        >
                          <p className="text-xs">Duplicate pinned resume</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCreateFromScratchModalOpen(true)}
                        >
                          <p className="text-xs">Create new resume</p>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                  <Separator className="my-2" />
                  <p className="text-xs text-gray-500 p-2">All resumes</p>
                  <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
                    {isResumesLoading ? (
                      // Show loading skeletons
                      Array.from({ length: 3 }).map((_, index) => (
                        <ResumeItemSkeleton key={`skeleton-${index}`} />
                      ))
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
                              className="rounded-lg hover:bg-black/15 transition-colors duration-200"
                            >
                              <Link
                                href={`/app/${item.id}`}
                                className="flex items-center gap-0"
                              >
                                <FileTextIcon className="w-4 h-4 text-[#00C950]" />
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
                                      className="p-1 hover:bg-gray-400 rounded transition-colors duration-200"
                                    >
                                      {item.pinned ? (
                                        hoveredResumeId === item.id ? (
                                          <DrawingPinIcon className="w-[14px] h-[14px] text-gray-700" />
                                        ) : (
                                          <DrawingPinFilledIcon className="w-[14px] h-[14px] text-[#FA2C37]" />
                                        )
                                      ) : (
                                        <DrawingPinFilledIcon className="w-[14px] h-[14px] text-gray-700" />
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
                                          "p-1 hover:bg-gray-400 rounded transition-colors duration-200 opacity-0",
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
                                      className="rounded-2xl w-xs p-2"
                                    >
                                      <DropdownMenuItem
                                        className="px-2 rounded-lg"
                                        onClick={(e) =>
                                          handleRename(
                                            e,
                                            item.id,
                                            item.name || "Untitled"
                                          )
                                        }
                                      >
                                        <Pencil1Icon className="w-[14px] h-[14px]" />
                                        <p className="text-xs">Rename</p>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="px-2 rounded-lg"
                                        onClick={(e) =>
                                          handleDelete(
                                            e,
                                            item.id,
                                            item.name || "Untitled"
                                          )
                                        }
                                      >
                                        <Trash2Icon className="w-[14px] h-[14px]" />
                                        <p className="text-xs">Delete</p>
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
                  <div className="mt-auto">
                    <SidebarMenuButton
                      asChild
                      onClick={handleUpgradeClick}
                      disabled={isLoadingCheckout}
                    >
                      <div className="flex items-center gap-2">
                        <SketchLogoIcon className="w-4 h-4" />
                        <p className="text-xs">
                          {isLoadingCheckout ? "Loading..." : "Upgrade"}
                        </p>
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
    </>
  );
}
