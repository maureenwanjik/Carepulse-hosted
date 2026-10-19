// components/medicines/MedicineFormModal.tsx
"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Medicine } from "@/types/appwrite.types";
import { createMedicine, updateMedicine } from "@/lib/actions/medicine.actions";


interface Props {
  mode: "create" | "edit";
  medicine?: Medicine;
  onSuccess: (medicine: Medicine) => void;
  onClose: () => void;
}

// ── Field validation ──────────────────────────────────────────────────────────
type FormErrors = Partial<Record<string, string>>;

const validate = (fields: Record<string, string | boolean | number>): FormErrors => {
  const errors: FormErrors = {};

  if (!String(fields.medicineName).trim())
    errors.medicineName = "Medicine name is required.";
  else if (String(fields.medicineName).length > 200)
    errors.medicineName = "Name must be under 200 characters.";

  if (!String(fields.description).trim())
    errors.description = "Description is required.";
  else if (String(fields.description).length > 1000)
    errors.description = "Description must be under 1000 characters.";

  if (!String(fields.category).trim())
    errors.category = "Category is required.";

  if (!String(fields.manufacturer).trim())
    errors.manufacturer = "Manufacturer is required.";

  if (!String(fields.dosage).trim())
    errors.dosage = "Dosage is required.";

  if (!String(fields.unit).trim())
    errors.unit = "Unit is required.";

  if (!String(fields.expiryDate).trim())
    errors.expiryDate = "Expiry date is required.";

  const price = Number(fields.price);
  if (isNaN(price) || price < 0)
    errors.price = "Price must be a positive number.";

  const stock = Number(fields.stock);
  if (isNaN(stock) || stock < 0 || !Number.isInteger(stock))
    errors.stock = "Stock must be a whole non-negative number.";

  return errors;
};

// ── Reusable field wrapper ────────────────────────────────────────────────────
const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label className="shad-input-label">{label}</label>
    {children}
    {error && <p className="shad-error text-12-regular">{error}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Antibiotics",
  "Antivirals",
  "Antifungals",
  "Pain Relief",
  "Anti-inflammatory",
  "Vitamins & Supplements",
  "Cardiovascular",
  "Diabetes",
  "Respiratory",
  "Gastrointestinal",
  "Dermatology",
  "Mental Health",
  "Hormones",
  "Other",
];

const UNITS = ["tablet", "capsule", "bottle", "sachet", "vial", "patch", "ml", "g"];

