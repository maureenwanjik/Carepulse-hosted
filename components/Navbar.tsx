'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Pill } from 'lucide-react'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import LogoutButton from '@/components/LogoutButton'

interface NavbarProps {
  rightContent?: React.ReactNode
}

const Navbar = ({ rightContent }: NavbarProps) => {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/user-context', { cache: 'no-store' })
      .then((response) => response.json())
      .then((context: { userId?: string }) => {
        if (active) setIsAuthenticated(Boolean(context.userId))
      })
      .catch(() => {
        if (active) setIsAuthenticated(false)
      })
    return () => { active = false }
  }, [pathname])

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/product', label: 'Pharmacy', icon: Pill },
    { href: '/news', label: 'News', icon: Newspaper },
  ]

  return (
    <header className="sticky top-0 z-20 border-b border-dark-500 bg-dark-200/80 backdrop-blur-md px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="carepulse"
            className="h-9 w-fit"
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-4 py-2 text-14-medium transition-colors ${
                pathname === link.href
                  ? 'bg-dark-400 text-white'
                  : 'text-dark-700 hover:text-white hover:bg-dark-400'
              }`}
            >
              {'icon' in link && link.icon && <link.icon aria-hidden="true" size={16} />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right slot — cart button, etc. */}
        <div className="flex items-center gap-2 sm:gap-3">
          {rightContent}
          <ThemeToggle />
          {isAuthenticated && <LogoutButton />}
        </div>
      </div>
    </header>
  )
}

export default Navbar
