import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VenturePath",
  description: "Sharia-compliant cap table for KSA founders.",
};

// Set theme + language before paint to prevent flash. Reads localStorage;
// theme falls back to OS preference via @media (prefers-color-scheme: dark) in CSS.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('venturepath-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}var l=localStorage.getItem('venturepath-lang');if(l==='ar'||l==='en'){document.documentElement.setAttribute('lang',l);document.documentElement.setAttribute('dir',l==='ar'?'rtl':'ltr')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cairo.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
