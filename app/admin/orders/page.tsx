//app/admin/orders/page.tsx

import Image from "next/image";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { getAllOrders } from "@/lib/actions/order.actions";
import AdminOrdersClient from "@/components/orders/AdminOrdersClient";

const AdminOrdersPage = async () => {
  const orders = await getAllOrders();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      {/* Header */}
      <header className="admin-header">
        <Link href="/">
          <BrandLogo alt="logo" className="h-8 w-fit" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-14-medium text-dark-700 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
          <p className="text-16-semibold">Order Management</p>
        </div>
      </header>

      <main className="admin-main">
        {/* Title */}
        <section className="w-full space-y-2">
          <h1 className="header">Orders 📦</h1>
          <p className="text-dark-700">
            Track and manage all patient medicine orders.
          </p>
        </section>

        {/* Stats */}
        <section className="admin-stat">
          {[
            {
              label: "Total Orders",
              count: orders.length,
              color: "bg-appointments",
              icon: "📦",
            },
            {
              label: "Pending",
              count: orders.filter((o: any) => o.status === "pending").length,
              color: "bg-pending",
              icon: "⏳",
            },
            {
              label: "Delivered",
              count: orders.filter((o: any) => o.status === "delivered").length,
              color: "bg-cancelled",
              icon: "✅",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`stat-card ${stat.color} flex items-center gap-4`}
            >
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className="text-32-bold text-white">{stat.count}</p>
                <p className="text-14-regular text-dark-700">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Orders Table */}
        <AdminOrdersClient initialOrders={orders} />
      </main>
    </div>
  );
};

export default AdminOrdersPage;