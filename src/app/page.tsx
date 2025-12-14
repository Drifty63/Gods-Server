'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { ALL_GODS } from '@/data/gods';

export default function Home() {
  const [showPlayModal, setShowPlayModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [currentGodIndex, setCurrentGodIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userCoins] = useState(2300); // TODO: Connecter au store utilisateur

  // Audio states
  const [menuVolume, setMenuVolume] = useState(0.3);
  const [battleVolume, setBattleVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const battleAudioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Charger les volumes depuis localStorage au montage
  useEffect(() => {
    const savedMenuVolume = localStorage.getItem('menuVolume');
    const savedBattleVolume = localStorage.getItem('battleVolume');
    const savedMuted = localStorage.getItem('isMuted');

    if (savedMenuVolume) setMenuVolume(parseFloat(savedMenuVolume));
    if (savedBattleVolume) setBattleVolume(parseFloat(savedBattleVolume));
    if (savedMuted) setIsMuted(savedMuted === 'true');
  }, []);

  // Initialiser les pistes audio
  useEffect(() => {
    menuAudioRef.current = new Audio('/audio/menu_theme.mp3');
    menuAudioRef.current.loop = true;
    menuAudioRef.current.volume = menuVolume;

    battleAudioRef.current = new Audio('/audio/battle_theme.mp3');
    battleAudioRef.current.loop = true;
    battleAudioRef.current.volume = battleVolume;

    return () => {
      if (menuAudioRef.current) {
        menuAudioRef.current.pause();
        menuAudioRef.current = null;
      }
      if (battleAudioRef.current) {
        battleAudioRef.current.pause();
        battleAudioRef.current = null;
      }
    };
  }, []);

  // Écouter la première interaction utilisateur pour débloquer l'audio
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        // Démarrer la musique menu
        if (menuAudioRef.current && !isMuted) {
          menuAudioRef.current.play().catch(console.log);
        }
      }
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [hasInteracted, isMuted]);

  // Appliquer le mute/unmute
  useEffect(() => {
    if (menuAudioRef.current) {
      menuAudioRef.current.muted = isMuted;
    }
    if (battleAudioRef.current) {
      battleAudioRef.current.muted = isMuted;
    }
    localStorage.setItem('isMuted', String(isMuted));
  }, [isMuted]);

  // Appliquer le volume du menu
  useEffect(() => {
    if (menuAudioRef.current) {
      menuAudioRef.current.volume = menuVolume;
    }
    localStorage.setItem('menuVolume', String(menuVolume));
  }, [menuVolume]);

  // Appliquer le volume du combat
  useEffect(() => {
    if (battleAudioRef.current) {
      battleAudioRef.current.volume = battleVolume;
    }
    localStorage.setItem('battleVolume', String(battleVolume));
  }, [battleVolume]);

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
    setShowOptionsModal(true);
  };

  const closeOptionsModal = () => {
    setShowOptionsModal(false);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    // Si on unmute, relancer la musique menu
    if (!newMuted && menuAudioRef.current && hasInteracted) {
      menuAudioRef.current.play().catch(console.log);
    }
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
      {/* Header avec titre et boutons */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* Espace vide pour équilibrer */}
        </div>

        <div className={styles.logoContainer}>
          <h1 className={styles.title}>
            <span className={styles.titleLetter}>G</span>
            <span className={styles.titleLetter}>O</span>
            <span className={styles.titleLetter}>D</span>
            <span className={styles.titleLetter}>S</span>
          </h1>
          <p className={styles.subtitle}>Le Jeu de Cartes des Dieux</p>
        </div>

        <div className={styles.headerRight}>
          <Link href="/rewards" className={styles.headerButton} title="Récompenses">
            🎁
          </Link>
          <button
            className={styles.headerButton}
            onClick={handleOptionsClick}
            title="Options"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Affichage des pièces */}
      <div className={styles.currencyDisplay}>
        <span className={styles.currencyAmount}>{userCoins.toLocaleString()}</span>
        <span className={styles.currencyIcon}>🪙</span>
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
                  src={currentGod.imageUrl}
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
          <span className={styles.navIcon}>🏛️</span>
          <span className={styles.navLabel}>Boutique</span>
        </Link>

        <Link href="/quests" className={styles.navItem}>
          <span className={styles.navIcon}>📯</span>
          <span className={styles.navLabel}>Quête</span>
        </Link>

        {/* Bouton central JOUER */}
        <button
          className={styles.playButton}
          onClick={handlePlayClick}
        >
          <span className={styles.playIcon}>⚔️</span>
          <span className={styles.playLabel}>Jouer</span>
        </button>

        <Link href="/deck" className={styles.navItem}>
          <span className={styles.navIcon}>📦</span>
          <span className={styles.navLabel}>Deck</span>
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

      {/* Modal des Options */}
      {showOptionsModal && (
        <div className={styles.modalOverlay} onClick={closeOptionsModal}>
          <div className={styles.optionsModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={closeOptionsModal}>✕</button>
            <h2>⚙️ Options</h2>

            <div className={styles.optionsContent}>
              {/* Section Audio */}
              <div className={styles.optionsSection}>
                <h3 className={styles.optionsSectionTitle}>
                  <span>🔊</span> Audio
                </h3>

                {/* Bouton Mute global */}
                <div className={styles.muteToggle}>
                  <span>Musique</span>
                  <button
                    className={`${styles.toggleButton} ${!isMuted ? styles.toggleActive : ''}`}
                    onClick={toggleMute}
                  >
                    {isMuted ? '🔇 Désactivée' : '🔊 Activée'}
                  </button>
                </div>

                {/* Volume Menu */}
                <div className={styles.volumeControl}>
                  <label className={styles.volumeLabel}>
                    <span className={styles.volumeIcon}>🎵</span>
                    Musique Menu
                  </label>
                  <div className={styles.volumeSliderContainer}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={menuVolume}
                      onChange={(e) => setMenuVolume(parseFloat(e.target.value))}
                      className={styles.volumeSlider}
                    />
                    <span className={styles.volumeValue}>{Math.round(menuVolume * 100)}%</span>
                  </div>
                </div>

                {/* Volume Combat */}
                <div className={styles.volumeControl}>
                  <label className={styles.volumeLabel}>
                    <span className={styles.volumeIcon}>⚔️</span>
                    Musique Combat
                  </label>
                  <div className={styles.volumeSliderContainer}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={battleVolume}
                      onChange={(e) => setBattleVolume(parseFloat(e.target.value))}
                      className={styles.volumeSlider}
                    />
                    <span className={styles.volumeValue}>{Math.round(battleVolume * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Section Compte */}
              <div className={styles.optionsSection}>
                <h3 className={styles.optionsSectionTitle}>
                  <span>👤</span> Compte
                </h3>
                <Link href="/profile" className={styles.optionLink} onClick={closeOptionsModal}>
                  Gérer mon profil
                </Link>
              </div>

              {/* Section À propos */}
              <div className={styles.optionsSection}>
                <h3 className={styles.optionsSectionTitle}>
                  <span>ℹ️</span> À propos
                </h3>
                <p className={styles.versionText}>GODS - Série 1 • Version 0.24</p>
                <p className={styles.creditsText}>Développé par Aseo & Drift</p>
              </div>
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
