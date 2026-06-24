import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Newsreader, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/* Use Inter as the clean sans until Geist package is installed */
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduForge",
  description: "AI-powered classroom tools for language educators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${newsreader.variable} ${jetbrainsMono.variable} ${inter.variable}`}
        suppressHydrationWarning
      >
        <body>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "var(--accent-color)",
                border: "none",
                color: "var(--accent-fg)",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "var(--shadow-lg)",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
