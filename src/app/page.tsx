'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { ALL_GODS, getVisibleGods } from '@/data/gods';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';

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

  const currentGod = visibleGods[currentGodIndex];



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

  // Navigation vers le dieu précédent
  const prevGod = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentGodIndex((prev) => (prev - 1 + visibleGods.length) % visibleGods.length);
      setIsTransitioning(false);
    }, 300);
  };

  // Navigation vers le dieu suivant
  const nextGod = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentGodIndex((prev) => (prev + 1) % visibleGods.length);
      setIsTransitioning(false);
    }, 300);
  };

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
                Présentation de l'extension Death & Glory.
              </p>
              <p className={styles.newsItem}>
                <span className={styles.newsBullet}>-</span>
                Patch 0.23 : Sortie de l'histoire de ZEUS
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

            <div className={`${styles.godCardWrapper} ${isTransitioning ? styles.transitioning : ''}`}>
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
              <div className={styles.godCardIndicators}>
                {visibleGods.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentGodIndex ? styles.activeIndicator : ''}`}
                    onClick={() => {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentGodIndex(index);
                        setIsTransitioning(false);
                      }, 300);
                    }}
                    aria-label={`Voir ${visibleGods[index].name}`}
                  />
                ))}
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
          <span className={styles.navIcon}>💬</span>
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

