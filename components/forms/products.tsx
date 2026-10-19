'use client'

import { useEffect, useState } from 'react'
import { Medicine } from '@/types/appwrite.types'
import { listMedicines } from '@/lib/actions/medicine.actions'
import Image from 'next/image'
import Link from 'next/link'
import { PackageSearch, Search } from 'lucide-react'

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-xl border border-dark-500 bg-dark-400 overflow-hidden animate-pulse">
    <div className="h-44 bg-dark-300" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-dark-300 rounded w-3/4" />
      <div className="h-4 bg-dark-300 rounded w-1/3" />
    </div>
  </div>
)

const MedicinePage: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      if (!active) return
      setError('Appwrite is taking too long to respond. Check your connection and try again.')
      setLoading(false)
    }, 15000)

    listMedicines()
      .then((items) => { if (active) setMedicines(items) })
      .catch((err) => {
        console.error('Failed to fetch medicines:', err)
        if (active) setError(err instanceof Error ? err.message : 'Could not load medicines from Appwrite.')
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (active) setLoading(false)
      })

    return () => { active = false; window.clearTimeout(timeout) }
  }, [requestKey])

  // ─── Derive categories from loaded medicines ────────────────────────────────
  const categories = [
    'All',
    ...Array.from(new Set(medicines.map((m) => m.category).filter(Boolean))).sort(),
  ]

  // ─── Filter logic ───────────────────────────────────────────────────────────
  const filtered = medicines.filter((m) => {
    const matchesSearch =
      search.trim() === '' ||
      m.medicineName.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' || m.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex rounded-md border border-dark-500 bg-dark-400 items-center px-3 gap-2">
        <Search aria-hidden="true" size={17} className="text-dark-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicines..."
          className="flex-1 bg-transparent py-2.5 text-14-regular text-white placeholder:text-dark-600 outline-none"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto remove-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-14-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-green-500 text-white'
                : 'border border-dark-500 bg-dark-400 text-dark-700 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-14-regular text-dark-700">
          {filtered.length} medicine{filtered.length !== 1 ? 's' : ''} in stock
        </p>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-700 bg-red-600/10 px-4 py-3 text-14-regular text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(null); setLoading(true); setRequestKey((key) => key + 1) }} className="rounded-md border border-red-500/50 px-3 py-1.5 text-sm text-white hover:bg-red-500/10">
            Try again
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <PackageSearch aria-hidden="true" size={40} strokeWidth={1.5} className="text-dark-600" />
          <p className="text-dark-700 text-16-regular">No medicines found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((med) => (
            <Link
              key={med.$id}
              href={`/product/${med.$id}`}
              className="group flex flex-col rounded-xl border border-dark-500 bg-dark-400 overflow-hidden hover:border-green-500 transition-colors"
            >
              {/* Image */}
              <div className="relative h-44 bg-dark-300 flex-shrink-0 flex items-center justify-center">
                {med.medicineImageUrl ? (
                  <Image
                    src={med.medicineImageUrl}
                    alt={med.medicineName}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><PackageSearch aria-hidden="true" size={48} strokeWidth={1.4} className="text-dark-600" /></div>
                )}
                {/* Badges */}
                {med.requiresPrescription && (
                  <span className="absolute top-2 right-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Rx
                  </span>
                )}
                {med.stock === 0 && (
                  <div className="absolute inset-0 bg-dark-200/80 flex items-center justify-center">
                    <span className="text-14-medium text-dark-600">Out of Stock</span>
                  </div>
                )}
                {med.stock > 0 && med.stock <= 5 && (
                  <span className="absolute top-2 left-2 rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Low Stock
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-1 flex-1 flex flex-col">
                <p className="text-16-semibold text-white group-hover:text-green-500 transition-colors">
                  {med.medicineName}
                </p>
                <p className="text-12-regular text-dark-700">
                  {med.dosage} · {med.unit}
                </p>
                <p className="text-12-regular text-dark-600 line-clamp-2 flex-1">
                  {med.description}
                </p>
                <p className="text-18-bold text-green-500 pt-2">
                  KSh {med.price?.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MedicinePage
