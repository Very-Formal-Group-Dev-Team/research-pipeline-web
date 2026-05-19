"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/components/shadcn/ui/button";
import {
  slideFromLeft,
  slideFromRight,
  transition,
} from "@/features/calendar/animations";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";
import { DateNavigator } from "@/features/calendar/header/date-navigator";
import FilterEvents from "@/features/calendar/header/filter";
import { TodayButton } from "@/features/calendar/header/today-button";
import { UserSelect } from "@/features/calendar/header/user-select";
import { Settings } from "@/features/calendar/settings/settings";
import Views from "./view-tabs";

export function CalendarHeader() {
  const { view, events, readOnly, users } = useCalendar();
  const showUserSelect = !readOnly && users.length > 1;

  return (
    <motion.div className="flex flex-col gap-3 border-b border-neutral-200 p-3 sm:gap-4 sm:p-4">
      <motion.div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          className="flex min-w-0 flex-wrap items-center gap-2"
          variants={slideFromLeft}
          initial="initial"
          animate="animate"
          transition={transition}
        >
          <TodayButton />
          <div className="min-w-0 flex-1 sm:flex-none">
            <DateNavigator view={view} events={events} />
          </div>
        </motion.div>

        <motion.div
          className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2"
          variants={slideFromRight}
          initial="initial"
          animate="animate"
          transition={transition}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterEvents />
            <Views />
            <Settings />
          </div>

          {showUserSelect ? (
            <div className="w-full min-w-0 sm:w-40">
              <UserSelect />
            </div>
          ) : null}

          {!readOnly ? (
            <AddEditEventDialog>
              <Button className="w-full shrink-0 sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </AddEditEventDialog>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
