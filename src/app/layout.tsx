import type { Metadata } from "next";
import { Inter, Cinzel, Cinzel_Decorative } from "next/font/google";
import "./globals.css";

import GlobalUI from "@/components/GlobalUI/GlobalUI";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  variable: '--font-cinzel-decorative',
  weight: ['400', '700', '900'],
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
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${cinzel.variable} ${cinzelDecorative.variable}`}>
        <AuthProvider>
          <GlobalUI />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
