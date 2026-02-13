import type { Metadata } from "next";
import "./globals.css";
import "@styles/landing.css";
import 'ldrs/react/Ring.css'
import { ThemeProvider } from "@components/providers/theme-provider";
import AuthProvider from "@components/providers/auth-provider";
import { SocketProvider } from "@contexts/SocketContext";
import { Suspense } from "react";
import { baloo, pretendard } from "@public/fonts";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#26282b',
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  ? (process.env.NEXT_PUBLIC_APP_URL.startsWith('http') ? process.env.NEXT_PUBLIC_APP_URL : `https://${process.env.NEXT_PUBLIC_APP_URL}`)
  : "https://cromo.site";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Cromo",
    template: "%s | Cromo",
  },
  description: "AI와 함께하는 스마트한 메모 관리",
  manifest: "/manifest.json",
  keywords: ["Cromo", "크로모", "AI 메모", "스마트 메모", "실시간 공유", "지능형 검색", "메모 앱"],
  authors: [{ name: "Croni", url: "https://github.com/team-croni" }],
  creator: "Croni",
  publisher: "Croni",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://cromo.site",
    title: "Cromo",
    description: "AI와 함께하는 스마트한 메모 관리",
    siteName: "Cromo",
    images: [
      {
        url: "/images/hero-screenshot1.png",
        width: 1600,
        height: 968,
        alt: "Cromo - AI와 함께하는 스마트한 메모 관리",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cromo",
    description: "AI와 함께하는 스마트한 메모 관리",
    images: ["/images/hero-screenshot1.png"],
    creator: "@croni",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cromo",
  },
  icons: {
    icon: [
      { url: "/favicon_196.png", sizes: "196x196", type: "image/png" },
      { url: "/favicon_512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicon_196.png", sizes: "196x196", type: "image/png" }],
  },
}

// QueryClientProvider를 클라이언트 컴포넌트에서 직접 생성하도록 수정
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitializerScript = `
    try {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } catch (_) {}
  `;

  return (
    <html lang="ko" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializerScript }} />
      </head>
      <body
        className={`${pretendard.variable} ${baloo.variable} flex h-svh`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
            storageKey="theme"
          >
            <Suspense fallback={null}>
              <SocketProvider>
                {children}
              </SocketProvider>
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}