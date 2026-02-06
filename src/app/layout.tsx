import type { Metadata } from "next";
import "./globals.css";
import "@styles/landing.css";
import 'ldrs/react/Ring.css'
import { ThemeProvider } from "@components/providers/theme-provider";
import AuthProvider from "@components/providers/auth-provider";
import { SocketProvider } from "@contexts/SocketContext";
import { Suspense } from "react";
import { baloo, pretendard } from "@public/fonts";


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#26282b',
};

export const metadata: Metadata = {
  title: "Cromo",
  description: "AI와 함께하는 스마트한 메모 관리",
  manifest: "/manifest.json",
  keywords: [""],
  authors: [{ name: "" }],
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
      </body>
    </html>
  );
}