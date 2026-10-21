import Image from 'next/image'

interface BrandLogoProps {
  alt?: string
  className?: string
}

export default function BrandLogo({ alt = 'CarePulse', className = '' }: BrandLogoProps) {
  return (
    <>
      <Image
        src="/assets/icons/logo-full.svg"
        height={1000}
        width={1000}
        alt={alt}
        className={`brand-logo-dark ${className}`}
      />
      <Image
        src="/assets/icons/logo-full-light.svg"
        height={1000}
        width={1000}
        alt={alt}
        className={`brand-logo-light ${className}`}
      />
    </>
  )
}
