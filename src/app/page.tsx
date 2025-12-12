'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';

export default function Home() {
  const [showPlayModal, setShowPlayModal] = useState(false);

  const handlePlayClick = () => {
    setShowPlayModal(true);
  };

  const closePlayModal = () => {
    setShowPlayModal(false);
  };

  return (
    <main className={styles.main}>
      {/* Background animé */}
      <div className={styles.backgroundElements}>
        {Object.values(ELEMENT_SYMBOLS).map((symbol, index) => (
          <span
            key={index}
            className={styles.floatingElement}
            style={{
              left: `${10 + index * 12}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${4 + index * 0.5}s`
            }}
          >
            {symbol}
          </span>
        ))}
      </div>

      {/* Contenu principal */}
      <div className={styles.content}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.logoContainer}>
            <h1 className={styles.title}>
              <span className={styles.titleLetter}>G</span>
              <span className={styles.titleLetter}>O</span>
              <span className={styles.titleLetter}>D</span>
              <span className={styles.titleLetter}>S</span>
            </h1>
            <p className={styles.subtitle}>Le Jeu de Cartes des Dieux</p>
          </div>

          <p className={styles.description}>
            Affrontez vos adversaires dans un duel épique entre divinités.
          </p>
        </section>

        {/* Features */}
        <section className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎴</div>
            <h3>12 Dieux</h3>
            <p>Divinités uniques avec pouvoirs</p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <h3>7 Éléments</h3>
            <p>Cycle de faiblesses stratégique</p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>60 Sorts</h3>
            <p>Générateurs et compétences</p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>🏆</div>
            <h3>Classé</h3>
            <p>Grimpez dans le classement</p>
          </div>
        </section>

        {/* Actualités */}
        <section className={styles.newsSection}>
          <h2>📜 Actualités</h2>
          <div className={styles.newsCard}>
            <span className={styles.newsTag}>Nouveau</span>
            <h3>Saison 1 - Série GODS</h3>
            <p>12 dieux, 60 sorts, 7 éléments. La bataille olympienne commence !</p>
          </div>
          <Link href="/rules" className={styles.rulesLink}>
            <span>📖</span> Consulter les règles du jeu
          </Link>
        </section>
      </div>

      {/* Barre de navigation en bas */}
      <nav className={styles.bottomNav}>
        <Link href="/shop" className={styles.navItem}>
          <span className={styles.navIcon}>🏛️</span>
          <span className={styles.navLabel}>Boutique</span>
        </Link>

        <Link href="/leaderboard" className={styles.navItem}>
          <span className={styles.navIcon}>🏆</span>
          <span className={styles.navLabel}>Classement</span>
        </Link>

        {/* Bouton central JOUER */}
        <button
          className={styles.playButton}
          onClick={handlePlayClick}
        >
          <span className={styles.playIcon}>⚔️</span>
          <span className={styles.playLabel}>Jouer</span>
        </button>

        <Link href="/friends" className={styles.navItem}>
          <span className={styles.navIcon}>👥</span>
          <span className={styles.navLabel}>Amis</span>
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
        <p>2025 GODS SERIE 1 • Aseo & Drift</p>
      </footer>
    </main>
  );
}
