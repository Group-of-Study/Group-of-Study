import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeWatcher } from "@/components/theme/theme-watcher";
import { ToastProvider } from "@/components/ui/toast";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Group of Study",
  description: "Aprender juntos. Evoluir juntos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-theme="light" é o padrão do servidor; o script troca antes da página
    // aparecer, por isso o suppressHydrationWarning (GOS-016, "Preventing Flash" no Next).
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Cor de fundo e do texto vêm dos tokens (globals.css), que mudam com o tema. */}
      <body className="flex min-h-full flex-col">
        <ThemeWatcher />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}