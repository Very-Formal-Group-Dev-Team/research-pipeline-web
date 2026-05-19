import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transition } from "@/features/calendar/animations";
import type { TEventColor } from "@/features/calendar/types";

const eventBulletVariants = cva("size-2 rounded-full", {
  variants: {
    color: {
      blue: "bg-primary-600",
      green: "bg-success-600",
      red: "bg-error-500",
      yellow: "bg-warning-500",
      purple: "bg-purple-600 dark:bg-purple-500",
      orange: "bg-orange-600 dark:bg-orange-500",
      gray: "bg-gray-600 dark:bg-gray-500",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

export function EventBullet({
  color,
  className,
}: {
  color: TEventColor;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(eventBulletVariants({ color, className }))}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.2 }}
      transition={transition}
    />
  );
}
