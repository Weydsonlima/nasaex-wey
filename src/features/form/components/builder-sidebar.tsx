"use client";
import React, { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FileTextIcon, Home } from "lucide-react";
import { FormBlockBox } from "@/features/form/components/common/form-block-box";
import { FormSettings } from "@/features/form/components/common/form-settings";
import { useBuilderStore } from "@/features/form/context/builder-form-provider";

export function BuilderSidebar({
  rest,
}: {
  rest?: React.ComponentProps<typeof Sidebar>;
}) {
  const { formData } = useBuilderStore();

  const [tab, setTab] = useState<"blocks" | "settings">("blocks");

  return (
    <Sidebar className="border-r left-12" {...rest}>
      <SidebarHeader className="bg-accent px-0">
        <header
          className="border-b border-border
              w-full pt-1 pb-2 flex shrink-0 items-center gap-2
              "
        >
          <div className="flex items-center gap-2 px-4">
            <Home className="-ml-1 w-4 h-4" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-1">
                    <FileTextIcon className="w-4 h-4 mb-[3px]" />
                    <h5 className="truncate flex w-[110px] text-sm">
                      {formData?.name || "Untitled"}
                    </h5>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
      </SidebarHeader>
      <SidebarContent
        className="pt-2 
      px-5 bg-accent"
      >
        <div className="w-full">
          <div
            className="w-full flex flex-row
           gap-1 h-[39px] rounded-full bg-accent p-1"
          >
            <button
              className={cn(
                `p-[5px] flex-1 bg-transparent
                transition-colors
                ease-in-out rounded-full text-center
                font-medium text-sm
                              `,
                {
                  "bg-accent-foreground/5": tab === "blocks",
                },
              )}
              onClick={() => setTab("blocks")}
            >
              Blocks
            </button>
            <button
              className={cn(
                `p-[5px] flex-1 bg-transparent
                transition-colors
                ease-in-out rounded-full text-center
                font-medium text-sm
                              `,
                {
                  "bg-accent-foreground/5": tab === "settings",
                },
              )}
              onClick={() => setTab("settings")}
            >
              Settings
            </button>
          </div>
          {/* {Form Blocks} */}
          {tab === "blocks" && <FormBlockBox />}
          {/* {Form Settings} */}
          {tab === "settings" && <FormSettings />}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
