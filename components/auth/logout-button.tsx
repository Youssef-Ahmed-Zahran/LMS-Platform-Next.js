"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type LogoutButtonProps = ComponentProps<typeof Button> & {
  onSignOutStart?: () => void;
  onSignOutEnd?: (hasError?: boolean) => void;
  redirectTo?: string;
  showIcon?: boolean;
};

export function LogoutButton({
  children,
  variant = "outline",
  size = "sm",
  onSignOutStart,
  onSignOutEnd,
  redirectTo = "/",
  showIcon = true,
  className,
  ...props
}: LogoutButtonProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setPending(true);
    onSignOutStart?.();
    toast.loading("Signing out...", { id: "sign-out" });

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out successfully.", { id: "sign-out" });
          setPending(false);
          onSignOutEnd?.(false);
          if (redirectTo) {
            router.replace(redirectTo);
          }
          router.refresh();
        },
        onError: (error) => {
          toast.error(error.error.message || "Failed to sign out.", { id: "sign-out" });
          setPending(false);
          onSignOutEnd?.(true);
        },
      },
    });
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={pending}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {showIcon &&
        (pending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <LogOutIcon className="size-4" />
        ))}
      {children ?? (pending ? "Signing out..." : "Sign out")}
    </Button>
  );
}
