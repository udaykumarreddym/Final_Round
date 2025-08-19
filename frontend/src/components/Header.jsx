import React from "react";

export default function Header({ onLogoClick }) {
  return (
    <header className="bg-white p-4 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div
          className="inline-flex items-center gap-3 cursor-pointer group"
          onClick={onLogoClick}
        >
          {/* Creative Icon */}
          <div className="p-2 bg-gradient-to-br from-red-500 to-red-700 rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l.707-.707M6.343 17.657l-.707.707m12.728 0l.707.707M12 21v-1m-4.663-4H16.5"
              />
            </svg>
          </div>

          {/* Gradient Heading Text */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-red-600 to-black bg-clip-text text-transparent">
              Document Insight Assistant
            </span>
          </h1>
        </div>
      </div>
    </header>
  );
}
