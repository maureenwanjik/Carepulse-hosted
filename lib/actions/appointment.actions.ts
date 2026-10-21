"use server";

import { revalidatePath } from "next/cache";
import { Appointment } from "@/types/appwrite.types";
import { formatDateTime, parseStringify } from "../utils";
import { getSupabaseAdmin } from "../supabase";
import { cookies } from "next/headers";
import { hasAdminSession, requireAdminSession } from "@/lib/admin-auth";

const fromAppointment = (row: any) => ({
  ...row, $id: row.id, userId: row.user_id,
  patient: row.patients ? { ...row.patients, $id: row.patients.id, userId: row.patients.user_id } : { $id: row.patient_id },
  primaryPhysician: row.primary_physician, schedule: row.schedule,
  cancellationReason: row.cancellation_reason, $createdAt: row.created_at, $updatedAt: row.updated_at,
});

export const createAppointment = async (appointment: CreateAppointmentParams) => {
  try {
    const { data: patient, error: patientError } = await getSupabaseAdmin().from("patients").select("id").eq("id", appointment.patient).eq("user_id", appointment.userId).maybeSingle();
    if (patientError || !patient) return null;
    const { data, error } = await getSupabaseAdmin().from("appointments").insert({
      user_id: appointment.userId, patient_id: patient.id,
      primary_physician: appointment.primaryPhysician, reason: appointment.reason,
      schedule: new Date(appointment.schedule).toISOString(), status: appointment.status || "pending", note: appointment.note || null,
    }).select().single();
    if (error) throw error;
    revalidatePath("/admin");
    return parseStringify(fromAppointment(data));
  } catch (error) { console.error("Appointment booking failed:", error); return null; }
};

export const getRecentAppointmentList = async () => {
  requireAdminSession();
  try {
    const { data, error, count } = await getSupabaseAdmin().from("appointments").select("*, patients(*)", { count: "exact" }).order("created_at", { ascending: false });
    if (error) throw error;
    const documents = (data ?? []).map(fromAppointment);
    return parseStringify({
      totalCount: count ?? documents.length,
      scheduledCount: documents.filter((a) => a.status === "scheduled").length,
      pendingCount: documents.filter((a) => a.status === "pending").length,
      cancelledCount: documents.filter((a) => a.status === "cancelled").length,
      documents,
    });
  } catch (error) {
    console.error("Could not fetch appointments:", error);
    return { totalCount: 0, scheduledCount: 0, pendingCount: 0, cancelledCount: 0, documents: [] };
  }
};

export const getPatientAppointments = async (userId: string) => {
  if (!userId || cookies().get("userId")?.value !== userId) return [];
  try {
    const { data, error } = await getSupabaseAdmin().from("appointments")
      .select("*, patients(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return parseStringify((data ?? []).map(fromAppointment));
  } catch (error) {
    console.error("Could not fetch patient appointments:", error);
    return [];
  }
};

// SMS delivery is not configured in the new stack. Appointment booking and
// status changes succeed without blocking on an unavailable messaging vendor.
export const sendSMSNotification = async (_userId: string, _content: string) => ({ skipped: true, reason: "SMS provider is not configured." });

export const updateAppointment = async ({ appointmentId, appointment, type, userId }: UpdateAppointmentParams) => {
  try {
    const admin = hasAdminSession();
    if (!admin && (!userId || cookies().get("userId")?.value !== userId)) return null;
    const schedule = appointment.schedule ? new Date(appointment.schedule).toISOString() : undefined;
    let updateQuery = getSupabaseAdmin().from("appointments").update({
      status: type === "schedule" ? "scheduled" : "cancelled",
      ...(schedule && { schedule }),
      primary_physician: appointment.primaryPhysician,
      note: appointment.note,
      cancellation_reason: appointment.cancellationReason,
    }).eq("id", appointmentId);
    if (!admin) updateQuery = updateQuery.eq("user_id", userId);
    const { data, error } = await updateQuery.select().single();
    if (error) throw error;
    const when = schedule ? formatDateTime(schedule).dateTime : "the scheduled time";
    const smsMessage = type === "schedule"
      ? `Your appointment is confirmed for ${when} with Dr. ${appointment.primaryPhysician}.`
      : `Your appointment for ${when} was cancelled. ${appointment.cancellationReason ?? ""}`;
    await sendSMSNotification(userId, smsMessage);
    revalidatePath("/admin");
    return parseStringify(fromAppointment(data));
  } catch (error) { console.error("Appointment update failed:", error); return null; }
};

export const getAppointment = async (appointmentId: string) => {
  const { data, error } = await getSupabaseAdmin().from("appointments").select("*, patients(*)").eq("id", appointmentId).maybeSingle();
  if (error) { console.error("Could not retrieve appointment:", error); return null; }
  return data ? parseStringify(fromAppointment(data)) as Appointment : null;
};
