"use server";

import { cookies } from "next/headers";
import { getSupabaseAdmin, getSupabasePublic, PRIVATE_DOCUMENT_BUCKET } from "../supabase";

const setSessionCookies = (userId: string, accessToken?: string, refreshToken?: string) => {
  const secure = process.env.NODE_ENV === "production";
  cookies().set("userId", userId, { httpOnly: true, path: "/", secure, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  if (accessToken) cookies().set("sb-access-token", accessToken, { httpOnly: true, path: "/", secure, sameSite: "lax", maxAge: 60 * 60 });
  if (refreshToken) cookies().set("sb-refresh-token", refreshToken, { httpOnly: true, path: "/", secure, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
};

const toUser = (user: any) => ({
  $id: user.id,
  name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Patient",
  email: user.email ?? "",
  phone: user.phone || user.user_metadata?.phone || "",
});

export const createUser = async (user: CreateUserParams & { password: string }) => {
  try {
    const { data, error } = await getSupabasePublic().auth.signUp({
      email: user.email,
      password: user.password,
      options: { data: { name: user.name, phone: user.phone } },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Account could not be created. Please try again." };
    if (data.session) setSessionCookies(data.user.id, data.session.access_token, data.session.refresh_token);
    else cookies().set("userId", data.user.id, { httpOnly: true, path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
    return toUser(data.user);
  } catch (error) {
    console.error("Account creation failed:", error);
    return { error: error instanceof Error ? error.message : "Account creation failed." };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const { data, error } = await getSupabasePublic().auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) return { error: error?.message ?? "Login failed." };
    setSessionCookies(data.user.id, data.session.access_token, data.session.refresh_token);
    return toUser(data.user);
  } catch (error) {
    console.error("Login failed:", error);
    return { error: "Could not connect to the account service. Please try again." };
  }
};

export const logoutUser = async () => {
  cookies().delete("userId");
  cookies().delete("sb-access-token");
  cookies().delete("sb-refresh-token");
};

export const sendPasswordResetOTP = async (email: string) => {
  try {
    const { error } = await getSupabasePublic().auth.resetPasswordForEmail(email);
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    console.error("Password reset request failed:", error);
    return { error: "Could not send a password reset code. Please try again." };
  }
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  try {
    const client = getSupabasePublic();
    const { data, error } = await client.auth.verifyOtp({ email, token: otp, type: "recovery" });
    if (error || !data.user) return { error: error?.message ?? "Invalid or expired reset code." };
    const { error: updateError } = await client.auth.updateUser({ password: newPassword });
    if (updateError) return { error: updateError.message };
    cookies().delete("reset_otp");
    return { success: true };
  } catch (error) {
    console.error("Password reset failed:", error);
    return { error: "Password reset failed. Please try again." };
  }
};

export const getUser = async (userId: string) => {
  try {
    const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(userId);
    if (error || !data.user) return null;
    return toUser(data.user);
  } catch (error) {
    console.error("Could not retrieve account:", error);
    return null;
  }
};

export const registerPatient = async ({ identificationDocument, ...patient }: RegisterUserParams) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error: lookupError } = await supabase.from("patients").select("*").eq("user_id", patient.userId).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return { ...existing, $id: existing.id, userId: existing.user_id };

    let documentPath: string | null = null;
    if (identificationDocument) {
      const file = identificationDocument.get("blobFile") as Blob | null;
      const name = identificationDocument.get("fileName") as string | null;
      if (file && name) {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
        documentPath = `${patient.userId}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from(PRIVATE_DOCUMENT_BUCKET).upload(documentPath, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (error) throw error;
      }
    }

    const { data: profile, error: profileError } = await supabase.from("profiles").upsert({
      id: patient.userId, name: patient.name, phone: patient.phone,
    }).select().single();
    if (profileError) throw profileError;

    const { data, error } = await supabase.from("patients").insert({
      user_id: patient.userId,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      birth_date: patient.birthDate ? new Date(patient.birthDate).toISOString().slice(0, 10) : null,
      gender: patient.gender,
      address: patient.address,
      occupation: patient.occupation,
      emergency_contact_name: patient.emergencyContactName,
      emergency_contact_number: patient.emergencyContactNumber,
      primary_physician: patient.primaryPhysician,
      insurance_provider: patient.insuranceProvider,
      insurance_policy_number: patient.insurancePolicyNumber,
      allergies: patient.allergies || null,
      current_medication: patient.currentMedication || null,
      family_medical_history: patient.familyMedicalHistory || null,
      past_medical_history: patient.pastMedicalHistory || null,
      identification_type: patient.identificationType || null,
      identification_number: patient.identificationNumber || null,
      identification_document_path: documentPath,
      privacy_consent: patient.privacyConsent,
    }).select().single();
    if (error) throw error;
    return { ...data, $id: data.id, userId: data.user_id, identificationDocumentUrl: null };
  } catch (error) {
    console.error("Patient registration failed:", error);
    return null;
  }
};

export const getPatient = async (userId: string) => {
  try {
    const { data, error } = await getSupabaseAdmin().from("patients").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data ? {
      ...data,
      $id: data.id,
      userId: data.user_id,
      birthDate: data.birth_date,
      emergencyContactName: data.emergency_contact_name,
      emergencyContactNumber: data.emergency_contact_number,
      primaryPhysician: data.primary_physician,
      insuranceProvider: data.insurance_provider,
      insurancePolicyNumber: data.insurance_policy_number,
      currentMedication: data.current_medication,
      familyMedicalHistory: data.family_medical_history,
      pastMedicalHistory: data.past_medical_history,
      identificationType: data.identification_type,
      identificationNumber: data.identification_number,
      identificationDocumentPath: data.identification_document_path,
    } : null;
  } catch (error) {
    console.error("Could not retrieve patient:", error);
    return null;
  }
};
