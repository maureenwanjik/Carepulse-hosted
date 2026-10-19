// components/medicines/MedicineList.tsx
"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { Medicine } from "@/types/appwrite.types";
import MedicineFormModal from "./MedicineFormModal";
import DeleteMedicineButton from "./DeleteMedicineButton";
import { PackageSearch, Search } from "lucide-react";

interface MedicineListProps {
  initialMedicines: Medicine[];
}

// ── Derive unique categories from the medicine list ───────────────────────────
const getCategories = (medicines: Medicine[]): string[] => {
  const set = new Set(medicines.map((m) => m.category).filter(Boolean));
  return ["All", ...Array.from(set).sort()];
};

// ── Stock level badge ─────────────────────────────────────────────────────────
const StockBadge = ({ stock }: { stock: number }) => {
  if (stock === 0)
    return (
      <span className="rounded-full bg-red-600 px-2 py-0.5 text-12-semibold text-white">
        Out of Stock
      </span>
    );
  if (stock <= 10)
    return (
      <span className="rounded-full bg-yellow-600 px-2 py-0.5 text-12-semibold text-white">
        Low ({stock})
      </span>
    );
  return (
    <span className="rounded-full bg-green-600 px-2 py-0.5 text-12-semibold text-white">
      {stock}
    </span>
  );
};

const MedicineList = ({ initialMedicines }: MedicineListProps) => {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editTarget, setEditTarget] = useState<Medicine | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const categories = getCategories(medicines);

  // ── Filter logic ──────────────────────────────────────────────────────────────
  const filtered = medicines.filter((m) => {
    const matchesSearch =
      search.trim() === "" ||
      m.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || m.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // ── Callbacks from child components ──────────────────────────────────────────
  const handleCreated = (newMedicine: Medicine) => {
    startTransition(() => {
      setMedicines((prev) =>
        [...prev, newMedicine].sort((a, b) =>
          a.medicineName.localeCompare(b.medicineName)
        )
      );
    });
    setIsCreateOpen(false);
  };

  const handleUpdated = (updated: Medicine) => {
    startTransition(() => {
      setMedicines((prev) =>
        prev
          .map((m) => (m.$id === updated.$id ? updated : m))
          .sort((a, b) => a.medicineName.localeCompare(b.medicineName))
      );
    });
    setEditTarget(null);
  };

  const handleDeleted = (id: string) => {
    startTransition(() => {
      setMedicines((prev) => prev.filter((m) => m.$id !== id));
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            className="shad-input w-full pl-9"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full border px-3 py-1 text-12-semibold transition-colors ${
                selectedCategory === cat
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-dark-500 bg-dark-400 text-dark-700 hover:border-green-500 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Create button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="shad-primary-btn flex min-w-max items-center gap-2 rounded-lg px-4 py-2 text-14-medium"
        >
          <span className="text-lg leading-none">+</span>
          Add Medicine
        </button>
      </div>

      {/* ── Results count ── */}
      <p className="text-14-regular text-dark-700">
        {filtered.length} medicine{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* ── Table ── */}
      <div className="data-table">
        <table className="shad-table w-full">
          <thead>
            <tr className="shad-table-row-header">
              <th className="px-4 py-3 text-left text-14-medium">Medicine</th>
              <th className="px-4 py-3 text-left text-14-medium">Category</th>
              <th className="px-4 py-3 text-left text-14-medium">Dosage</th>
              <th className="px-4 py-3 text-left text-14-medium">Price</th>
              <th className="px-4 py-3 text-left text-14-medium">Stock</th>
              <th className="px-4 py-3 text-left text-14-medium">Rx</th>
              <th className="px-4 py-3 text-left text-14-medium">Expiry</th>
              <th className="px-4 py-3 text-left text-14-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-14-regular text-dark-700"
                >
                  No medicines found.
                </td>
              </tr>
            ) : (
              filtered.map((medicine) => (
                <tr key={medicine.$id} className="shad-table-row">
                  {/* Name + image */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {medicine.medicineImageUrl ? (
                        <Image
                          src={medicine.medicineImageUrl}
                          width={36}
                          height={36}
                          alt={medicine.medicineName}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-dark-500 text-12-semibold text-dark-700">
                          <PackageSearch aria-hidden="true" size={18} strokeWidth={1.5} />
                        </div>
                      )}
                      <div>
                        <p className="text-14-medium text-light-200">
                          {medicine.medicineName}
                        </p>
                        <p className="text-12-regular text-dark-700">
                          {medicine.manufacturer}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-14-regular text-dark-700">
                    {medicine.category}
                  </td>

                  {/* Dosage */}
                  <td className="px-4 py-3 text-14-regular text-dark-700">
                    {medicine.dosage} / {medicine.unit}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-14-medium text-light-200">
                    ${medicine.price.toFixed(2)}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3">
                    <StockBadge stock={medicine.stock} />
                  </td>

                  {/* Prescription required */}
                  <td className="px-4 py-3 text-14-regular">
                    {medicine.requiresPrescription ? (
                      <span className="text-red-500">Required</span>
                    ) : (
                      <span className="text-green-500">OTC</span>
                    )}
                  </td>

                  {/* Expiry */}
                  <td className="px-4 py-3 text-14-regular text-dark-700">
                    {medicine.expiryDate}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditTarget(medicine)}
                        className="rounded-md border border-dark-500 bg-dark-400 px-3 py-1 text-12-semibold text-light-200 transition hover:border-green-500 hover:text-green-500"
                      >
                        Edit
                      </button>
                      <DeleteMedicineButton
                        id={medicine.$id}
                        name={medicine.medicineName}
                        onDeleted={handleDeleted}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create modal ── */}
      {isCreateOpen && (
        <MedicineFormModal
          mode="create"
          onSuccess={handleCreated}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <MedicineFormModal
          mode="edit"
          medicine={editTarget}
          onSuccess={handleUpdated}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
};

export default MedicineList;
