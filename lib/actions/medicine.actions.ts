"use server";

import { ID, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import {
  BUCKET_ID,
  DATABASE_ID,
  ENDPOINT,
  MEDICINE_ID,
  PROJECT_ID,
  databases,
  storage,
} from "../appwrite.config";
import { parseStringify } from "../utils";
import { Medicine } from "@/types/appwrite.types";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  imageFile?: FormData; // ✅ matches patient pattern
};

export type UpdateMedicineParams = Partial<Omit<CreateMedicineParams, "imageFile">> & {
  imageFile?: FormData;
};

const getAppwriteFetchError = (error: unknown, subject: string): Error => {
  const cause = error instanceof Error ? (error as Error & { cause?: { code?: string } }).cause : undefined;
  if (cause?.code === "UND_ERR_CONNECT_TIMEOUT" || (error instanceof Error && error.message === "fetch failed")) {
    return new Error(`Could not connect to Appwrite to load ${subject}. Check internet/firewall access to the configured Appwrite endpoint and confirm the endpoint URL is correct.`);
  }
  return new Error(`Could not load ${subject} from Appwrite. Check the database, collection, and read permissions, then try again.`);
};

// ─── LIST MEDICINES ───────────────────────────────────────────────────────────
export const listMedicines = async (): Promise<Medicine[]> => {
  try {
    if (!DATABASE_ID || !MEDICINE_ID) {
      throw new Error("Appwrite medicine collection is not configured (DATABASE_ID or MEDICINE_ID is missing).");
    }
    const response = await databases.listDocuments<Medicine>(
      DATABASE_ID!,
      MEDICINE_ID!
    );
    const medicines = parseStringify(response.documents) as Medicine[];
    return medicines.sort((a, b) => a.medicineName.localeCompare(b.medicineName));
  } catch (error) {
    console.error("Failed to list medicines:", error);
    throw getAppwriteFetchError(error, "medicines");
  }
};

// ─── GET MEDICINE BY ID ───────────────────────────────────────────────────────
export const getMedicineById = async (id: string): Promise<Medicine | null> => {
  try {
    const medicine = await databases.getDocument<Medicine>(
      DATABASE_ID!,
      MEDICINE_ID!,
      id
    );
    return parseStringify(medicine);
  } catch (error) {
    console.error(`Failed to retrieve medicine (id: ${id}):`, error);
    throw getAppwriteFetchError(error, "this medicine");
  }
};

// ─── GET MEDICINES BY CATEGORY ────────────────────────────────────────────────
export const getMedicinesByCategory = async (category: string): Promise<Medicine[]> => {
  try {
    const response = await databases.listDocuments<Medicine>(
      DATABASE_ID!,
      MEDICINE_ID!,
      [Query.equal("category", category), Query.orderAsc("medicineName")]
    );
    return parseStringify(response.documents);
  } catch (error) {
    console.error(`Failed to get medicines by category "${category}":`, JSON.stringify(error, null, 2));
    return [];
  }
};

// ─── SEARCH MEDICINES ─────────────────────────────────────────────────────────
export const searchMedicines = async (searchTerm: string): Promise<Medicine[]> => {
  if (!searchTerm || searchTerm.trim().length === 0) return [];
  if (searchTerm.trim().length > 100) return [];

  try {
    const response = await databases.listDocuments<Medicine>(
      DATABASE_ID!,
      MEDICINE_ID!,
      [Query.search("medicineName", searchTerm.trim()), Query.orderAsc("medicineName")]
    );
    return parseStringify(response.documents);
  } catch (error) {
    console.error(`Failed to search medicines for "${searchTerm}":`, JSON.stringify(error, null, 2));
    return [];
  }
};

// ─── CREATE MEDICINE ──────────────────────────────────────────────────────────
export const createMedicine = async ({
  imageFile,
  ...medicineData
}: CreateMedicineParams): Promise<Medicine | null> => {
  try {
    // ✅ Same pattern as registerPatient
    let file;
    if (imageFile) {
      const blob = imageFile.get("blobFile") as Blob;
      const fileName = imageFile.get("fileName") as string;

      if (blob && fileName) {
        const inputFile = InputFile.fromBuffer(blob, fileName);
        file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
      }
    }

    // ✅ Generate docId and use it as medicineId
    const docId = ID.unique();

    const medicine = await databases.createDocument<Medicine>(
      DATABASE_ID!,
      MEDICINE_ID!,
      docId,
      {
        ...medicineData,
        medicineId: docId,
        medicineImageId: file?.$id ?? null,
        medicineImageUrl: file?.$id
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`
          : null,
      }
    );

    return parseStringify(medicine);
  } catch (error) {
    console.error("Failed to create medicine:", JSON.stringify(error, null, 2));
    return null;
  }
};

// ─── UPDATE MEDICINE ──────────────────────────────────────────────────────────
export const updateMedicine = async (
  id: string,
  { imageFile, ...updates }: UpdateMedicineParams
): Promise<Medicine | null> => {
  try {
    let file;

    if (imageFile) {
      // ✅ Same pattern as registerPatient image upload
      const blob = imageFile.get("blobFile") as Blob;
      const fileName = imageFile.get("fileName") as string;

      if (blob && fileName) {
        // Upload new image first
        const inputFile = InputFile.fromBuffer(blob, fileName);
        file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);

        // Delete old image if it exists
        const existing = await databases.getDocument<Medicine>(
          DATABASE_ID!,
          MEDICINE_ID!,
          id
        );
        if (existing.medicineImageId) {
          try {
            await storage.deleteFile(BUCKET_ID!, existing.medicineImageId);
          } catch {
            console.error("Failed to delete old medicine image");
          }
        }
      }
    }

    const updated = await databases.updateDocument<Medicine>(
      DATABASE_ID!,
      MEDICINE_ID!,
      id,
      {
        ...updates,
        ...(file?.$id && {
          medicineImageId: file.$id,
          medicineImageUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`,
        }),
      }
    );

    return parseStringify(updated);
  } catch (error) {
    console.error(`Failed to update medicine (id: ${id}):`, JSON.stringify(error, null, 2));
    return null;
  }
};

// ─── DELETE MEDICINE ──────────────────────────────────────────────────────────
export const deleteMedicine = async (id: string): Promise<boolean> => {
  try {
    const medicine = await databases.getDocument<Medicine>(
      DATABASE_ID!,
      MEDICINE_ID!,
      id
    );

    await databases.deleteDocument(DATABASE_ID!, MEDICINE_ID!, id);

    if (medicine.medicineImageId) {
      try {
        await storage.deleteFile(BUCKET_ID!, medicine.medicineImageId);
      } catch {
        console.error("Failed to delete medicine image from storage");
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete medicine (id: ${id}):`, JSON.stringify(error, null, 2));
    return false;
  }
};
