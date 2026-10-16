import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

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
  title: {
    default: "denuncIA — Denúncias de corrupção",
    template: "%s · denuncIA",
  },
  description:
    "denuncIA: plataforma de submissão, categorização e encaminhamento de denúncias de corrupção com apoio de modelos de linguagem. Protótipo académico.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-MZ">
      <body className={`${inter.variable} ${sourceSerif.variable} ${mono.variable} antialiased`}>
        <ToastProvider>
          <ChatProvider>{children}</ChatProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
