// app/api/user-context/route.ts
// Returns userId and patientId from cookies for client components

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPatient } from '@/lib/actions/patient.actions'

export async function GET() {
  try {
    const userId = cookies().get('userId')?.value ?? ''

    if (!userId) {
      return NextResponse.json({ userId: '', patientId: '' })
    }

    const patient = await getPatient(userId)

    return NextResponse.json({
      userId,
      patientId: patient?.$id ?? '',
    })
  } catch {
    return NextResponse.json({ userId: '', patientId: '' })
  }
}