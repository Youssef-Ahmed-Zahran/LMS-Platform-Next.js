import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Features {
  title: string;
  description: string;
  icon: string;
}

const features: Features[] = [
  {
    title: "Courses for Every Goal",
    description:
      "Build any skill you can imagine with a constantly growing library of courses taught by world-class experts.",
    icon: "📚",
  },
  {
    title: "Learn at your own pace",
    description:
      "Build any skill you can imagine with a constantly growing library of courses taught by world-class experts.",
    icon: "📚",
  },
  {
    title: "Interactive Learning",
    description:
      "Build any skill you can imagine with a constantly growing library of courses taught by world-class experts.",
    icon: "📚",
  },
  {
    title: "Community & Support",
    description:
      "Build any skill you can imagine with a constantly growing library of courses taught by world-class experts.",
    icon: "📚",
  },
  {
    title: "Track your Progress",
    description:
      "Build any skill you can imagine with a constantly growing library of courses taught by world-class experts.",
    icon: "📚",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <Badge variant="outline">
            The Future of Online Education is here
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Evaluate your Learning Experience
          </h1>
          <p className="text-lg text-muted-foreground md:w-2/3">
            Discover a new way to learn with our modern, interactive Learning
            management system. Access high-quality courses, track your progress
            and achieve your educational goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              className={buttonVariants({
                size: "lg",
                variant: "default",
              })}
              href="/courses"
            >
              Explore Courses
            </Link>

            <Link
              className={buttonVariants({
                size: "lg",
                variant: "outline",
              })}
              href="/login"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
