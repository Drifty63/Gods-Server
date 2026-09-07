'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { getVisibleGods } from '@/data/gods';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingRequests } from '@/services/supabase-profile';
import { ELEMENT_SYMBOLS, ELEMENT_NAMES, ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import { useSwipe } from '@/lib/useSwipe';
import { haptic } from '@/lib/haptics';
import { playSfx } from '@/lib/sfx';

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}

function HomeContent() {
  const { profile } = useAuth();

  const [currentGodIndex, setCurrentGodIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Utiliser l'ambroisie du profil ou 0 par défaut
  const userAmbroisie = profile?.ambroisie ?? 0;
  // Filtrer les dieux selon le statut créateur
  const visibleGods = useMemo(() => getVisibleGods(profile?.is_creator || false), [profile?.is_creator]);

  // Demandes d'ami en attente : jusqu'ici, rien nulle part n'indiquait qu'une demande était
  // arrivée -- il fallait aller sur /social par réflexe pour le découvrir. Petit point rouge
  // sur l'icône Social le temps qu'on a une vraie notification.
  const [hasPendingFriendRequests, setHasPendingFriendRequests] = useState(false);
  useEffect(() => {
    if (!profile) return;
    getPendingRequests()
      .then(requests => setHasPendingFriendRequests(requests.length > 0))
      .catch(() => {});
  }, [profile]);

  // Carrousel automatique des dieux (10 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentGodIndex((prev) => (prev + 1) % visibleGods.length);
        setIsTransitioning(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, [visibleGods.length]);

  /**
   * Index borné à la liste courante. `visibleGods` rétrécit quand le profil se charge et révèle
   * que le joueur n'est PAS créateur (20 dieux → 12) : un index resté au-delà rendait
   * `currentGod` indéfini, et la page plantait à la première lecture de `currentGod.element`.
   */
  const safeIndex = visibleGods.length > 0 ? currentGodIndex % visibleGods.length : 0;
  const currentGod = visibleGods[safeIndex];

  const handleOptionsClick = () => {
    // Déclencher l'événement pour ouvrir le modal global
    window.dispatchEvent(new Event('open-options'));
  };

  const handleRewardsClick = () => {
    // Déclencher l'événement pour ouvrir le modal global
    window.dispatchEvent(new Event('open-rewards'));
  };

  const handleQuestsClick = () => {
    // Déclencher l'événement pour ouvrir le modal des quêtes
    window.dispatchEvent(new Event('open-quests'));
  };

  /**
   * Déplacement dans le carrousel, mutualisé entre les flèches, les points et le balayage.
   * `goTo` accepte un index absolu ou un pas relatif, pour n'avoir qu'un seul endroit qui gère
   * la transition et le retour sensoriel.
   */
  const goToGod = useCallback((next: number) => {
    setIsTransitioning(true);
    haptic('tap');
    playSfx('tap');
    setTimeout(() => {
      setCurrentGodIndex(((next % visibleGods.length) + visibleGods.length) % visibleGods.length);
      setIsTransitioning(false);
    }, 300);
  }, [visibleGods.length]);

  // Navigation vers le dieu précédent / suivant (à partir de l'index BORNÉ, pour rester
  // cohérent avec la carte réellement affichée).
  const prevGod = () => goToGod(safeIndex - 1);
  const nextGod = () => goToGod(safeIndex + 1);

  // Balayage horizontal : le geste attendu au pouce, là où seules deux petites flèches et
  // vingt points minuscules permettaient de parcourir le roster.
  const swipeHandlers = useSwipe(nextGod, prevGod);

  // Garde placée APRÈS tous les hooks : un `return` anticipé plus haut changerait le nombre de
  // hooks exécutés d'un rendu à l'autre, ce que React interdit.
  if (!currentGod) return null;

  return (
    <main className={styles.main}>
      {/* BACKGROUND EFFECTS */}
      <div className={styles.bgParticles} />

      {/* Contenu principal divisé en deux colonnes pour le format Paysage */}
      <div className={styles.content}>
        
        {/* COLONNE GAUCHE (Titre + Actualités) */}
        <div className={styles.leftColumn}>
          {/* Titre aligné à gauche */}
          <div className={styles.logoContainer}>
            <h1 className={styles.title}>
              <span className={styles.titleLetter}>G</span>
              <span className={styles.titleLetter}>O</span>
              <span className={styles.titleLetter}>D</span>
              <span className={styles.titleLetter}>S</span>
            </h1>
            <p className={styles.subtitle}>Le Jeu de Cartes des Dieux</p>
          </div>

          {/* Section Actualités */}
          <section className={styles.newsSection}>
            <div className={styles.newsSectionHeader}>
              <span className={styles.newsIcon}>📜</span>
              <h2>Actualité :</h2>
            </div>
            <div className={styles.newsContent}>
              <p className={styles.newsItem}>
                <span className={styles.newsBullet}>-</span>
                Patch 0.24 : Correctif des bugs sur le mode en ligne.
              </p>
              <p className={styles.newsItem}>
                <span className={styles.newsBullet}>-</span>
                Présentation de l&apos;extension Death & Glory.
              </p>
              <p className={styles.newsItem}>
                <span className={styles.newsBullet}>-</span>
                Patch 0.23 : Sortie de l&apos;histoire de ZEUS
              </p>
            </div>
          </section>
        </div>

        {/* COLONNE DROITE (Carrousel) */}
        <div className={styles.rightColumn}>
          <section className={styles.godCardSection}>
            <button className={styles.carouselArrow} onClick={prevGod} aria-label="Dieu précédent">
              ‹
            </button>

            <div
              className={`${styles.godCardWrapper} ${isTransitioning ? styles.transitioning : ''}`}
              {...swipeHandlers}
            >
              <div className={styles.godCard}>
                <div className={styles.godCardInner}>
                  <Image
                    src={currentGod.carouselImage || currentGod.imageUrl}
                    alt={currentGod.name}
                    fill
                    className={styles.godCardImage}
                    priority
                  />
                </div>
              </div>

              {/* Identité du dieu affiché : le carrousel ne montrait qu'une illustration, sans
                  jamais nommer le dieu ni révéler son élément — l'information la plus utile
                  pour un nouveau joueur qui découvre le roster. */}
              <div
                className={styles.godCardCaption}
                style={{ '--god-color': ELEMENT_COLORS[currentGod.element].primary } as React.CSSProperties}
              >
                <span className={styles.godCardName}>{currentGod.name.split(',')[0]}</span>
                <span className={styles.godCardElement}>
                  {ELEMENT_SYMBOLS[currentGod.element]} {ELEMENT_NAMES[currentGod.element]}
                  <span className={styles.godCardHp}>· {currentGod.maxHealth} PV</span>
                </span>
              </div>

              {/* Compteur plutôt qu'une rangée de 20 points : au-delà d'une poignée d'éléments,
                  les points deviennent illisibles ET intouchables au pouce. La barre de
                  progression conserve le repère « où suis-je dans le roster ». */}
              <div className={styles.godCardProgress}>
                <div className={styles.godCardProgressTrack}>
                  <div
                    className={styles.godCardProgressFill}
                    style={{ width: `${((currentGodIndex + 1) / visibleGods.length) * 100}%` }}
                  />
                </div>
                <span className={styles.godCardCounter}>
                  {currentGodIndex + 1} / {visibleGods.length}
                </span>
              </div>
            </div>

            <button className={styles.carouselArrow} onClick={nextGod} aria-label="Dieu suivant">
              ›
            </button>
          </section>
        </div>
      </div>

      {/* Compteur d'ambroisie : DOIT rester en dehors de <nav> (position:fixed dessus, mais
          .bottomNav a un backdrop-filter, qui crée un containing block pour ses descendants en
          position:fixed — le compteur se positionnait donc par rapport à la barre du bas,
          en bas de l'écran, au lieu du viewport entier). */}
      <div className={styles.currencyDisplay}>
        <Image
          src="/icons/ambroisie.png"
          alt="Ambroisie"
          width={24}
          height={24}
          className={styles.currencyIcon}
        />
        <span className={styles.currencyAmount}>{userAmbroisie.toLocaleString()}</span>
      </div>

      {/* Options en haut à gauche (même logique que le compteur d'ambroisie : en dehors de
          <nav> pour ne pas hériter de son backdrop-filter) : ça laisse exactement 5 boutons
          dans la barre du bas, parfaitement symétrique autour de "Jouer". */}
      <button className={styles.settingsButton} onClick={handleOptionsClick} aria-label="Options">
        <span className={styles.navIcon}>⚙️</span>
      </button>

      {/* Quêtes et récompenses en haut à droite, sous le compteur d'ambroisie (même
          contrainte que .settingsButton/.currencyDisplay : en dehors de <nav>). */}
      <button className={styles.questsButton} onClick={handleQuestsClick} aria-label="Quêtes journalières">
        <span className={styles.navIcon}>📜</span>
      </button>
      <button className={styles.rewardsButton} onClick={handleRewardsClick} aria-label="Récompenses">
        <span className={styles.navIcon}>🎁</span>
      </button>

      {/* Barre de navigation en bas */}
      <nav className={styles.bottomNav}>
        <Link href="/shop" className={styles.navItem}>
          <Image src="/shop_icon.png" alt="Boutique" width={32} height={32} className={styles.navIconImage} />
          <span className={styles.navLabel}>Boutique</span>
        </Link>

        <Link href="/deck" className={styles.navItem}>
          <Image src="/deck_icon.png" alt="Deck" width={32} height={32} className={styles.navIconImage} />
          <span className={styles.navLabel}>Deck</span>
        </Link>

        {/* Bouton JOUER au centre de la barre : action principale, mise en avant */}
        <Link href="/play" className={styles.playButton}>
          <span className={styles.playIcon}>⚔️</span>
          <span className={styles.playLabel}>Jouer</span>
        </Link>

        <Link href="/social" className={styles.navItem}>
          <span className={styles.navIconWrapper}>
            <span className={styles.navIcon}>💬</span>
            {hasPendingFriendRequests && <span className={styles.navBadge} aria-label="Demandes d'ami en attente" />}
          </span>
          <span className={styles.navLabel}>Social</span>
        </Link>

        <Link href="/profile" className={styles.navItem}>
          <span className={styles.navIcon}>👤</span>
          <span className={styles.navLabel}>Profil</span>
        </Link>
      </nav>

      {/* Footer discret */}
      <footer className={styles.footer} style={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom))', right: '10px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', zIndex: 10 }}>
        <p>2025 GODS SERIE 1 • Aseo, Drift & Zedycuss</p>
      </footer>
    </main>
  );
}

