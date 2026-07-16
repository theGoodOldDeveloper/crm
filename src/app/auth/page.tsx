'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'

const errorMessages: Record<string, string> = {
  access_denied: 'Hozzáférés megtagadva.',
  no_code: 'Érvénytelen visszahívás.',
  no_token: 'Nem sikerült tokent szerezni.',
  no_email: 'Nem sikerült lekérni az email címet.',
  server_error: 'Szerver hiba. Próbáld újra.',
}

function AuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const [devLoading, setDevLoading] = useState(false)
  const handleDevLogin = async () => {
    setDevLoading(true)
    try {
      const res = await fetch('/api/auth/dev-login', { method: 'POST' })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        alert('Dev login nem elérhető (DEV_LOGIN_ENABLED=false)')
      }
    } finally {
      setDevLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900">
      <div className="w-full max-w-md px-4">
        <div className="card p-8 text-center space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-3xl font-bold">C</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Személyes CRM rendszer</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                {errorMessages[error] || 'Ismeretlen hiba történt.'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Jelentkezz be Google fiókoddal a CRM eléréséhez.
            </p>

            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-gray-700 dark:text-gray-200 font-medium text-sm shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Bejelentkezés Google-lel
            </a>

            {/* Dev login button - API rejects it if DEV_LOGIN_ENABLED != true */}
            <button
                onClick={handleDevLogin}
                disabled={devLoading}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-amber-700 dark:text-amber-400 font-medium text-sm"
              >
                {devLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <span>🛠️</span>
                )}
                Dev bejelentkezés (csak lokálisan)
              </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-600">
            A bejelentkezéssel hozzáférést adsz a Google Naptárhoz (opcionális funkció).
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <AuthContent />
    </Suspense>
  )
}
