import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Narin Hanım Hasta Takip Sistemi",
  description: "Bitkisel sağlık için modern hasta yönetimi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Browser bildirimlerini engelle
            if ('Notification' in window) {
              Notification.requestPermission = function() {
                return Promise.resolve('denied');
              };
            }
          `
        }} />
      </body>
    </html>
  );
}
