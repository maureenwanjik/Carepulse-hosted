"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src?: string | null;
  name: string;
  medicineId?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
};

export default function MedicineProductImage({
  src,
  name,
  medicineId = name,
  fill = false,
  width = 160,
  height = 160,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const fallback = medicineId
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2
    ? "/assets/images/medicine-tablets.svg"
    : "/assets/images/medicine-liquid.svg";

  return (
    <Image
      src={src && !failed ? src : fallback}
      alt={name}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={fill ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : undefined}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
