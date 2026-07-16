'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [search, setSearch] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/contacts?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-gray-100 dark:border-slate-700 px-6 py-3 flex items-center gap-4">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0">
        {title}
      </h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Gyors keresés..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-1.5"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {actions}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
          title="Téma váltás"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
