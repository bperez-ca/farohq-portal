'use client'

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="http://localhost:3000"
          className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        {/* Clerk Sign In Component */}
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700",
              }
            }}
            routing="path"
            path="/signin"
            signUpUrl="/signup"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            By signing in, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
