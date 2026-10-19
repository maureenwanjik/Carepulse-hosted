//components/orders/AdminOrdersClient.tsx 

"use client";

import { useState, useTransition } from "react";
import {
  updateOrderStatus,
  getOrderItems,
  OrderStatus,
} from "@/lib/actions/order.actions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  $id: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  $id: string;
  userId: string;
  patient: {
    name: string;
    phone: string;
    email: string;
  };
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  $createdAt: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600",
  confirmed: "bg-blue-600/20 text-blue-400 border-blue-600",
  out_for_delivery: "bg-purple-600/20 text-purple-400 border-purple-600",
  delivered: "bg-green-600/20 text-green-500 border-green-600",
  cancelled: "bg-red-600/20 text-red-400 border-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "⏳ Pending",
  confirmed: "✅ Confirmed",
  out_for_delivery: "🚚 Out for Delivery",
  delivered: "📦 Delivered",
  cancelled: "❌ Cancelled",
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`rounded-full border px-3 py-1 text-12-semibold ${
      STATUS_STYLES[status] ?? "bg-dark-400 text-dark-700 border-dark-500"
    }`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

// ─── Order Items Modal ────────────────────────────────────────────────────────
const OrderItemsModal = ({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    getOrderItems(order.$id).then((data) => {
      setItems(data);
      setLoading(false);
    });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="shad-dialog w-full max-w-lg rounded-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-500 px-6 py-4">
          <div>
            <h2 className="sub-header">Order Details</h2>
            <p className="text-12-regular text-dark-700 mt-0.5">
              #{order.$id.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-700 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="remove-scrollbar overflow-y-auto px-6 py-5 space-y-5">
          {/* Patient info */}
          <div className="rounded-xl border border-dark-500 bg-dark-300 p-4 space-y-2">
            <p className="text-12-regular text-dark-700 mb-2">Patient</p>
            <p className="text-14-medium text-white">{order.patient?.name}</p>
            <p className="text-12-regular text-dark-600">{order.patient?.phone}</p>
            <p className="text-12-regular text-dark-600">{order.patient?.email}</p>
          </div>

          {/* Delivery info */}
          <div className="rounded-xl border border-dark-500 bg-dark-300 p-4 space-y-2">
            <p className="text-12-regular text-dark-700 mb-2">Delivery</p>
            <p className="text-14-medium text-white">{order.deliveryAddress}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-12-regular text-dark-600">
                Payment: <span className="text-white capitalize">{order.paymentMethod}</span>
              </span>
              <span className={`text-12-regular ${
                order.paymentStatus === "paid" ? "text-green-500" : "text-yellow-400"
              }`}>
                {order.paymentStatus === "paid" ? "✓ Paid" : "⏳ Unpaid"}
              </span>
            </div>
            {order.notes && (
              <p className="text-12-regular text-dark-600 mt-2">
                Note: {order.notes}
              </p>
            )}
          </div>

          {/* Order items */}
          <div className="space-y-2">
            <p className="text-12-regular text-dark-700">Items Ordered</p>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-dark-300 animate-pulse" />
                ))}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.$id}
                  className="rounded-lg border border-dark-500 bg-dark-300 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-14-medium text-white">{item.medicineName}</p>
                    <p className="text-12-regular text-dark-600">
                      {item.quantity} × KSh {item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-14-medium text-green-500">
                    KSh {item.subtotal.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-dark-500 pt-4">
            <span className="text-16-semibold text-white">Total</span>
            <span className="text-18-bold text-green-500">
              KSh {order.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminOrdersClient = ({ initialOrders }: { initialOrders: Order[] }) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleStatusUpdate = (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: "unpaid" | "paid"
  ) => {
    startTransition(async () => {
      const updated = await updateOrderStatus(orderId, status, paymentStatus);
      if (updated) {
        setOrders((prev) =>
          prev.map((o) =>
            o.$id === orderId
              ? {
                  ...o,
                  status,
                  paymentStatus: paymentStatus ?? o.paymentStatus,
                }
              : o
          )
        );
      }
    });
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      search.trim() === "" ||
      o.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress?.toLowerCase().includes(search.toLowerCase()) ||
      o.$id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Order detail modal */}
      {selectedOrder && (
        <OrderItemsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full">
        {/* Search */}
        <div className="flex flex-1 rounded-md border border-dark-500 bg-dark-400 items-center px-3 gap-2">
          <span className="text-dark-600">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, address or order ID..."
            className="flex-1 bg-transparent py-2.5 text-14-regular text-white placeholder:text-dark-600 outline-none"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-dark-500 bg-dark-400 px-3 py-2.5 text-14-regular text-white outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-14-regular text-dark-700">
        {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      <div className="data-table w-full">
        <table className="shad-table w-full">
          <thead>
            <tr className="shad-table-row-header">
              <th className="px-4 py-3 text-left text-14-medium">Order ID</th>
              <th className="px-4 py-3 text-left text-14-medium">Patient</th>
              <th className="px-4 py-3 text-left text-14-medium">Address</th>
              <th className="px-4 py-3 text-left text-14-medium">Amount</th>
              <th className="px-4 py-3 text-left text-14-medium">Payment</th>
              <th className="px-4 py-3 text-left text-14-medium">Status</th>
              <th className="px-4 py-3 text-left text-14-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-14-regular text-dark-700"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.$id} className="shad-table-row">
                  {/* Order ID */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-12-semibold text-green-500 hover:underline font-mono"
                    >
                      #{order.$id.slice(-8).toUpperCase()}
                    </button>
                    <p className="text-12-regular text-dark-600 mt-0.5">
                      {new Date(order.$createdAt).toLocaleDateString()}
                    </p>
                  </td>

                  {/* Patient */}
                  <td className="px-4 py-3">
                    <p className="text-14-medium text-white">
                      {order.patient?.name ?? "—"}
                    </p>
                    <p className="text-12-regular text-dark-600">
                      {order.patient?.phone ?? ""}
                    </p>
                  </td>

                  {/* Address */}
                  <td className="px-4 py-3 text-14-regular text-dark-700 max-w-[180px] truncate">
                    {order.deliveryAddress}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-14-medium text-green-500">
                    KSh {order.totalAmount.toLocaleString()}
                  </td>

                  {/* Payment status */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          order.$id,
                          order.status,
                          order.paymentStatus === "paid" ? "unpaid" : "paid"
                        )
                      }
                      disabled={isPending}
                      className={`text-12-semibold rounded-full border px-3 py-1 transition-colors ${
                        order.paymentStatus === "paid"
                          ? "border-green-600 bg-green-600/20 text-green-500 hover:bg-green-600/30"
                          : "border-yellow-600 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30"
                      }`}
                    >
                      {order.paymentStatus === "paid" ? "✓ Paid" : "⏳ Unpaid"}
                    </button>
                  </td>

                  {/* Order status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={order.status}
                        disabled={
                          isPending || order.status === "delivered" || order.status === "cancelled"
                        }
                        onChange={(e) =>
                          handleStatusUpdate(order.$id, e.target.value as OrderStatus)
                        }
                        className="rounded-md border border-dark-500 bg-dark-300 px-2 py-1 text-12-regular text-white outline-none disabled:opacity-50"
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="out_for_delivery">🚚 Out for Delivery</option>
                        <option value="delivered">📦 Delivered</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-md border border-dark-500 bg-dark-400 px-2 py-1 text-12-semibold text-light-200 hover:border-green-500 hover:text-green-500 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminOrdersClient;