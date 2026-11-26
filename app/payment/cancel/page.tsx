import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <XCircle className="size-12 text-red-500 dark:text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Payment Cancelled
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Your payment was cancelled and you have not been charged. You can
            try again whenever you&apos;re ready.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" nativeButton={false} render={<Link href="/courses" />}>
          Back to Courses
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Go Home
        </Button>
      </div>
    </main>
  );
}
