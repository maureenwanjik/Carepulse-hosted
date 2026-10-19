import Image from "next/image";
import Link from "next/link";

import StatCard from '@/components/StatCard'
import { columns } from "@/components/table/columns";
import {DataTable} from '@/components/table/DataTabel'
import DashboardContent from '@/components/DashboardContent';
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";

export const dynamic = "force-dynamic";

const AdminPage = async () => {
  const appointments = await getRecentAppointmentList();

  return <DashboardContent appointments={appointments} />;
};

export default AdminPage;
