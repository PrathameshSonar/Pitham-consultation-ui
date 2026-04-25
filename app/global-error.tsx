"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          fontFamily: "'Poppins', sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
          padding: "2rem",
          background: "#FFF8ED",
          color: "#3D2817",
        }}
      >
        <h1 style={{ fontSize: "3rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#6B4F3A", marginTop: "0.5rem" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "12px 32px",
            background: "#E65100",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
