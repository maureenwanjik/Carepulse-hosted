"use server";

import { getSupabaseAdmin } from "../supabase";
import { parseStringify } from "../utils";

export type CreateOrderParams = {
  userId: string; patientId: string;
  cartItems: { medicineId: string; medicineName: string; quantity: number; unitPrice: number }[];
  totalAmount: number; deliveryAddress: string; paymentMethod: string; paymentStatus?: string; notes?: string;
};
export type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";

const fromOrder = (row: any) => ({
  ...row, $id: row.id, userId: row.user_id, patientId: row.patient_id,
  totalAmount: Number(row.total_amount), deliveryAddress: row.delivery_address,
  paymentMethod: row.payment_method, paymentStatus: row.payment_status,
  $createdAt: row.created_at, $updatedAt: row.updated_at,
});

export const createOrder = async (params: CreateOrderParams) => {
  const supabase = getSupabaseAdmin();
  const { userId, patientId, cartItems, totalAmount, deliveryAddress, paymentMethod, paymentStatus = "unpaid", notes = "" } = params;
  if (!cartItems.length || cartItems.some((item) => item.quantity < 1 || item.unitPrice < 0)) return null;
  try {
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: userId, patient_id: patientId, status: "pending", total_amount: totalAmount,
      delivery_address: deliveryAddress, payment_method: paymentMethod,
      payment_status: paymentStatus === "paid" ? "paid" : "unpaid", notes,
    }).select().single();
    if (error) throw error;
    const { error: itemsError } = await supabase.from("order_items").insert(cartItems.map((item) => ({
      order_id: order.id, medicine_id: item.medicineId || null, medicine_name: item.medicineName,
      quantity: item.quantity, unit_price: item.unitPrice, subtotal: item.quantity * item.unitPrice,
    })));
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }
    return parseStringify(fromOrder(order));
  } catch (error) { console.error("Failed to create order:", error); return null; }
};

export const getAllOrders = async () => {
  try {
    const { data, error } = await getSupabaseAdmin().from("orders").select("*, order_items(*), patients(name,email,phone)").order("created_at", { ascending: false });
    if (error) throw error;
    return parseStringify((data ?? []).map(fromOrder));
  } catch (error) { console.error("Failed to fetch orders:", error); return []; }
};

export const getPatientOrders = async (userId: string) => {
  try {
    const { data, error } = await getSupabaseAdmin().from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return parseStringify((data ?? []).map(fromOrder));
  } catch (error) { console.error("Failed to fetch patient orders:", error); return []; }
};

export const getOrderItems = async (orderId: string) => {
  const { data, error } = await getSupabaseAdmin().from("order_items").select("*").eq("order_id", orderId).order("created_at");
  if (error) { console.error("Failed to fetch order items:", error); return []; }
  return parseStringify((data ?? []).map((item) => ({ ...item, $id: item.id, orderId: item.order_id, medicineId: item.medicine_id, medicineName: item.medicine_name, unitPrice: Number(item.unit_price) })));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, paymentStatus?: "unpaid" | "paid") => {
  const updates: Record<string, string> = { status };
  if (paymentStatus) updates.payment_status = paymentStatus;
  const { data, error } = await getSupabaseAdmin().from("orders").update(updates).eq("id", orderId).select().single();
  if (error) { console.error("Failed to update order status:", error); return null; }
  return parseStringify(fromOrder(data));
};

export const cancelOrder = async (orderId: string) => updateOrderStatus(orderId, "cancelled");
