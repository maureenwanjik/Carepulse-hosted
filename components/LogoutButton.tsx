'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logoutUser } from '@/lib/actions/patient.actions'

export default function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser()
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="shad-gray-btn inline-flex items-center gap-2 rounded-md px-3 py-2 text-14-medium disabled:opacity-60"
    >
      <LogOut aria-hidden="true" size={16} />
      {isPending ? 'Logging out…' : 'Log out'}
    </button>
  )
}