const MedicineFormModal = ({ mode, medicine, onSuccess, onClose }: Props) => {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [fields, setFields] = useState({
    medicineName: medicine?.medicineName ?? "",
    description: medicine?.description ?? "",
    category: medicine?.category ?? "",
    manufacturer: medicine?.manufacturer ?? "",
    dosage: medicine?.dosage ?? "",
    unit: medicine?.unit ?? "",
    expiryDate: medicine?.expiryDate ?? "",
    price: medicine?.price?.toString() ?? "",
    stock: medicine?.stock?.toString() ?? "",
    requiresPrescription: medicine?.requiresPrescription ?? false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    medicine?.medicineImageUrl ?? null
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFields((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear field error on change
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side guard: images only, max 5MB
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "File must be an image." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "Image must be smaller than 5MB.",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: undefined }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

const buildImagePayload = (file: File): FormData => {
  // ✅ Exact same pattern as RegisterForm / patient.actions.ts
  const blobFile = new Blob([file], { type: file.type });
  const formData = new FormData();
  formData.append("blobFile", blobFile);
  formData.append("fileName", file.name);
  return formData;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Client-side validation
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
        const payload = {
        medicineName: fields.medicineName.trim(),
        description: fields.description.trim(),
        category: fields.category,
        manufacturer: fields.manufacturer.trim(),
        dosage: fields.dosage.trim(),
        unit: fields.unit,
        expiryDate: fields.expiryDate,
        price: parseFloat(fields.price),
        stock: parseInt(fields.stock, 10),
        requiresPrescription: fields.requiresPrescription,
        imageFile: imageFile ? buildImagePayload(imageFile) : undefined,
        };

      let result: Medicine | null = null;

      if (mode === "create") {
        result = await createMedicine(payload);
      } else if (medicine?.$id) {
        result = await updateMedicine(medicine.$id, payload);
      }

      if (!result) {
        setServerError("Something went wrong. Please try again.");
        return;
      }

      onSuccess(result);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog */}
      <div className="shad-dialog flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-500 px-6 py-4">
          <h2 className="sub-header">
            {mode === "create" ? "Add Medicine" : "Edit Medicine"}
          </h2>
          <button
            onClick={onClose}
            className="text-dark-700 transition hover:text-light-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit}
          className="remove-scrollbar flex flex-col gap-5 overflow-y-auto px-6 py-5"
        >
          {/* Server error */}
          {serverError && (
            <p className="rounded-lg border border-red-700 bg-red-600/10 px-4 py-3 text-14-regular text-red-500">
              {serverError}
            </p>
          )}

          {/* ── Image upload ── */}
          <div className="flex flex-col gap-1">
            <label className="shad-input-label">Medicine Image</label>
            <div
              className="file-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  width={80}
                  height={80}
                  alt="preview"
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="file-upload_label">
                  <Image
                    src="/assets/icons/upload.svg"
                    width={40}
                    height={40}
                    alt="upload"
                  />
                  <p>
                    <span className="text-green-500">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-12-regular text-dark-700">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {errors.image && (
              <p className="shad-error text-12-regular">{errors.image}</p>
            )}
          </div>

          {/* ── Two column grid ── */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Medicine Name *" error={errors.medicineName}>
              <input
                name="medicineName"
                value={fields.medicineName}
                onChange={handleChange}
                maxLength={200}
                placeholder="e.g. Amoxicillin"
                className="shad-input"
              />
            </Field>

            <Field label="Manufacturer *" error={errors.manufacturer}>
              <input
                name="manufacturer"
                value={fields.manufacturer}
                onChange={handleChange}
                maxLength={200}
                placeholder="e.g. Pfizer"
                className="shad-input"
              />
            </Field>

            <Field label="Category *" error={errors.category}>
              <select
                name="category"
                value={fields.category}
                onChange={handleChange}
                className="shad-select-trigger shad-input"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Unit *" error={errors.unit}>
              <select
                name="unit"
                value={fields.unit}
                onChange={handleChange}
                className="shad-select-trigger shad-input"
              >
                <option value="">Select unit</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Dosage *" error={errors.dosage}>
              <input
                name="dosage"
                value={fields.dosage}
                onChange={handleChange}
                maxLength={50}
                placeholder="e.g. 500mg"
                className="shad-input"
              />
            </Field>

            <Field label="Expiry Date *" error={errors.expiryDate}>
              <input
                name="expiryDate"
                type="date"
                value={fields.expiryDate}
                onChange={handleChange}
                className="shad-input"
              />
            </Field>

            <Field label="Price (USD) *" error={errors.price}>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={fields.price}
                onChange={handleChange}
                placeholder="0.00"
                className="shad-input"
              />
            </Field>

            <Field label="Stock (units) *" error={errors.stock}>
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={fields.stock}
                onChange={handleChange}
                placeholder="0"
                className="shad-input"
              />
            </Field>
          </div>

          {/* ── Description (full width) ── */}
          <Field label="Description *" error={errors.description}>
            <textarea
              name="description"
              value={fields.description}
              onChange={handleChange}
              maxLength={1000}
              rows={3}
              placeholder="Brief description of the medicine..."
              className="shad-textArea resize-none"
            />
          </Field>

          {/* ── Prescription toggle ── */}
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                name="requiresPrescription"
                checked={fields.requiresPrescription}
                onChange={handleChange}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full border border-dark-500 bg-dark-500 transition peer-checked:border-green-500 peer-checked:bg-green-600" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-dark-700 transition peer-checked:translate-x-5 peer-checked:bg-white" />
            </div>
            <span className="text-14-medium text-dark-700">
              Requires Prescription
            </span>
          </label>

          {/* ── Footer actions ── */}
          <div className="flex justify-end gap-3 border-t border-dark-500 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="shad-gray-btn rounded-lg px-5 py-2 text-14-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="shad-primary-btn rounded-lg px-5 py-2 text-14-medium disabled:opacity-60"
            >
              {submitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                ? "Create Medicine"
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineFormModal;