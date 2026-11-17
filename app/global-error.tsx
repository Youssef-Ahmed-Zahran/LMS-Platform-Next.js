"use client";
// Last-resort fallback: catches errors that escape ALL route segment boundaries
// (e.g. a crash inside the root layout itself).
// IMPORTANT: global-error REPLACES the root layout entirely — it must include
// its own <html> and <body> tags. ThemeProvider / Toaster will NOT be present.

import { useEffect } from "react";

interface GlobalErrorProps {
  error: unknown;
  retry: () => void;
}

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "hsl(0 0% 3.9%)",
          color: "hsl(0 0% 98%)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            maxWidth: "480px",
            padding: "2rem",
          }}
        >
          {/* Icon */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(239,68,68,0.15)",
              color: "rgb(239,68,68)",
            }}
          >
            {/* Inline SVG — no Lucide available here, layout is gone */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
              A critical error occurred
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "hsl(0 0% 63.9%)",
              }}
            >
              The application encountered an unexpected problem. Your data is
              safe — please refresh and try again.
            </p>
          </div>

          <button
            onClick={retry}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "hsl(0 0% 98%)",
              color: "hsl(0 0% 3.9%)",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
