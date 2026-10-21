import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasAdminSession()) redirect("/?admin=true");
  return children;
}
