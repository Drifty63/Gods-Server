'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingRequests, countUnclaimedRewards } from '@/services/supabase-profile';
import { TUTORIAL_DONE_KEY } from '@/data/tutorial';
import { NEWS_ITEMS } from '@/data/news';

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}

function HomeContent() {
  const { profile } = useAuth();

  // Utiliser l'ambroisie du profil ou 0 par défaut
  const userAmbroisie = profile?.ambroisie ?? 0;

  // Demandes d'ami en attente : jusqu'ici, rien nulle part n'indiquait qu'une demande était
  // arrivée -- il fallait aller sur /social par réflexe pour le découvrir. Petit point rouge
  // sur l'icône Social le temps qu'on a une vraie notification.
  const [hasPendingFriendRequests, setHasPendingFriendRequests] = useState(false);

  /**
   * Récompenses en attente.
   *
   * Rien n'indiquait qu'un cadeau attendait : le calcul n'existait qu'À L'INTÉRIEUR du modal,
   * donc il fallait déjà l'avoir ouvert pour savoir qu'il fallait l'ouvrir. Un joueur pouvait
   * accumuler des récompenses sans jamais s'en douter. Simple comptage au chargement.
   */
  const [pendingRewards, setPendingRewards] = useState(0);

  /**
   * Didacticiel déjà terminé ?
   *
   * `useSyncExternalStore` plutôt qu'un effet qui poserait l'état : c'est l'outil prévu pour
   * lire une source extérieure à React sans casser le rendu serveur. Le troisième argument
   * fournit la valeur utilisée côté serveur (`localStorage` n'y existe pas), ce qui évite
   * toute divergence à l'hydratation.
   */
  const tutorialDone = useSyncExternalStore(
    // La valeur ne change pas pendant la vie de la page : rien à quoi s'abonner.
    () => () => { },
    () => {
      try {
        return window.localStorage.getItem(TUTORIAL_DONE_KEY) === '1';
      } catch {
        return false; // navigation privée ou stockage bloqué
      }
    },
    () => false,
  );
  useEffect(() => {
    if (!profile) return;
    getPendingRequests()
      .then(requests => setHasPendingFriendRequests(requests.length > 0))
      .catch(() => { });
  }, [profile]);

  // Rechargé à chaque fermeture du modal : une récompense réclamée doit faire disparaître la
  // pastille sans qu'on ait à rafraîchir la page.
  useEffect(() => {
    if (!profile) return;
    const refresh = () => { countUnclaimedRewards().then(setPendingRewards).catch(() => { }); };
    refresh();
    window.addEventListener('rewards-claimed', refresh);
    return () => window.removeEventListener('rewards-claimed', refresh);
  }, [profile]);

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

  return (
    <main className={styles.main}>
      {/* BACKGROUND EFFECTS */}
      <div className={styles.bgParticles} />

      {/*
        BARRE SUPÉRIEURE
        Options, ambroisie, quêtes et récompenses vivaient chacun en `position: fixed` avec un
        z-index de 900 : ils flottaient par-dessus le panneau d'actualités et l'illustration de
        fond, comme collés après coup. Réunis ici dans un vrai élément du flux, ils délimitent
        le haut de l'écran et le contenu commence dessous, sans plus aucun recouvrement.
      */}
      <header className={styles.topBar}>
        <button
          className={styles.topBarButton}
          onClick={handleOptionsClick}
          aria-label="Options"
        >
          <span className={styles.topBarIcon}>⚙️</span>
        </button>

        <div className={styles.topBarRight}>
          <div className={styles.currencyDisplay} title="Ambroisie">
            <Image
              src="/icons/ambroisie.png"
              alt=""
              width={22}
              height={22}
              className={styles.currencyIcon}
            />
            <span className={styles.currencyAmount}>{userAmbroisie.toLocaleString('fr-FR')}</span>
          </div>

          <button
            className={styles.topBarButton}
            onClick={handleQuestsClick}
            aria-label="Quêtes journalières"
          >
            <span className={styles.topBarIcon}>📜</span>
          </button>

          <button
            className={styles.topBarButton}
            onClick={handleRewardsClick}
            aria-label={pendingRewards > 0
              ? `Récompenses — ${pendingRewards} en attente`
              : 'Récompenses'}
          >
            <span className={styles.topBarIcon}>🎁</span>
            {pendingRewards > 0 && <span className={styles.navBadge} />}
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {/* Titre : seul au centre depuis le retrait du carrousel, il redevient l'élément fort
            de l'écran d'accueil au lieu de partager la place avec une illustration qui
            changeait toutes les dix secondes. */}
        <div className={styles.logoContainer}>
          <h1 className={styles.title}>
            <span className={styles.titleLetter}>G</span>
            <span className={styles.titleLetter}>O</span>
            <span className={styles.titleLetter}>D</span>
            <span className={styles.titleLetter}>S</span>
          </h1>
          <p className={styles.subtitle}>Le Jeu de Cartes des Dieux</p>
        </div>

        {/*
          Didacticiel, sous les actualités.
          Depuis l'accueil, un nouveau joueur n'avait aucun accès à quoi que ce soit de
          pédagogique : il fallait passer par Options → Règles, ou descendre dans la section
          « Autres » du menu Jouer. La carte se met en avant tant que le didacticiel n'a pas
          été terminé, puis s'efface discrètement.
        */}
        <Link
          href="/tutorial"
          className={`${styles.tutorialCard} ${tutorialDone ? styles.tutorialCardDone : ''}`}
        >
          <span className={styles.tutorialIcon}>🎓</span>
          <span className={styles.tutorialText}>
            <span className={styles.tutorialTitle}>
              {tutorialDone ? 'Revoir le didacticiel' : 'Nouveau ? Commencez ici'}
            </span>
            <span className={styles.tutorialSubtitle}>
              Combat guidé pour apprendre les règles et l&apos;interface
            </span>
          </span>
          <span className={styles.tutorialArrow}>›</span>
        </Link>

        {/* Section Actualités */}
        <section className={styles.newsSection}>
          <div className={styles.newsSectionHeader}>
            <span className={styles.newsIcon}>📜</span>
            <h2>Actualité</h2>
          </div>
          <div className={styles.newsContent}>
            {NEWS_ITEMS.map(item => (
              <p key={item.title} className={styles.newsItem}>
                <span className={styles.newsBullet}>-</span>
                <span>
                  <strong className={styles.newsTitle}>{item.title}</strong>
                  {' — '}
                  {item.text}
                </span>
              </p>
            ))}
          </div>
        </section>
      </div>

      {/* Barre de navigation en bas */}
      <nav className={styles.bottomNav}>
        <Link href="/shop" className={styles.navItem}>
          <Image src="/shop_icon.png" alt="" width={32} height={32} className={styles.navIconImage} />
          <span className={styles.navLabel}>Boutique</span>
        </Link>

        <Link href="/deck" className={styles.navItem}>
          <Image src="/deck_icon.png" alt="" width={32} height={32} className={styles.navIconImage} />
          <span className={styles.navLabel}>Collection</span>
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
      <footer className={styles.footer}>
        <p>2025 GODS SERIE 1 • Aseo, Drift &amp; Zedycuss</p>
      </footer>
    </main>
  );
}
