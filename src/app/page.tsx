'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { ALL_GODS } from '@/data/gods';
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
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [currentGodIndex, setCurrentGodIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Utiliser l'ambroisie du profil ou 0 par défaut
  const userAmbroisie = profile?.ambroisie ?? 0;

  // Carrousel automatique des dieux (10 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentGodIndex((prev) => (prev + 1) % ALL_GODS.length);
        setIsTransitioning(false);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentGod = ALL_GODS[currentGodIndex];

  const handlePlayClick = () => {
    setShowPlayModal(true);
  };

  const closePlayModal = () => {
    setShowPlayModal(false);
  };

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
      setCurrentGodIndex((prev) => (prev - 1 + ALL_GODS.length) % ALL_GODS.length);
      setIsTransitioning(false);
    }, 300);
  };

  // Navigation vers le dieu suivant
  const nextGod = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentGodIndex((prev) => (prev + 1) % ALL_GODS.length);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <main className={styles.main}>
      {/* Titre centré sur la page */}
      <div className={styles.logoContainer}>
        <h1 className={styles.title}>
          <span className={styles.titleLetter}>G</span>
          <span className={styles.titleLetter}>O</span>
          <span className={styles.titleLetter}>D</span>
          <span className={styles.titleLetter}>S</span>
        </h1>
        <p className={styles.subtitle}>Le Jeu de Cartes des Dieux</p>
      </div>

      {/* Header avec boutons */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Espace vide pour équilibrer */}
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.headerButton}
            onClick={handleQuestsClick}
            title="Quêtes"
          >
            📜
          </button>
          <button
            className={styles.headerButton}
            onClick={handleRewardsClick}
            title="Récompenses"
          >
            🎁
          </button>
          <button
            className={styles.headerButton}
            onClick={handleOptionsClick}
            title="Options"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Affichage de l'Ambroisie */}
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

      {/* Contenu principal */}
      <div className={styles.content}>
        {/* Carte du dieu au centre avec carrousel */}
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
              {ALL_GODS.map((_, index) => (
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
                  aria-label={`Voir ${ALL_GODS[index].name}`}
                />
              ))}
            </div>
          </div>

          <button className={styles.carouselArrow} onClick={nextGod} aria-label="Dieu suivant">
            ›
          </button>
        </section>

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
              Présentation de l'extension <Link href="/news/death-glory" className={styles.newsLink}>Death & Glory</Link>.
            </p>
            <p className={styles.newsItem}>
              <span className={styles.newsBullet}>-</span>
              Patch 0.23 : Sortie de l'histoire de ZEUS
            </p>
          </div>
        </section>
      </div>

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

        {/* Bouton central JOUER */}
        <button
          className={styles.playButton}
          onClick={handlePlayClick}
        >
          <span className={styles.playIcon}>⚔️</span>
          <span className={styles.playLabel}>Jouer</span>
        </button>

        <Link href="/social" className={styles.navItem}>
          <span className={styles.navIcon}>💬</span>
          <span className={styles.navLabel}>Social</span>
        </Link>

        <Link href="/profile" className={styles.navItem}>
          <span className={styles.navIcon}>👤</span>
          <span className={styles.navLabel}>Profil</span>
        </Link>
      </nav>

      {/* Modal de sélection du mode de jeu */}
      {showPlayModal && (
        <div className={styles.modalOverlay} onClick={closePlayModal}>
          <div className={styles.playModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={closePlayModal}>✕</button>
            <h2>Choisir un Mode</h2>

            <div className={styles.playOptions}>
              <Link href="/online" className={styles.playOption} onClick={closePlayModal}>
                <span className={styles.optionIcon}>🌐</span>
                <div className={styles.optionInfo}>
                  <h3>En Ligne</h3>
                  <p>Affrontez des joueurs du monde entier</p>
                </div>
              </Link>

              <Link href="/game" className={styles.playOption} onClick={closePlayModal}>
                <span className={styles.optionIcon}>🤖</span>
                <div className={styles.optionInfo}>
                  <h3>Contre l'IA</h3>
                  <p>Entraînez-vous contre l'intelligence artificielle</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}



      {/* Footer discret */}
      <footer className={styles.footer}>
        <p>2025 GODS SERIE 1 • Aseo, Drift & Zedycuss</p>
      </footer>
    </main>
  );
}

