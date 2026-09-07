import type { Metadata, Viewport } from "next";
import { Inter, Cinzel, Cinzel_Decorative } from "next/font/google";
import "./globals.css";

import GlobalUI from "@/components/GlobalUI/GlobalUI";
import { AuthProvider } from "@/contexts/AuthContext";
import Toaster from "@/components/Toast/Toaster";
import PwaProvider from "@/components/PWA/PwaProvider";

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

// Configuration du viewport
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Indispensable sur iPhone à encoche : sans ce réglage, la page s'arrête aux barres noires
  // et les `env(safe-area-inset-*)` utilisés partout dans les styles valent tous 0.
  viewportFit: 'cover',
  // Teinte la barre d'état système aux couleurs du jeu une fois l'app installée.
  themeColor: '#0a0a1a',
};

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
  // Icônes générées par `node scripts/generateAppIcons.js` : de vrais PNG légers, là où les
  // anciens `/favicon.png` et `/apple-touch-icon.png` étaient des JPEG de 376 Ko renommés.
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/favicon-32.png',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GODS',
  },
  // Empêche iOS de transformer les nombres du jeu (PV, énergie) en liens téléphoniques.
  formatDetection: { telephone: false },
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
          {/* Superpositions globales, montées après le contenu pour passer au-dessus sans
              dépendre d'un z-index plus élevé que celui des pages. */}
          <Toaster />
          <PwaProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
