'use client'

import { getNews } from '@/components/Service/getNews'
import React, { useEffect, useState } from 'react'
import moment from 'moment'
import Navbar from '@/components/Navbar'

interface NewsArticle {
  urlToImage: string
  title: string
  content: string
  author: string | null
  publishedAt: string
  url: string
}

const CATEGORIES = ['general', 'health', 'business', 'sports', 'technology']
const COUNTRIES = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'it', label: 'Italy' },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-xl border border-dark-500 bg-dark-400 overflow-hidden animate-pulse">
    <div className="h-48 bg-dark-300" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-dark-300 rounded w-3/4" />
      <div className="h-4 bg-dark-300 rounded w-full" />
      <div className="h-4 bg-dark-300 rounded w-2/3" />
      <div className="flex justify-between mt-4">
        <div className="h-3 bg-dark-300 rounded w-1/4" />
        <div className="h-3 bg-dark-300 rounded w-1/4" />
      </div>
    </div>
  </div>
)

// ─── News Card ────────────────────────────────────────────────────────────────
const NewsCard = ({ news }: { news: NewsArticle }) => (
  <a
    href={news.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex flex-col rounded-xl border border-dark-500 bg-dark-400 overflow-hidden hover:border-green-500 transition-colors"
  >
    <div className="relative h-48 bg-dark-300 flex-shrink-0">
      {news.urlToImage ? (
        <img
          src={news.urlToImage}
          alt={news.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <img
          src="/assets/images/medicine-paracetamol.webp"
          alt="Paracetamol medicine bottle"
          className="w-full h-full object-cover"
        />
      )}
    </div>

    <div className="flex flex-col flex-1 p-4 space-y-3">
      <h3 className="text-14-medium text-white line-clamp-2 group-hover:text-green-500 transition-colors">
        {news.title}
      </h3>
      <p className="text-12-regular text-dark-700 line-clamp-3 flex-1">
        {news.content ? news.content.slice(0, 120) + '...' : 'No content available.'}
      </p>
      <div className="border-t border-dark-500 pt-3 flex items-center justify-between">
        <span className="text-12-regular text-dark-600 truncate max-w-[55%]">
          {news.author ?? 'Unknown'}
        </span>
        <span className="text-12-regular text-dark-600">
          {moment(news.publishedAt).format('MMM D, YYYY')}
        </span>
      </div>
      <span className="text-12-semibold text-green-500 group-hover:underline">
        Read more →
      </span>
    </div>
  </a>
)

// ─── Main Page ────────────────────────────────────────────────────────────────
const NewsPage: React.FC = () => {
  const [newsData, setNewsData] = useState<NewsArticle[]>([])
  const [selectOption, setSelectOption] = useState('health')
  const [selectCountry, setSelectCountry] = useState('us')
  const [loading, setLoading] = useState(false)

  const getAllNews = async () => {
    setLoading(true)
    try {
      const data = await getNews(selectOption, selectCountry)
      if (data?.data?.articles) {
        setNewsData(data.data.articles)
      } else {
        setNewsData([])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setNewsData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getAllNews()
  }, [selectOption, selectCountry])

  return (
    <div className="min-h-screen bg-dark-200">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Title */}
        <section className="mb-8 space-y-2">
          <h1 className="header">Health News 📰</h1>
          <p className="text-dark-700">
            Stay updated with the latest health and medical headlines.
          </p>
        </section>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-8">
          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto remove-scrollbar pb-1 flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectOption(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-14-medium capitalize transition-colors ${
                  selectOption === cat
                    ? 'bg-green-500 text-white'
                    : 'border border-dark-500 bg-dark-400 text-dark-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Country selector */}
          <select
            value={selectCountry}
            onChange={(e) => setSelectCountry(e.target.value)}
            className="rounded-md border border-dark-500 bg-dark-400 px-3 py-2 text-14-regular text-white outline-none flex-shrink-0"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-14-regular text-dark-700 mb-4">
            {newsData.length} article{newsData.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : newsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <span className="text-5xl">📭</span>
            <p className="text-dark-700 text-16-regular">
              No articles found. Try a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {newsData.map((news, index) => (
              <NewsCard key={index} news={news} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-dark-500 py-6 text-center">
        <p className="text-14-regular text-dark-600">© 2026 CarePulse</p>
      </footer>
    </div>
  )
}

export default NewsPage
