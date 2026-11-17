"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { GitHubIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [githubPending, setGithubPending] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [email, setEmail] = useState("");

  async function signinWithGithub() {
    setGithubPending(true);
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed in with Github, you will be redirected...");
        },
        onError: (error) => {
          toast.error(error.error.message);
          setGithubPending(false);
        },
      },
    });
  }

  async function signWithEmail() {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    const currentEmail = email;
    setEmailPending(true);
    await authClient.emailOtp.sendVerificationOtp({
      email: currentEmail,
      type: "sign-in",
      fetchOptions: {
        onSuccess: () => {
          toast.success("Verification code sent to your email");
          // Reset BEFORE navigating so cached state is clean on return
          setEmailPending(false);
          setEmail("");
          router.push(`/verify-request?email=${currentEmail}`);
        },
        onError: (error) => {
          toast.error(error.error.message);
          setEmailPending(false);
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Login to access your courses and track your progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          onClick={signinWithGithub}
          disabled={githubPending || emailPending}
          className="w-full"
          variant="outline"
        >
          {githubPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span className="ml-2">Please wait...</span>
            </>
          ) : (
            <>
              <GitHubIcon className="size-4" />
              <span>Sign in with GitHub</span>
            </>
          )}
        </Button>

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            signWithEmail();
          }}
          className="grid gap-3"
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your Email"
              required
              disabled={emailPending || githubPending}
              autoComplete="email"
            />
          </div>

          <Button
            type="submit"
            disabled={emailPending || githubPending}
            className="w-full"
          >
            {emailPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span className="ml-2">Please wait...</span>
              </>
            ) : (
              "Continue with email"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
