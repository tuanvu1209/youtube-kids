"use client";

import { useTransition } from "react";
import { toggleAssignAction } from "@/lib/actions";

type Kid = { id: string; name: string; avatar: string };

export default function AssignChips({
  playlistId,
  kids,
  assignedKidIds,
}: {
  playlistId: string;
  kids: Kid[];
  assignedKidIds: string[];
}) {
  const [pending, startTransition] = useTransition();

  if (kids.length === 0) {
    return <p className="text-xs text-muted">Chưa có hồ sơ bé nào để gán.</p>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${pending ? "opacity-60" : ""}`}>
      {kids.map((kid) => {
        const on = assignedKidIds.includes(kid.id);
        return (
          <button
            key={kid.id}
            onClick={() =>
              startTransition(async () => {
                await toggleAssignAction(kid.id, playlistId);
              })
            }
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              on
                ? "border-grass bg-grass/15 text-grass"
                : "border-line text-muted hover:border-brand"
            }`}
            title={on ? `Bỏ gán khỏi ${kid.name}` : `Gán cho ${kid.name}`}
          >
            <span className="text-base">{kid.avatar}</span>
            {kid.name}
            <span>{on ? "✓" : "+"}</span>
          </button>
        );
      })}
    </div>
  );
}
