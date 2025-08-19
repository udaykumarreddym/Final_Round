import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PDFViewer from "../components/PDFViewer";
import SnippetNavigator from "../components/SnippetNavigator";
import InsightsPanel from "../components/InsightsPanel";
import PodcastPlayer from "../components/PodcastPlayer";

export default function ResultsDisplayPage({
  primaryDocument,
  knowledgeBaseFiles,
  queryText,
  snippets,
}) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState([]);
  const [podcastUrl, setPodcastUrl] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isLoadingPodcast, setIsLoadingPodcast] = useState(true);

  // State and refs for PDF switching functionality
  const adobeApisRef = useRef(null);
  const [activePdf, setActivePdf] = useState(primaryDocument);

  useEffect(() => {
    if (!primaryDocument) {
      navigate("/");
      return;
    }

    if (!snippets || snippets.length === 0) {
      setIsLoadingInsights(false);
      setIsLoadingPodcast(false);
      return;
    }

    const sectionsPayload = snippets;

    const fetchInsights = async () => {
      setIsLoadingInsights(true);
      try {
        const response = await fetch("/insights/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sectionsPayload),
        });
        if (!response.ok) throw new Error("Failed to load insights.");
        const data = await response.json();
        setInsights(data.insights);
      } catch (error) {
        console.error("Error fetching insights:", error);
        setInsights([]);
      } finally {
        setIsLoadingInsights(false);
      }
    };

    const fetchPodcast = async () => {
      setIsLoadingPodcast(true);
      try {
        const response = await fetch("/podcast/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sectionsPayload),
        });
        if (!response.ok) throw new Error("Failed to generate podcast.");
        const data = await response.json();
        setPodcastUrl(data.podcast_url);
      } catch (error) {
        console.error("Error fetching podcast:", error);
      } finally {
        setIsLoadingPodcast(false);
      }
    };

    fetchInsights();
    fetchPodcast();
  }, [snippets, primaryDocument, navigate]);

  const handleApisReady = (apis) => {
    adobeApisRef.current = apis;
  };

  const handleSnippetClick = (pageNumber, pdfName) => {
    if (activePdf && activePdf.name === pdfName) {
      if (adobeApisRef.current) {
        adobeApisRef.current.gotoLocation(pageNumber);
      }
    } else {
      const allFiles = [primaryDocument, ...(knowledgeBaseFiles || [])];
      const newActiveFile = allFiles.find(
        (file) => file && file.name === pdfName
      );
      if (newActiveFile) {
        setActivePdf(newActiveFile);
      }
    }
  };

  if (!primaryDocument) {
    return null; // Render guard (this is correct and should stay)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 animate-fade-in-up">
      <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8 lg:order-1 order-2">
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-black mb-3">
            Analysis for Your Query:
          </h2>
          <blockquote className="border-l-4 border-red-500 bg-gray-50 p-4 rounded-r-lg text-gray-700 italic text-sm">
            “{queryText || "No query provided"}”
          </blockquote>
        </div>

        {/* --- CORRECTED SECTION --- */}
        {/* These components now use the actual props and state from your component */}
        <SnippetNavigator
          snippets={snippets}
          onSnippetClick={handleSnippetClick}
        />
        <InsightsPanel insights={insights} isLoading={isLoadingInsights} />
        <PodcastPlayer podcastUrl={podcastUrl} isLoading={isLoadingPodcast} />
        {/* ------------------------- */}

        <button
          onClick={() => navigate("/analysis")}
          className="w-full text-gray-800 bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
        >
          Back to Analysis
        </button>
      </div>

      <div className="lg:col-span-3 lg:order-2 order-1">
        {/* --- CORRECTED SECTION --- */}
        {/* This now uses the activePdf state and includes the necessary props */}
        <PDFViewer
          key={activePdf ? activePdf.name : "no-pdf"}
          primaryDocument={activePdf}
          onTextSelect={() => {}}
          onAPIsReady={handleApisReady}
        />
        {/* ------------------------- */}
      </div>
    </div>
  );
}
