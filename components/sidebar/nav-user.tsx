"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  EllipsisVerticalIcon,
  HomeIcon,
  LayoutDashboard,
  Tv2,
} from "lucide-react";
import Link from "next/link";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  if (isPending) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage
                src={user?.image ?? `https://avatar.vercel.sh/${user?.email}`}
                alt={user?.name}
              />
              <AvatarFallback className="rounded-lg">
                {user?.name && user.name.length > 0
                  ? user?.name.charAt(0).toLocaleUpperCase()
                  : user?.email?.charAt(0).toLocaleUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user?.name && user.name.length > 0
                  ? user.name
                  : user?.email.split("@")[0]}
              </span>
              <span className="truncate text-xs text-foreground/70">
                {user?.email}
              </span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={
                        user?.image ?? `https://avatar.vercel.sh/${user?.email}`
                      }
                      alt={user?.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.name && user.name.length > 0
                        ? user?.name.charAt(0).toLocaleUpperCase()
                        : user?.email?.charAt(0).toLocaleUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.name && user.name.length > 0
                        ? user.name
                        : user?.email.split("@")[0]}
                    </span>
                    <span className="truncate text-xs text-foreground/70">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link href="/" className="flex items-center gap-2">
                  <HomeIcon />
                  Home Page
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/admin" className="flex items-center gap-2">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/admin/courses" className="flex items-center gap-2">
                  <Tv2 />
                  Courses
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="p-0 focus:bg-destructive/10"
            >
              <LogoutButton
                variant="ghost"
                size="default"
                redirectTo="/"
                className="w-full justify-start px-2 py-1.5 h-auto font-normal text-destructive hover:text-destructive hover:bg-transparent"
              >
                <span>Log out</span>
              </LogoutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
