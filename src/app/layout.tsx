import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import GlobalUI from "@/components/GlobalUI/GlobalUI";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "GODS - Le Jeu de Cartes des Dieux",
  description: "Affrontez vos adversaires dans un duel épique entre divinités. Maîtrisez les éléments, gérez votre énergie et terrassez les dieux ennemis !",
  keywords: ["jeu de cartes", "TCG", "mythologie", "dieux", "stratégie", "multijoueur"],
  authors: [{ name: "Aseo, Drift & Zedycuss" }],
  openGraph: {
    title: "GODS - Le Jeu de Cartes des Dieux",
    description: "Affrontez vos adversaires dans un duel épique entre divinités.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.variable}>
        <GlobalUI />
        {children}
      </body>
    </html>
  );
}
