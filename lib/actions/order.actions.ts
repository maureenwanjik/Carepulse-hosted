//lib/actions/order.actions.ts

"use server";

import { ID, Query } from "node-appwrite";
import { DATABASE_ID, PATIENT_COLLECTION_ID, databases } from "../appwrite.config";
import { parseStringify } from "../utils";

const ORDERS_COLLECTION_ID = process.env.APPWRITE_ORDERS_COLLECTION_ID!;
const ORDER_ITEMS_COLLECTION_ID = process.env.APPWRITE_ORDER_ITEMS_COLLECTION_ID!;

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateOrderParams = {
  userId: string;
  patientId: string;
  cartItems: {
    medicineId: string;
    medicineName: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus?: string;
  notes?: string;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
export const createOrder = async ({
  userId,
  patientId,
  cartItems,
  totalAmount,
  deliveryAddress,
  paymentMethod,
  paymentStatus = "unpaid",
  notes,
}: CreateOrderParams) => {
  try {
    // ✅ Create order — link to patient via relationship
    const order = await databases.createDocument(
      DATABASE_ID!,
      ORDERS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        patient: patientId,   // ← relationship field (links to patient document)
        status: "pending",
        totalAmount,
        deliveryAddress,
        paymentMethod,
        paymentStatus,
        notes: notes ?? "",
      }
    );

    // ✅ Create order items linked by orderId string
    await Promise.all(
      cartItems.map((item) =>
        databases.createDocument(
          DATABASE_ID!,
          ORDER_ITEMS_COLLECTION_ID,
          ID.unique(),
          {
            orderId: order.$id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          }
        )
      )
    );

    return parseStringify(order);
  } catch (error) {
    console.error("Failed to create order:", JSON.stringify(error, null, 2));
    return null;
  }
};

// ─── GET ALL ORDERS (Admin) ───────────────────────────────────────────────────
// Returns all orders with patient data via relationship
export const getAllOrders = async () => {
  try {
    const orders = await databases.listDocuments(
      DATABASE_ID!,
      ORDERS_COLLECTION_ID,
      [Query.orderDesc("$createdAt")]
    );
    return parseStringify(orders.documents);
  } catch (error) {
    console.error("Failed to fetch all orders:", JSON.stringify(error, null, 2));
    return [];
  }
};

// ─── GET PATIENT ORDERS ───────────────────────────────────────────────────────
// Returns orders for a specific patient
export const getPatientOrders = async (userId: string) => {
  try {
    const orders = await databases.listDocuments(
      DATABASE_ID!,
      ORDERS_COLLECTION_ID,
      [
        Query.equal("userId", [userId]),
        Query.orderDesc("$createdAt"),
      ]
    );
    return parseStringify(orders.documents);
  } catch (error) {
    console.error("Failed to fetch patient orders:", JSON.stringify(error, null, 2));
    return [];
  }
};

// ─── GET ORDER ITEMS ──────────────────────────────────────────────────────────
// Returns all items for a specific order
export const getOrderItems = async (orderId: string) => {
  try {
    const items = await databases.listDocuments(
      DATABASE_ID!,
      ORDER_ITEMS_COLLECTION_ID,
      [Query.equal("orderId", [orderId])]
    );
    return parseStringify(items.documents);
  } catch (error) {
    console.error("Failed to fetch order items:", JSON.stringify(error, null, 2));
    return [];
  }
};

// ─── UPDATE ORDER STATUS (Admin) ──────────────────────────────────────────────
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  paymentStatus?: "unpaid" | "paid"
) => {
  try {
    const updates: Record<string, string> = { status };
    if (paymentStatus) updates.paymentStatus = paymentStatus;

    const updated = await databases.updateDocument(
      DATABASE_ID!,
      ORDERS_COLLECTION_ID,
      orderId,
      updates
    );
    return parseStringify(updated);
  } catch (error) {
    console.error("Failed to update order status:", JSON.stringify(error, null, 2));
    return null;
  }
};

// ─── CANCEL ORDER ─────────────────────────────────────────────────────────────
export const cancelOrder = async (orderId: string) => {
  try {
    const updated = await databases.updateDocument(
      DATABASE_ID!,
      ORDERS_COLLECTION_ID,
      orderId,
      { status: "cancelled" }
    );
    return parseStringify(updated);
  } catch (error) {
    console.error("Failed to cancel order:", JSON.stringify(error, null, 2));
    return null;
  }
};