'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { getOwnedGods, getGodById } from '@/data/gods';
import { GodCard } from '@/types/cards';
import { ELEMENT_SYMBOLS } from '@/game-engine/ElementSystem';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import styles from './page.module.css';

export default function OnlineSelectPage() {
    const router = useRouter();
    const { selectGods, opponentReady, gameStartData, currentGame, isConnected, resumeGame, opponentName, error, clearError, refreshGame } = useMultiplayer();
    const { profile } = useAuth();
    const [selectedGods, setSelectedGods] = useState<GodCard[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    /*
     * Verrou SYNCHRONE de l'envoi de l'équipe.
     *
     * `submitting` est un état React : il ne change qu'à l'affichage suivant. Deux tapes dans la
     * même fraction de seconde passaient donc toutes deux le contrôle, et l'équipe partait deux
     * fois au serveur. Une référence, elle, se ferme à l'instant même où on la pose. L'état reste
     * pour l'affichage (« Confirmation… »), la référence décide.
     */
    const submitLockRef = useRef(false);
    const [hasRejoined, setHasRejoined] = useState(false);

    const isCreator = profile?.is_creator || false;
    const godsOwned = useMemo(() => profile?.gods_owned || [], [profile?.gods_owned]);

    // Filtrer les dieux selon ceux possédés par le joueur
    const availableGods = useMemo(() => getOwnedGods(godsOwned, isCreator), [godsOwned, isCreator]);

    // Decks complets (4 dieux)

    // Reprendre la session au chargement (gameId+token+isHost persistés par la page précédente)
    useEffect(() => {
        if (isConnected && !hasRejoined) {
            const gameId = sessionStorage.getItem('gameId');
            const token = sessionStorage.getItem('multiplayerToken');
            const isHost = sessionStorage.getItem('isHost') === 'true';

            if (gameId && token) {
                resumeGame(gameId, token, isHost);
                setHasRejoined(true);
            } else {
                console.error('No gameId/token found, returning to online lobby');
                router.push('/online');
            }
        }
    }, [isConnected, hasRejoined, resumeGame, router]);

    /*
     * LA NAVIGATION SUIT LE STATUT DE LA PARTIE, PAS L'ÉTAT LOCAL DE CETTE PAGE.
     *
     * Les deux redirections étaient conditionnées à `hasSubmitted`, un état React qui ne vit que
     * dans cette page. Dès qu'il restait faux alors que la partie avançait — et en Duel il le
     * restait dès que l'équipe pré-composée manquait — le joueur demeurait planté sur cet écran
     * pendant que son adversaire passait au pierre-feuille-ciseaux puis au combat. Pire : comme
     * `hasSubmitted` était faux, la page affichait la grille de sélection manuelle, celle de
     * l'Entraînement, alors que l'équipe était déjà composée et confirmée.
     *
     * `currentGame.status` vient de Postgres et décrit la partie telle qu'elle est réellement.
     * Un client qui arrive en retard, se reconnecte ou rate une notification s'y raccroche ; un
     * client qui n'a rien soumis la suit quand même, au lieu de rester seul derrière.
     */
    const status = currentGame?.status;

    /*
     * Cet écran relit lui-même la partie toutes les deux secondes.
     *
     * Toutes les pages du mode en ligne ouvrent leur canal temps réel sous le MÊME nom
     * (`game:<id>`) — c'est indispensable à la présence, qui fait se voir les deux joueurs. Mais
     * en passant d'une page à l'autre, la page qu'on quitte peut, en se démontant, retirer le canal
     * que la nouvelle vient de reprendre. L'ordre de montage et de démontage varie d'une navigation
     * à l'autre : d'où un enchaînement qui marchait parfois et se figeait parfois sur « En attente
     * de … », alors que le serveur était déjà passé au pierre-feuille-ciseaux.
     *
     * Une relecture ne dépend d'aucun canal. Elle s'arrête d'elle-même quand l'écran se démonte,
     * c'est-à-dire dès que la navigation qu'elle déclenche a eu lieu.
     */
    useEffect(() => {
        if (!hasRejoined) return;
        const poll = setInterval(() => { refreshGame(); }, 2000);
        return () => clearInterval(poll);
    }, [hasRejoined, refreshGame]);

    useEffect(() => {
        if (status !== 'rps' && status !== 'rps_deciding') return;
        if (currentGame?.isHost !== undefined) {
            sessionStorage.setItem('isHost', String(currentGame.isHost));
        }
        router.push('/online/rps');
    }, [status, currentGame?.isHost, router]);

    useEffect(() => {
        if (!gameStartData) return;
        sessionStorage.setItem('multiplayerData', JSON.stringify(gameStartData));
        sessionStorage.setItem('isHost', String(currentGame?.isHost ?? false));
        if (currentGame?.gameId) sessionStorage.setItem('gameId', currentGame.gameId);
        router.push('/online/game');
    }, [gameStartData, currentGame?.isHost, currentGame?.gameId, router]);

    // La partie s'est terminée avant d'avoir commencé (abandon de l'adversaire) : retour au salon.
    useEffect(() => {
        if (status === 'finished') router.push('/online');
    }, [status, router]);

    /*
     * Mode DUEL : l'équipe est déjà composée et payée en points, cet écran ne fait que la
     * confirmer. S'il ne la retrouve pas, il ne faut SURTOUT pas retomber sur la grille manuelle
     * — elle ignore le budget du Duel et laisserait composer n'importe quoi. On le dit, et on
     * renvoie le joueur recomposer.
     */
    const isDuel = typeof window !== 'undefined' && sessionStorage.getItem('gameMode') === 'duel';
    const [duelTeamMissing, setDuelTeamMissing] = useState(false);

    useEffect(() => {
        if (!isDuel || !hasRejoined || hasSubmitted || !currentGame) return;

        let gods: GodCard[] = [];
        try {
            const saved = JSON.parse(sessionStorage.getItem('selectedGods') || '[]') as string[];
            gods = saved.map(id => getGodById(id)).filter((g): g is GodCard => g !== undefined);
        } catch {
            gods = [];
        }

        if (gods.length < 2) { setDuelTeamMissing(true); return; }

        // Même verrou que la confirmation manuelle : en développement, React exécute les effets
        // deux fois au montage, et cette auto-confirmation enverrait l'équipe en double.
        if (submitLockRef.current) return;
        submitLockRef.current = true;

        setSelectedGods(gods);
        selectGods(gods);
        setHasSubmitted(true);
    }, [isDuel, hasRejoined, hasSubmitted, currentGame, selectGods]);

    const handleSelectGod = (god: GodCard) => {
        if (hasSubmitted) return;

        if (selectedGods.some(g => g.id === god.id)) {
            setSelectedGods(selectedGods.filter(g => g.id !== god.id));
        } else if (selectedGods.length < 4) {
            setSelectedGods([...selectedGods, god]);
        }
    };

    /*
     * `hasSubmitted` ne passe à vrai QUE si le serveur a accepté.
     *
     * Il était posé sans attendre la réponse : un refus laissait donc le joueur sur l'écran
     * « En attente de l'adversaire… » pour toujours, alors que son équipe n'était jamais partie.
     * Avec le refus désormais visible, il peut réessayer.
     */
    const handleConfirm = async () => {
        if (selectedGods.length !== 4 || submitLockRef.current) return;
        submitLockRef.current = true;
        setSubmitting(true);
        const ok = await selectGods(selectedGods);
        setSubmitting(false);
        if (ok) setHasSubmitted(true);
        // Refusé : on rouvre le verrou pour que le joueur puisse réessayer.
        else submitLockRef.current = false;
    };


    const savedOpponentName = typeof window !== 'undefined' ? sessionStorage.getItem('opponentName') : null;
    const displayOpponentName = opponentName || savedOpponentName || 'Adversaire';

    // Équipe de Duel introuvable : on ne propose pas de la recomposer ici, le budget ne s'y
    // applique pas. On renvoie à l'écran qui sait le faire.
    if (isDuel && duelTeamMissing) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>⚔️ Équipe introuvable</h1>
                    <p className={styles.subtitle}>
                        Votre équipe de Duel n&apos;a pas été retrouvée — elle a pu être perdue en
                        rechargeant la page.
                    </p>
                </header>
                <div className={styles.actions}>
                    <button className={styles.confirmButton} onClick={() => router.push('/duel')}>
                        Recomposer mon équipe
                    </button>
                </div>
            </div>
        );
    }

    // Duel, équipe retrouvée : rien à choisir, on attend l'adversaire.
    if (isDuel) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>⚔️ Duel</h1>
                    <p className={styles.subtitle}>
                        Partie contre <span className={styles.opponentName}>{displayOpponentName}</span>
                    </p>
                </header>
                {/* L'auto-confirmation du Duel est silencieuse par nature : si le serveur la
                    refuse, c'est le SEUL endroit où le joueur peut l'apprendre. */}
                {error && (
                    <div className={styles.errorBanner}>
                        <span>⚠️ {error}</span>
                        <button onClick={clearError}>✕</button>
                    </div>
                )}
                <div className={styles.actions}>
                    <div className={styles.waitingSpinner}>
                        <div className={styles.spinner}></div>
                        <p>
                            {hasSubmitted
                                ? `Équipe confirmée. En attente de ${displayOpponentName}...`
                                : 'Confirmation de votre équipe...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>⚔️ Sélection des Dieux</h1>
                <p className={styles.subtitle}>
                    Partie contre <span className={styles.opponentName}>{displayOpponentName}</span>
                </p>
            </header>

            {/* Un refus du serveur doit se VOIR. Sans cette bannière, un « Confirmer » refusé
                ne produisait rien d'autre que le son du bouton. */}
            {error && (
                <div className={styles.errorBanner}>
                    <span>⚠️ {error}</span>
                    <button onClick={clearError}>✕</button>
                </div>
            )}

            <div className={styles.statusBar}>
                <span className={styles.counter}>
                    {selectedGods.length}/4 sélectionnés
                </span>
                {!isConnected && (
                    <span className={styles.connectingStatus}>🔄 Connexion...</span>
                )}
                {opponentReady && !hasSubmitted && (
                    <span className={styles.opponentStatus}>✅ {displayOpponentName} est prêt</span>
                )}
                {hasSubmitted && !opponentReady && (
                    <span className={styles.waitingStatus}>⏳ En attente de {displayOpponentName}...</span>
                )}
            </div>

            {/* Grille de sélection manuelle */}
            {(
                <div className={styles.godsGrid}>
                    {availableGods.map((god) => {
                        const isSelected = selectedGods.some(g => g.id === god.id);
                        const elementSymbol = ELEMENT_SYMBOLS[god.element] || '⚪';

                        return (
                            <div
                                key={god.id}
                                className={`${styles.godCard} ${isSelected ? styles.selected : ''} ${hasSubmitted ? styles.disabled : ''}`}
                                onClick={() => handleSelectGod(god)}
                            >
                                <div className={styles.godImage}>
                                    <Image
                                        src={god.imageUrl}
                                        alt={god.name}
                                        fill
                                        className={styles.godImg}
                                        sizes="120px"
                                    />
                                </div>
                                <div className={styles.godInfo}>
                                    <h3>{god.name.split(',')[0]}</h3>
                                    <p className={styles.godElement}>{elementSymbol} {god.element}</p>
                                    <p className={styles.godHealth}>❤️ {god.maxHealth}</p>
                                </div>
                                {isSelected && (
                                    <div className={styles.selectedBadge}>
                                        {selectedGods.findIndex(g => g.id === god.id) + 1}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={styles.actions}>
                {!hasSubmitted ? (
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={selectedGods.length !== 4 || !isConnected || !hasRejoined || submitting}
                    >
                        {submitting ? 'Confirmation...' : '✅ Confirmer la sélection'}
                    </button>
                ) : (
                    <div className={styles.waitingSpinner}>
                        <div className={styles.spinner}></div>
                        <p>En attente de {displayOpponentName}...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
