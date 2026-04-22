import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ProfileCompleteCheck from "@/components/ProfileCompleteCheck";
import CookieConsent from "@/components/CookieConsent";
import SessionTimeout from "@/components/SessionTimeout";
import Footer from "@/components/Footer";
import ThemeRegistry from "@/theme/ThemeRegistry";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "Shri Pitambara Baglamukhi Shakti Pitham, Ahilyanagar — Spiritual Consultation",
    template: "%s | SPBSP, Ahilyanagar",
  },
  description:
    "Shri Pitambara Baglamukhi Shakti Pitham, Ahilyanagar — book a personal astrology & spiritual consultation with Shri Mayuresh Guruji Vispute. Kundali, Vastu, Meditation & more.",
  keywords: [
    "astrology", "spiritual consultation", "kundali", "vastu",
    "pitham", "baglamukhi", "pitambara", "shakti pitham", "ahilyanagar",
    "guruji", "mayuresh vispute",
  ],
  authors: [{ name: "Shri Pitambara Baglamukhi Shakti Pitham, Ahilyanagar" }],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/spbsp-logo.png", type: "image/png" },
    ],
    shortcut: "/spbsp-logo.png",
    apple: "/spbsp-logo.png",
  },
  openGraph: {
    title: "Shri Pitambara Baglamukhi Shakti Pitham, Ahilyanagar",
    description: "Seek guidance from Shri Mayuresh Guruji Vispute",
    type: "website",
    locale: "en_IN",
    siteName: "Shri Pitambara Baglamukhi Shakti Pitham, Ahilyanagar",
    images: [{ url: "/spbsp-logo.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#E65100",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeRegistry>
          <a href="#main-content" style={{
            position: "absolute", left: "-9999px", top: "auto",
            width: "1px", height: "1px", overflow: "hidden",
          }}>
            Skip to main content
          </a>
          <Navbar />
          <ProfileCompleteCheck />
          <SessionTimeout />
          <ErrorBoundary>
            <main id="main-content" role="main">
              {children}
            </main>
          </ErrorBoundary>
          <Footer />
          <CookieConsent />
        </ThemeRegistry>
      </body>
    </html>
  );
}
