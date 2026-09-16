import type { Metadata, Viewport } from "next";
import { Alegreya_Sans, Marcellus, Marcellus_SC } from "next/font/google";
import "./globals.css";

import GlobalUI from "@/components/GlobalUI/GlobalUI";
import { AuthProvider } from "@/contexts/AuthContext";
import Toaster from "@/components/Toast/Toaster";
import PwaProvider from "@/components/PWA/PwaProvider";

/*
 * Les trois polices du jeu, nommees d'apres leur ROLE et non d'apres leur dessin.
 *
 * Changer l'habillage typographique du jeu entier, c'est changer ces trois lignes et les trois
 * jetons de globals.css qui les consomment -- rien d'autre : plus aucune feuille ne nomme une
 * police en clair.
 *
 * Marcellus et Marcellus SC n'ont qu'une graisse. C'est assume : c'est une lapidaire, elle tire
 * sa hierarchie de la taille et de l'interlettrage, pas du gras. Voir --weight-title dans
 * globals.css.
 */
const titleFace = Marcellus({
  subsets: ["latin"],
  variable: '--font-title-face',
  weight: '400',
});

const displayFace = Marcellus_SC({
  subsets: ["latin"],
  variable: '--font-display-face',
  weight: '400',
});

const bodyFace = Alegreya_Sans({
  subsets: ["latin"],
  variable: '--font-body-face',
  // 600 n'existe pas chez Alegreya Sans : une regle qui le demande tombe sur 700, sans
  // fabrication de graisse. 800 tombe de meme sur 900.
  weight: ['400', '500', '700', '900'],
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
  // anciennes icônes de la racine de `public/` étaient des JPEG de 376 Ko renommés. Elles ont
  // été supprimées ; tout passe désormais par `public/icons/`.
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
  // Les variables de police sont portees par <html>, et non par <body> : les jetons
  // --font-title / --font-body de globals.css sont declares dans `:root`, et une propriete
  // personnalisee est substituee sur l'element ou elle est declaree. Sur <body>, elles
  // seraient invisibles depuis `:root` et les jetons tomberaient en panne.
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${titleFace.variable} ${displayFace.variable} ${bodyFace.variable}`}
    >
      <body>
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
