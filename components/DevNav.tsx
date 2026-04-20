"use client";

import { useState } from "react";
import Link from "next/link";

const pages = [
  { label: "Home", path: "/" },
  { group: "Auth" },
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" },
  { group: "Onboarding" },
  { label: "Onboarding", path: "/onboarding" },
  { group: "Student" },
  { label: "Student Dashboard", path: "/student" },
  { label: "Student Profile", path: "/student/profile" },
  { label: "Student Projects", path: "/student/projects" },
  { label: "Create Project", path: "/student/projects/create" },
  { label: "Student Defenses", path: "/student/defenses" },
  { label: "Student Invitations", path: "/student/invitations" },
  { group: "Adviser" },
  { label: "Adviser Dashboard", path: "/adviser" },
  { label: "Adviser Profile", path: "/adviser/profile" },
  { label: "Adviser Advisees", path: "/adviser/advisees" },
  { group: "Coordinator" },
  { label: "Coordinator Dashboard", path: "/coordinator" },
  { group: "Dev" },
  { label: "Components Preview", path: "/dev/components" },
  { label: "New Account Modal", path: "/dev/new-account-modal" },
] as const;

export default function DevNav() {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {open && (
        <div className="mb-2 w-64 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl text-sm">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 font-semibold text-gray-700 flex justify-between items-center">
            <span>Page Navigation</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
          <nav className="p-2 flex flex-col gap-0.5">
            {pages.map((item, i) =>
              "group" in item ? (
                <div
                  key={i}
                  className="px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                >
                  {item.group}
                </div>
              ) : (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setOpen(false)}
                  className="block px-2 py-1.5 rounded hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                  <span className="ml-1 text-[10px] text-gray-400">
                    {item.path}
                  </span>
                </Link>
              )
            )}
          </nav>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-700 transition-colors cursor-pointer text-xl"
        title="Dev Navigation"
      >
        nav
      </button>
    </div>
  );
}
