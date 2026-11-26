import "server-only";

import { prisma } from "@/lib/db";

/**
 * checkIfCourseBought
 *
 * Returns true when the given user has an ACTIVE enrollment for the course.
 * Used to gate the EnrollmentButton and protect lesson content.
 */
export async function checkIfCourseBought(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return enrollment !== null;
}
