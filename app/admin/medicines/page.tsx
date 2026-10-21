// app/admin/medicines/page.tsx
import { listMedicines } from "@/lib/actions/medicine.actions";
import BrandLogo from "@/components/BrandLogo";
import MedicineList from "@/components/medicines/MedicineList";
import Image from "next/image";
import Link from "next/link";

export default async function MedicinesPage() {
  // ── Fetch medicines server-side ───────────────────────────────────────────────
  const medicines = await listMedicines();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      {/* Header */}
      <header className="admin-header">
        <Link href="/" className="cursor-pointer">
          <BrandLogo alt="logo" className="h-8 w-fit" />
        </Link>
        <p className="text-16-semibold">Medicine Management</p>
      </header>

      {/* Main content */}
      <main className="admin-main">
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="header">Medicines 💊</h1>
              <p className="text-dark-700">
                Manage your pharmacy inventory
              </p>
            </div>
          </div>
        </section>

        {/* Client component handles all interactivity */}
        <MedicineList initialMedicines={medicines} />
      </main>
    </div>
  );
}
