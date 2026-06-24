/**
 * Ownership helpers — verify that a resource belongs to the authenticated Clerk user
 * by walking back through the Class.clerkUserId chain.
 *
 * Every model roots back to Class:  Class → Unit → Lesson → {Slide, Worksheet, Quiz, MediaAsset}
 *
 * All functions return the resource on success, or null if it doesn't exist / isn't owned
 * by the caller.  Callers should respond with 404 (not 403) to avoid leaking existence.
 */

import { db } from "@/lib/db";

/** Class owned by userId */
export async function ownedClass(id: string, userId: string) {
  return db.class.findFirst({ where: { id, clerkUserId: userId } });
}

/** Unit whose parent Class is owned by userId */
export async function ownedUnit(id: string, userId: string) {
  return db.unit.findFirst({
    where: { id, class: { clerkUserId: userId } },
  });
}

/** Lesson whose ancestor Class is owned by userId */
export async function ownedLesson(id: string, userId: string) {
  return db.lesson.findFirst({
    where: { id, unit: { class: { clerkUserId: userId } } },
  });
}

/** Slide whose ancestor Class is owned by userId */
export async function ownedSlide(id: string, userId: string) {
  return db.slide.findFirst({
    where: { id, lesson: { unit: { class: { clerkUserId: userId } } } },
  });
}

/** Worksheet whose ancestor Class is owned by userId */
export async function ownedWorksheet(id: string, userId: string) {
  return db.worksheet.findFirst({
    where: { id, lesson: { unit: { class: { clerkUserId: userId } } } },
  });
}

/** Quiz whose ancestor Class is owned by userId */
export async function ownedQuiz(id: string, userId: string) {
  return db.quiz.findFirst({
    where: { id, lesson: { unit: { class: { clerkUserId: userId } } } },
  });
}

/**
 * MediaAsset owned by userId — either directly (clerkUserId) or via the lesson
 * it is attached to. Shared cache rows (clerkUserId null, lessonId null) are
 * owned by no one and are intentionally not returned here.
 */
export async function ownedMediaAsset(id: string, userId: string) {
  return db.mediaAsset.findFirst({
    where: { id, ...ownedMediaWhere(userId) },
  });
}

/** Prisma `where` fragment matching media assets owned by userId (direct or via lesson). */
export function ownedMediaWhere(userId: string) {
  return {
    OR: [
      { clerkUserId: userId },
      { lesson: { unit: { class: { clerkUserId: userId } } } },
    ],
  };
}
