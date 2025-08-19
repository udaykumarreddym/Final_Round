import React from "react";

export default function PodcastPlayer({ podcastUrl }) {
  if (!podcastUrl) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 h-full">
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-6 h-6 text-red-600" /* ... */></svg>
        <h2 className="text-xl font-bold text-black">Audio Summary</h2>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Listen to an AI-generated summary of the key findings.
        </p>
        <audio key={podcastUrl} controls className="w-full h-10">
          {/* The source now uses the prop */}
          <source src={podcastUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}
