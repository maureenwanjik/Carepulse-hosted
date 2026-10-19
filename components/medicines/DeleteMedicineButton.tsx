// components/medicines/DeleteMedicineButton.tsx
"use client";

import React, { useState } from "react";
import { deleteMedicine } from "@/lib/actions/medicine.actions";

interface Props {
  id: string;
  name: string;
  onDeleted: (id: string) => void;
}

type State = "idle" | "confirming" | "deleting" | "error";

const DeleteMedicineButton = ({ id, name, onDeleted }: Props) => {
  const [state, setState] = useState<State>("idle");

  const handleDeleteClick = () => {
    setState("confirming");
  };

  const handleCancel = () => {
    setState("idle");
  };

  const handleConfirm = async () => {
    setState("deleting");
    try {
      const success = await deleteMedicine(id);
      if (success) {
        onDeleted(id);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  // ── Idle: show delete button ──────────────────────────────────────────────
  if (state === "idle") {
    return (
      <button
        onClick={handleDeleteClick}
        className="rounded-md border border-dark-500 bg-dark-400 px-3 py-1 text-12-semibold text-red-500 transition hover:border-red-700 hover:bg-red-600/10"
      >
        Delete
      </button>
    );
  }

  // ── Error: let the user retry ─────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-12-regular text-red-500">Failed.</span>
        <button
          onClick={() => setState("idle")}
          className="rounded-md border border-dark-500 bg-dark-400 px-3 py-1 text-12-semibold text-dark-700 hover:text-light-200"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // ── Confirming or deleting: inline confirmation ───────────────────────────
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-700 bg-red-600/10 px-3 py-1">
      <span className="text-12-regular text-red-500 max-w-[120px] truncate">
        Delete &quot;{name}&quot;?
      </span>
      <button
        onClick={handleConfirm}
        disabled={state === "deleting"}
        className="text-12-semibold text-red-500 transition hover:text-red-400 disabled:opacity-50"
      >
        {state === "deleting" ? "Deleting..." : "Yes"}
      </button>
      <span className="text-dark-500">|</span>
      <button
        onClick={handleCancel}
        disabled={state === "deleting"}
        className="text-12-semibold text-dark-700 transition hover:text-light-200 disabled:opacity-50"
      >
        No
      </button>
    </div>
  );
};

export default DeleteMedicineButton;