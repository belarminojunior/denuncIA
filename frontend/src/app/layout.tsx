import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "GCCC — Plataforma de Denúncias",
  description:
    "Plataforma de categorização e encaminhamento de denúncias de corrupção com apoio de LLMs. Protótipo académico.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-MZ">
      <body className={`${inter.variable} ${sourceSerif.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
