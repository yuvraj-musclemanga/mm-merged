import type { Metadata } from "next";
import { Inter, Syncopate } from "next/font/google";
import "./globals.css";
import React from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syncopate = Syncopate({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-syncopate"
});

export const metadata: Metadata = {
  title: "Musclemanga Drop-01",
  description: "High-performance streetwear for those who live for the grind.",
  verification: {
    google: 'QXs3MSRXyHV3bGkcLr8nZh-2IkqnZg2rXRhbXORpJIE',
  },
};

import { Layout } from "@/components/layout/Layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${syncopate.variable} font-sans bg-background-dark text-white antialiased`} suppressHydrationWarning>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
