import React, { useEffect, useRef } from "react";

const PDFViewer = ({ primaryDocument, onTextSelect }) => {
  const viewerContainerRef = useRef(null);
  const adobeApisRef = useRef(null);

  // In PDFViewer.jsx

  // In PDFViewer.jsx

  // In PDFViewer.jsx

  useEffect(() => {
    // We still need the ref to the container, but we won't attach the listener to it.
    const container = viewerContainerRef.current;
    if (!container) return;

    // This function will be called when the user releases the mouse ANYWHERE on the page.
    const handleMouseUp = async () => {
      // Check if the Adobe APIs have been initialized and stored.
      if (adobeApisRef.current) {
        try {
          const result = await adobeApisRef.current.getSelectedContent();
          const text = result?.data;
          if (text) {
            console.log(`getSelectedContent successful. Text: "${text}"`);
            onTextSelect(text); // Send the text up to the parent component.
          }
        } catch (error) {
          // This error is expected if no text is selected, so we can safely ignore it.
        }
      }
    };

    const initializeViewer = async () => {
      if (!window.AdobeDC || !window.AdobeDC.View) {
        console.error("AdobeDC SDK not available.");
        return;
      }

      try {
        // ✅ Fetch key from backend
        const res = await fetch("/config/adobe-key");
        const data = await res.json();

        const adobeDCView = new window.AdobeDC.View({
          clientId: data.adobe_embed_api_key,
          divId: "adobe-dc-view",
        });

        const previewFilePromise = adobeDCView.previewFile(
          {
            content: {
              location: {
                url: primaryDocument
                  ? URL.createObjectURL(primaryDocument)
                  : "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf",
              },
            },
            metaData: {
              fileName: primaryDocument?.name || "Sample.pdf",
            },
          },
          { embedMode: "SIZED_CONTAINER" }
        );

        previewFilePromise.then((adobeViewer) => {
          adobeViewer.getAPIs().then((apis) => {
            adobeApisRef.current = apis;
          });
        });
      } catch (e) {
        console.error("Failed to load Adobe Embed key:", e);
      }
    };

    // --- Attach listener to the window ---
    console.log("Attaching mouseup event listener to window.");
    window.addEventListener("mouseup", handleMouseUp);

    if (window.AdobeDC) {
      initializeViewer();
    } else {
      document.addEventListener("adobe_dc_view_sdk.ready", initializeViewer);
    }

    // --- CLEANUP FUNCTION ---
    return () => {
      console.log("Cleaning up mouseup event listener from window.");
      // Remove the listener from the window when the component unmounts.
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [primaryDocument, onTextSelect]);

  return (
    <div
      ref={viewerContainerRef}
      className="h-[85vh] min-h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex-shrink-0 bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-grow text-center text-sm font-medium text-gray-600 truncate">
          {primaryDocument?.name || "Sample Document"}
        </div>
      </div>

      {/* Container where Adobe Embed renders PDF */}
      <div id="adobe-dc-view" className="flex-grow" />
    </div>
  );
};

export default PDFViewer;
