/**
 * File:        apps/web/src/app/dashboard/crm/onboarding/page.tsx
 * Module:      Web · Dashboard · CRM · Onboarding
 * Purpose:     Onboarding page for new client setup
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

export default function OnboardingPage() {
  return (
    <div className="flex-1 p-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">Manage new client onboarding process.</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Onboarding Coming Soon</h2>
          <p className="text-sm text-gray-500">This section will contain the onboarding workflow for new clients.</p>
        </div>
      </div>
    </div>
  );
}