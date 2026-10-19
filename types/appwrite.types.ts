//types/appwrite.types

import { Models } from "node-appwrite";

export interface Patient extends Models.Document {
  userId: string;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies: string | undefined;
  currentMedication: string | undefined;
  familyMedicalHistory: string | undefined;
  pastMedicalHistory: string | undefined;
  identificationType: string | undefined;
  identificationNumber: string | undefined;
  identificationDocument: FormData | undefined;
  privacyConsent: boolean;
}

export interface Appointment extends Models.Document {
  patient: Patient;
  schedule: Date;
  status: Status;
  primaryPhysician: string;
  reason: string;
  note: string;
  userId: string;
  cancellationReason: string | null;
}

export interface Medicine extends Models.Document {
  medicineId: string;
  medicineName: string;
  medicineImageId: string;
  medicineImageUrl: string;
  description: string;
  price: number;           // use number not string for calculations
  category: string;        // e.g. "Antibiotics", "Pain Relief", "Vitamins"
  stock: number;           // how many units available
  unit: string;            // e.g. "tablet", "bottle", "capsule"
  dosage: string;          // e.g. "500mg", "10ml"
  requiresPrescription: boolean;
  manufacturer: string;
  expiryDate: string;
}

export interface Order extends Models.Document {
  userId: string;
  patientId: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: "unpaid" | "paid";
  notes?: string;
}

export interface OrderItem extends Models.Document {
  orderId: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
