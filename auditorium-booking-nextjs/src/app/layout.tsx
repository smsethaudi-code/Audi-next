import type { Metadata } from "next";
import { Inter, Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import Footer from "@/components/ui/Footer";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";
import PWAInstallSuccess from "@/components/ui/PWAInstallSuccess";
import PWASplashScreen from "@/components/ui/PWASplashScreen";

// Font configurations for academic design
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Poornima Group - Dr. S.M Seth Auditorium Booking",
  description: "Official auditorium booking platform for Poornima Group of Colleges - ज्ञानम् विना न किमपि साध्यम्",
  keywords: ["poornima", "auditorium", "booking", "college", "events", "reservations", "pwa", "education"],
  manifest: "/manifest.json",
  themeColor: "#1e40af",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Poornima Auditorium",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Poornima Group - Dr. S.M Seth Auditorium Booking",
    title: "Poornima Group - Dr. S.M Seth Auditorium Booking",
    description: "Official auditorium booking platform for Poornima Group of Colleges",
  },
  twitter: {
    card: "summary",
    title: "Poornima Group - Dr. S.M Seth Auditorium Booking",
    description: "Official auditorium booking platform for Poornima Group of Colleges",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Poornima Auditorium" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Poornima Auditorium" />
        <meta name="description" content="Official auditorium booking platform for Poornima Group of Colleges" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#1e40af" />

        {/* Viewport for mobile */}
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Microsoft Tags */}
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Splash screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
      </head>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${sourceSans.variable} antialiased`}
        style={{ paddingBottom: '70px' }}
      >
        <AuthProvider>
          <ThemeProvider>
            <PWASplashScreen />
            {children}
            <Footer />
            <PWAInstallPrompt />
            <PWAInstallSuccess />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
