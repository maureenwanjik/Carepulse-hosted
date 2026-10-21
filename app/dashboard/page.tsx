// app/dashboard/page.tsx
import { cookies } from "next/headers";
import BrandLogo from "@/components/BrandLogo";
import { redirect } from "next/navigation";
import { getUser, getPatient } from "@/lib/actions/patient.actions";
import { getPatientAppointments } from "@/lib/actions/appointment.actions";
import { getPatientOrders } from "@/lib/actions/order.actions";
import PatientDashboard from "@/components/dashboard/PatientDashboard";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";

const DashboardPage = async () => {
  const userId = cookies().get("userId")?.value;
  if (!userId) redirect("/");

  //user and patient can run in parallel
  const [user, patient] = await Promise.all([
    getUser(userId),
    getPatient(userId),
  ]);

  if (!user) redirect("/");
  if (!patient) redirect(`/patients/${userId}/register`);

  // appointments and orders can run in parallel
  const [appointments, orders] = await Promise.all([
    getPatientAppointments(userId),
    getPatientOrders(userId),
  ]);

  const upcoming = appointments.filter((apt: any) => apt.status === "scheduled");
  const past = appointments.filter(
    (apt: any) =>
      apt.status === "cancelled" || new Date(apt.schedule) < new Date()
  );

  return (
    <div className="flex h-screen max-h-screen">
      <section className="remove-scrollbar container overflow-y-auto">
        <div className="sub-container max-w-[860px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <BrandLogo alt="carepulse" className="h-10 w-fit" />
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link
                href="/product"
                className="text-14-medium text-dark-700 hover:text-white transition-colors"
              >
                💊 Pharmacy
              </Link>
              <LogoutButton />
              <Link
                href={`/patients/${userId}/new-appointment`}
                className="shad-primary-btn rounded-md px-4 py-2 text-14-medium"
              >
                + New Appointment
              </Link>
            </div>
          </div>

          {/* Welcome */}
          <section className="mb-10 space-y-2">
            <h1 className="header">
              Welcome back, {patient?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-dark-700">
              Here&apos;s an overview of your health activity.
            </p>
          </section>

          <PatientDashboard
            user={user}
            patient={patient}
            upcoming={upcoming}
            past={past}
            userId={userId}
            orders={orders}
          />

          <p className="copyright mt-12">© 2026 CarePulse</p>
        </div>
      </section>

      <Image
        src="/assets/images/register-img.png"
        height={1000}
        width={1000}
        alt="dashboard"
        className="side-img max-w-[390px]"
      />
    </div>
  );
};

export default DashboardPage;
