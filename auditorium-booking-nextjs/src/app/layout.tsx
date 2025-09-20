import type { Metadata } from "next";
import { Inter, Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import Footer from "@/components/ui/Footer";

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
  title: "Auditorium Booking System - Poornima University",
  description: "Book and manage auditorium slots at Poornima University",
  keywords: ["auditorium", "booking", "university", "events", "reservations"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${sourceSans.variable} antialiased`}
        style={{ paddingBottom: '70px' }}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
