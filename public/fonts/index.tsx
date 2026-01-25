import { Alexandria, Baloo_2, Inter, Noto_Sans_KR } from 'next/font/google'
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const baloo = Baloo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: "--font-baloo",
})

export const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  display: 'swap',
})

export const alexandria = Alexandria({
  subsets: ['latin'],
  display: 'swap',
})

export const pretendard = localFont({
  src: "./PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});