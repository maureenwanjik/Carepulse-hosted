import {PatientForm} from "@/components/forms/PatientForm";
import BrandLogo from "@/components/BrandLogo";
import PasskeyModal from "@/components/PasskeyModal";
import Image from "next/image";
import Link from "next/link";

export default function Home({searchParams}: SearchParamProps) {
  const isAdmin = searchParams.admin === 'true'

  return (
    <div className="flex min-h-dvh w-full flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
      {isAdmin && <PasskeyModal />}

      <section className="order-2 my-auto min-h-0 w-full flex-1 overflow-y-auto px-[5%] lg:order-1 lg:w-1/2">
        <div className="sub-container max-w-[496px]  max-h-[600px]">
          <BrandLogo alt="patient" className="mb-12 h-10 w-fit" />

          <PatientForm />

          <div className="text-14-regular mt-20 flex justify-between">
            <p className="justify-items-end text-dark-600 xl:text-left">
                © 2026 carepulse
            </p>
            <Link href="/?admin=true" className="text-green-500">
              Admin
            </Link>
            <Link href="/product" className="text-green-500">
              Product
            </Link>
            <Link href="/news" className="text-green-500">
             News
            </Link>
          </div>
        </div>
      </section>

      <Image
        src="/assets/images/onboarding-img.png"
        height={1000}
        width={1000}
        alt="patient"
        className="order-1 block h-[26vh] min-h-[160px] max-h-[280px] w-full object-cover object-center sm:h-[32vh] lg:order-2 lg:h-dvh lg:min-h-0 lg:max-h-none lg:w-1/2 lg:max-w-none"
      />
    </div>
  );
}
