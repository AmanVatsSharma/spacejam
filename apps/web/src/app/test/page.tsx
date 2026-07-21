import React from 'react';

export default async function TestPage(props: { searchParams: Promise<{ user?: string }> | { user?: string } }) {
  const searchParams = await Promise.resolve(props.searchParams);
  const user = searchParams?.user || 'Farhan';

  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-4">
        Hi {user} 
        <span className="inline-block animate-[wave_2s_ease-in-out_infinite] origin-[70%_70%]">👋</span>
      </h1>
      
      {/* Define the custom wave animation inline since it's just for this element */}
      <style>{`
        @keyframes wave {
          0% { transform: rotate(0.0deg) }
          10% { transform: rotate(14.0deg) }
          20% { transform: rotate(-8.0deg) }
          30% { transform: rotate(14.0deg) }
          40% { transform: rotate(-4.0deg) }
          50% { transform: rotate(10.0deg) }
          60% { transform: rotate(0.0deg) }
          100% { transform: rotate(0.0deg) }
        }
      `}</style>
    </div>
  );
}
