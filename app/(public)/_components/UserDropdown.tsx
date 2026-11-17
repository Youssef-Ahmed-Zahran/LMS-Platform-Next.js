"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  Settings,
  User as UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  isAdmin?: boolean;
  onSignOutStart?: () => void;
  onSignOutEnd?: (hasError?: boolean) => void;
}

export function UserDropdown({
  user,
  isAdmin = false,
  onSignOutStart,
  onSignOutEnd,
}: UserDropdownProps) {
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="relative h-9 rounded-full p-1 pl-2 gap-2 hover:bg-accent"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarImage
            src={user.image ?? undefined}
            alt={user.name ?? "User"}
          />
          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium md:inline-block max-w-[120px] truncate">
          {user.name || user.email || "Account"}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              {user.name && (
                <p className="text-sm font-medium leading-none truncate">
                  {user.name}
                </p>
              )}
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {isAdmin && (
            <DropdownMenuItem
              render={
                <Link href="/admin" className="flex items-center w-full" />
              }
            >
              <LayoutDashboard className="mr-2 size-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            render={
              <Link href="/courses" className="flex items-center w-full" />
            }
          >
            <BookOpen className="mr-2 size-4" />
            <span>My Courses</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            render={
              <Link href="/profile" className="flex items-center w-full" />
            }
          >
            <UserIcon className="mr-2 size-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            render={
              <Link href="/settings" className="flex items-center w-full" />
            }
          >
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
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
            onSignOutStart={onSignOutStart}
            onSignOutEnd={onSignOutEnd}
            redirectTo="/"
            className="w-full justify-start px-2 py-1.5 h-auto font-normal text-destructive hover:text-destructive hover:bg-transparent"
          >
            <span className="ml-2">Log out</span>
          </LogoutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
