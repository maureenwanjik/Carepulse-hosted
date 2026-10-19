"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "../supabase";
import { Medicine } from "@/types/appwrite.types";

export type CreateMedicineParams = {
  medicineName: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  unit: string;
  dosage: string;
  requiresPrescription: boolean;
  manufacturer: string;
  expiryDate: string;
  imageFile?: FormData;
};
export type UpdateMedicineParams = Partial<Omit<CreateMedicineParams, "imageFile">> & { imageFile?: FormData };

const toMedicine = (row: any): Medicine => ({
  ...row,
  $id: row.id,
  medicineId: row.medicine_id || row.id,
  medicineName: row.medicine_name,
  medicineImageId: null,
  medicineImageUrl: row.image_path,
  requiresPrescription: row.requires_prescription,
  expiryDate: row.expiry_date,
  $createdAt: row.created_at,
  $updatedAt: row.updated_at,
} as Medicine);

const uploadImage = async (form?: FormData) => {
  if (!form) return undefined;
  const file = form.get("blobFile");
  const name = form.get("fileName");
  if (!(file instanceof Blob) || typeof name !== "string") return undefined;
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`medicines/${Date.now()}-${safeName}`, file, { access: "public", addRandomSuffix: true });
  return blob.url;
};

export const listMedicines = async (): Promise<Medicine[]> => {
  const { data, error } = await getSupabaseAdmin().from("medicines").select("*").order("medicine_name");
  if (error) throw new Error(`Could not load medicines: ${error.message}`);
  return (data ?? []).map(toMedicine);
};

export const listMedicinesForStore = async () => {
  try { return { medicines: await listMedicines() }; }
  catch (error) {
    console.error("Failed to list medicines:", error);
    return { medicines: [], error: "The medicine catalogue is temporarily unavailable." };
  }
};

export const getMedicineById = async (id: string): Promise<Medicine | null> => {
  const { data, error } = await getSupabaseAdmin().from("medicines").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toMedicine(data) : null;
};

export const getMedicinesByCategory = async (category: string): Promise<Medicine[]> => {
  const { data, error } = await getSupabaseAdmin().from("medicines").select("*").eq("category", category).order("medicine_name");
  if (error) throw error;
  return (data ?? []).map(toMedicine);
};

export const searchMedicines = async (searchTerm: string): Promise<Medicine[]> => {
  const term = searchTerm.trim();
  if (!term || term.length > 100) return [];
  const { data, error } = await getSupabaseAdmin().from("medicines").select("*").ilike("medicine_name", `%${term}%`).order("medicine_name");
  if (error) throw error;
  return (data ?? []).map(toMedicine);
};

const toRow = (input: Partial<CreateMedicineParams>) => {
  const row: Record<string, unknown> = {};
  const fields: [keyof CreateMedicineParams, string][] = [
    ["medicineName", "medicine_name"], ["description", "description"], ["price", "price"],
    ["category", "category"], ["stock", "stock"], ["unit", "unit"], ["dosage", "dosage"],
    ["requiresPrescription", "requires_prescription"], ["manufacturer", "manufacturer"], ["expiryDate", "expiry_date"],
  ];
  for (const [source, target] of fields) {
    if (input[source] !== undefined) row[target] = source === "expiryDate" && input[source] === "" ? null : input[source];
  }
  return row;
};

export const createMedicine = async ({ imageFile, ...medicineData }: CreateMedicineParams): Promise<Medicine | null> => {
  try {
    const imageUrl = await uploadImage(imageFile);
    const { data, error } = await getSupabaseAdmin().from("medicines").insert({ ...toRow(medicineData), image_path: imageUrl ?? null }).select().single();
    if (error) throw error;
    revalidatePath("/product"); revalidatePath("/admin/medicines");
    return toMedicine(data);
  } catch (error) { console.error("Failed to create medicine:", error); return null; }
};

export const updateMedicine = async (id: string, { imageFile, ...updates }: UpdateMedicineParams): Promise<Medicine | null> => {
  try {
    const row = toRow(updates);
    if (imageFile) row.image_path = await uploadImage(imageFile);
    const { data, error } = await getSupabaseAdmin().from("medicines").update(row).eq("id", id).select().single();
    if (error) throw error;
    revalidatePath("/product"); revalidatePath("/admin/medicines");
    return toMedicine(data);
  } catch (error) { console.error("Failed to update medicine:", error); return null; }
};

export const deleteMedicine = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: medicine } = await supabase.from("medicines").select("image_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("medicines").delete().eq("id", id);
    if (error) throw error;
    if (medicine?.image_path?.includes(".blob.vercel-storage.com/")) await del(medicine.image_path);
    revalidatePath("/product"); revalidatePath("/admin/medicines");
    return true;
  } catch (error) { console.error("Failed to delete medicine:", error); return false; }
};
