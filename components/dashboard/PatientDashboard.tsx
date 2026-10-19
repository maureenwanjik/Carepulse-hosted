"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Doctors } from "@/constants";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { Appointment } from "@/types/appwrite.types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  $id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  $createdAt: string;
  notes?: string;
}

interface Props {
  user: User;
  patient: any;
  upcoming: Appointment[];
  past: Appointment[];
  userId: string;
  orders: Order[];
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "appointments", label: "Appointments", icon: "📅" },
  { id: "orders", label: "My Orders", icon: "📦" },
  { id: "profile", label: "My Profile", icon: "👤" },
  { id: "documents", label: "Documents", icon: "📄" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
];

// ─── Status styles ────────────────────────────────────────────────────────────
const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600",
  confirmed: "bg-blue-600/20 text-blue-400 border-blue-600",
  out_for_delivery: "bg-purple-600/20 text-purple-400 border-purple-600",
  delivered: "bg-green-600/20 text-green-500 border-green-600",
  cancelled: "bg-red-600/20 text-red-400 border-red-600",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "⏳ Pending",
  confirmed: "✅ Confirmed",
  out_for_delivery: "🚚 Out for Delivery",
  delivered: "📦 Delivered",
  cancelled: "❌ Cancelled",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}) => (
  <div className={`stat-card ${color}`}>
    <div className="flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-32-bold text-white">{value}</p>
        <p className="text-14-regular text-dark-700">{label}</p>
      </div>
    </div>
  </div>
);

// ─── Appointment Card ─────────────────────────────────────────────────────────
const AppointmentCard = ({
  appointment,
  showRating,
  onRate,
}: {
  appointment: any;
  showRating?: boolean;
  onRate?: (id: string, rating: number) => void;
}) => {
  const [hovered, setHovered] = useState(0);
  const [rated, setRated] = useState(0);
  const doctor = Doctors.find((d) => d.name === appointment.primaryPhysician);

  return (
    <div className="rounded-xl border border-dark-500 bg-dark-400 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Image
          src={doctor?.image ?? "/assets/icons/user.svg"}
          width={40}
          height={40}
          alt={appointment.primaryPhysician}
          className="rounded-full border border-dark-500 size-10 object-cover"
        />
        <div className="flex-1">
          <p className="text-16-semibold text-white">Dr. {appointment.primaryPhysician}</p>
          <p className="text-12-regular text-dark-700">
            {formatDateTime(appointment.schedule).dateTime}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      {appointment.reason && (
        <div className="rounded-md bg-dark-300 p-3">
          <p className="text-12-regular text-dark-700 mb-1">Reason</p>
          <p className="text-14-medium text-light-200">{appointment.reason}</p>
        </div>
      )}
      {appointment.note && (
        <div className="rounded-md bg-dark-300 p-3 border-l-2 border-green-500">
          <p className="text-12-regular text-green-500 mb-1">Doctor&apos;s Note</p>
          <p className="text-14-regular text-light-200">{appointment.note}</p>
        </div>
      )}
      {appointment.cancellationReason && (
        <div className="rounded-md bg-dark-300 p-3 border-l-2 border-red-500">
          <p className="text-12-regular text-red-500 mb-1">Cancellation Reason</p>
          <p className="text-14-regular text-light-200">{appointment.cancellationReason}</p>
        </div>
      )}
      {showRating && appointment.status !== "cancelled" && onRate && (
        <div className="pt-2 border-t border-dark-500">
          <p className="text-12-regular text-dark-700 mb-2">Rate this doctor</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => { setRated(star); onRate(appointment.$id, star); }}
                className="text-2xl transition-transform hover:scale-110"
              >
                {star <= (hovered || rated) ? "⭐" : "☆"}
              </button>
            ))}
            {rated > 0 && (
              <span className="text-12-regular text-green-500 ml-2 self-center">
                Thanks for rating!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({ order }: { order: Order }) => (
  <div className="rounded-xl border border-dark-500 bg-dark-400 p-5 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-14-medium text-white font-mono">
          #{order.$id.slice(-8).toUpperCase()}
        </p>
        <p className="text-12-regular text-dark-600 mt-0.5">
          {new Date(order.$createdAt).toLocaleDateString('en-KE', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </p>
      </div>
      <span className={`rounded-full border px-3 py-1 text-12-semibold ${
        ORDER_STATUS_STYLES[order.status] ?? "bg-dark-400 text-dark-700 border-dark-500"
      }`}>
        {ORDER_STATUS_LABELS[order.status] ?? order.status}
      </span>
    </div>

    <div className="rounded-md bg-dark-300 p-3 space-y-1">
      <p className="text-12-regular text-dark-700">Delivery Address</p>
      <p className="text-14-medium text-white">{order.deliveryAddress}</p>
    </div>

    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-12-regular text-dark-600 capitalize">{order.paymentMethod}</p>
        <span className={`text-12-semibold ${
          order.paymentStatus === 'paid' ? 'text-green-500' : 'text-yellow-400'
        }`}>
          {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
        </span>
      </div>
      <p className="text-18-bold text-green-500">
        KSh {order.totalAmount.toLocaleString()}
      </p>
    </div>

    {order.notes && (
      <p className="text-12-regular text-dark-600 border-t border-dark-500 pt-3">
        Note: {order.notes}
      </p>
    )}
  </div>
);

// ─── Orders Section ───────────────────────────────────────────────────────────
const OrdersSection = ({ orders, userId }: { orders: Order[]; userId: string }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <span className="text-5xl">📦</span>
        <p className="text-dark-700 text-16-regular">No orders yet.</p>
        <Link
          href="/product"
          className="shad-primary-btn rounded-md px-6 py-2 text-14-medium"
        >
          Browse Pharmacy
        </Link>
      </div>
    );
  }

  const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const completed = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="sub-header">Active Orders ({active.length})</h2>
          {active.map((order) => <OrderCard key={order.$id} order={order} />)}
        </div>
      )}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="sub-header">Past Orders ({completed.length})</h2>
          {completed.map((order) => <OrderCard key={order.$id} order={order} />)}
        </div>
      )}
    </div>
  );
};

