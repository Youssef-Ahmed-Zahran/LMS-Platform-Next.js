"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function VerifyRequestContent() {
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  async function handleVerifyAccount() {
    if (!email) {
      toast.error("Email not found. Please log in again.");
      router.push("/login");
      return;
    }

    if (!otp || otp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setPending(true);
    await authClient.signIn.emailOtp({
      email,
      otp,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Account verified successfully!");
          setPending(false);
          setOtp("");
          router.push("/");
          router.refresh();
        },
        onError: (ctx: { error: { message: string } }) => {
          toast.error(ctx.error.message);
          setPending(false);
        },
      },
    });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Please check your email</CardTitle>
        <CardDescription>
          We have sent a verification email code to{" "}
          <span className="font-medium text-foreground">
            {email || "your email address"}
          </span>
          . Please enter the code to verify your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <InputOTP
            value={otp}
            onChange={(value) => setOtp(value)}
            maxLength={6}
            disabled={pending}
            className="gap-2"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code we sent to your email
          </p>
        </div>

        <Button
          onClick={handleVerifyAccount}
          disabled={pending || otp.length < 6}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span className="ml-2">Verifying...</span>
            </>
          ) : (
            "Verify Account"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyRequest() {
  return (
    <Suspense>
      <VerifyRequestContent />
    </Suspense>
  );
}
