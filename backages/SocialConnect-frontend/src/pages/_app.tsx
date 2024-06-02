import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Rubik } from "next/font/google";

import MainLayout from "@/components/Layout/MainLayout";
import Topbar from "@/components/Layout/Topbar";

const fonts = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${fonts.variable} font-sans h-screen`}>
      <MainLayout>
        <Topbar />
        <Component {...pageProps} />
      </MainLayout>
    </main>
  );
}