// ─── Profile Section ──────────────────────────────────────────────────────────
const ProfileSection = ({ patient }: { patient: any }) => {
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <p className="text-dark-700 text-16-regular">
          No profile found. Please complete registration.
        </p>
      </div>
    );
  }

  const fields = [
    { label: "Full Name", value: patient.name },
    { label: "Email", value: patient.email },
    { label: "Phone", value: patient.phone },
    { label: "Date of Birth", value: patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : "—" },
    { label: "Gender", value: patient.gender },
    { label: "Address", value: patient.address },
    { label: "Occupation", value: patient.occupation },
    { label: "Emergency Contact", value: patient.emergencyContactName },
    { label: "Emergency Phone", value: patient.emergencyContactNumber },
    { label: "Primary Physician", value: patient.primaryPhysician },
    { label: "Insurance Provider", value: patient.insuranceProvider },
    { label: "Policy Number", value: patient.insurancePolicyNumber },
    { label: "Allergies", value: patient.allergies },
    { label: "Current Medications", value: patient.currentMedication },
    { label: "Family Medical History", value: patient.familyMedicalHistory },
    { label: "Past Medical History", value: patient.pastMedicalHistory },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-5 rounded-xl border border-dark-500 bg-dark-400">
        <div className="size-16 rounded-full bg-green-600 flex items-center justify-center text-2xl font-bold text-green-500">
          {patient.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-18-bold text-white">{patient.name}</p>
          <p className="text-14-regular text-dark-700">{patient.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map(({ label, value }) =>
          value ? (
            <div key={label} className="rounded-lg border border-dark-500 bg-dark-400 p-4">
              <p className="text-12-regular text-dark-700 mb-1">{label}</p>
              <p className="text-14-medium text-light-200">{value}</p>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

// ─── Documents Section ────────────────────────────────────────────────────────
const DocumentsSection = ({ patient }: { patient: any }) => (
  <div className="space-y-4">
    <p className="text-dark-700 text-14-regular">
      Identification and medical documents on file.
    </p>
    {patient?.identificationNumber ? (
      <div className="rounded-xl border border-dark-500 bg-dark-400 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪪</span>
          <div>
            <p className="text-14-medium text-white">
              {patient.identificationType ?? "ID Document"}
            </p>
            <p className="text-12-regular text-dark-700">
              #{patient.identificationNumber}
            </p>
          </div>
          <span className="ml-auto status-badge bg-green-600 text-green-500 text-12-semibold">
            On File
          </span>
        </div>
      </div>
    ) : (
      <div className="file-upload">
        <p className="text-dark-600 text-14-regular">No documents uploaded yet.</p>
      </div>
    )}
  </div>
);

// ─── Notifications Section ────────────────────────────────────────────────────
const NotificationsSection = ({ upcoming, orders }: { upcoming: any[]; orders: Order[] }) => {
  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));

  const notifications = [
    ...activeOrders.map((order) => ({
      id: order.$id,
      icon: "📦",
      title: "Order Update",
      message: `Order #${order.$id.slice(-8).toUpperCase()} is ${ORDER_STATUS_LABELS[order.status] ?? order.status}`,
      time: new Date(order.$createdAt).toLocaleDateString(),
      color: "border-green-500",
    })),
    ...upcoming.map((apt) => ({
      id: apt.$id,
      icon: "📅",
      title: "Upcoming Appointment",
      message: `With Dr. ${apt.primaryPhysician} on ${formatDateTime(apt.schedule).dateTime}`,
      time: "Scheduled",
      color: "border-blue-500",
    })),
    {
      id: "tip-1",
      icon: "💊",
      title: "Health Reminder",
      message: "Remember to take your medications on schedule.",
      time: "General",
      color: "border-green-500",
    },
    {
      id: "tip-2",
      icon: "🏃",
      title: "Wellness Tip",
      message: "Stay active — even a 20-minute walk daily improves health outcomes.",
      time: "General",
      color: "border-dark-500",
    },
  ];

  return (
    <div className="space-y-4">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`rounded-xl border-l-4 ${n.color} border border-dark-500 bg-dark-400 p-4 flex gap-4`}
        >
          <span className="text-2xl">{n.icon}</span>
          <div className="flex-1">
            <p className="text-14-medium text-white">{n.title}</p>
            <p className="text-12-regular text-dark-700 mt-1">{n.message}</p>
          </div>
          <span className="text-12-regular text-dark-600 self-start whitespace-nowrap">
            {n.time}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PatientDashboard = ({ user, patient, upcoming, past, userId, orders }: Props) => {
  const [activeTab, setActiveTab] = useState("overview");

  const handleRate = (appointmentId: string, rating: number) => {
    console.log("Rated appointment", appointmentId, "with", rating, "stars");
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 remove-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-14-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-green-500 text-white"
                : "bg-dark-400 text-dark-700 border border-dark-500 hover:text-white"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="admin-stat">
            <StatCard label="Upcoming Appointments" value={upcoming.length} icon="📅" color="bg-appointments" />
            <StatCard label="Past Appointments" value={past.length} icon="✅" color="bg-pending" />
            <StatCard label="Total Orders" value={orders.length} icon="📦" color="bg-cancelled" />
          </div>

          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="sub-header">Next Appointment</h2>
              <AppointmentCard appointment={upcoming[0]} />
            </div>
          )}

          {orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length > 0 && (
            <div className="space-y-3">
              <h2 className="sub-header">Active Order</h2>
              <OrderCard order={orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))[0]} />
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="sub-header">Recent Visit</h2>
              <AppointmentCard appointment={past[0]} showRating onRate={handleRate} />
            </div>
          )}

          {upcoming.length === 0 && past.length === 0 && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <p className="text-dark-700 text-16-regular">Nothing here yet.</p>
              <Link
                href={`/patients/${userId}/new-appointment`}
                className="shad-primary-btn rounded-md px-6 py-2 text-14-medium"
              >
                Book Your First Appointment
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Appointments Tab ── */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="sub-header">Upcoming ({upcoming.length})</h2>
              {upcoming.map((apt: any) => (
                <AppointmentCard key={apt.$id} appointment={apt} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="sub-header">History ({past.length})</h2>
              {past.map((apt: any) => (
                <AppointmentCard key={apt.$id} appointment={apt} showRating onRate={handleRate} />
              ))}
            </div>
          )}
          {upcoming.length === 0 && past.length === 0 && (
            <p className="text-dark-700 text-14-regular py-10 text-center">No appointments found.</p>
          )}
        </div>
      )}

      {/* ── Orders Tab ── */}
      {activeTab === "orders" && <OrdersSection orders={orders} userId={userId} />}

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && <ProfileSection patient={patient} />}

      {/* ── Documents Tab ── */}
      {activeTab === "documents" && <DocumentsSection patient={patient} />}

      {/* ── Notifications Tab ── */}
      {activeTab === "notifications" && (
        <NotificationsSection upcoming={upcoming} orders={orders} />
      )}
    </div>
  );
};

export default PatientDashboard;