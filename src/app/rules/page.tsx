'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { ELEMENT_SYMBOLS, ELEMENT_NAMES, ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import { Element } from '@/types/cards';

export default function RulesPage() {
    const elements: Element[] = ['fire', 'air', 'earth', 'lightning', 'water', 'light', 'darkness'];

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>
                    ← Retour à l&apos;accueil
                </Link>
                <h1 className={styles.title}>📖 Règles du Jeu</h1>
            </header>

            <div className={styles.content}>
                {/* Introduction */}
                <section className={styles.section}>
                    <h2>🎯 But du Jeu</h2>
                    <p>
                        Le but de <strong>GODS</strong> est de <strong>vaincre tous les dieux adverses</strong>{' '}
                        en optimisant la gestion d&apos;énergie et en exploitant les interactions élémentaires.
                    </p>
                </section>

                {/* Deck & Dieux */}
                <section className={styles.section}>
                    <h2>🎴 Deck & Dieux</h2>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.infoNumber}>20</span>
                            <span className={styles.infoLabel}>Cartes par deck</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoNumber}>4</span>
                            <span className={styles.infoLabel}>Dieux par joueur</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoNumber}>5</span>
                            <span className={styles.infoLabel}>Cartes par dieu</span>
                        </div>
                    </div>

                    <h3>Composition par dieu :</h3>
                    <ul className={styles.list}>
                        <li><strong>2 cartes Générateur</strong> - Produisent de l&apos;énergie</li>
                        <li><strong>2 cartes Compétence</strong> - Attaques et effets offensifs</li>
                        <li><strong>1 carte Utilitaire</strong> - Effets spéciaux et support</li>
                    </ul>
                </section>

                {/* Éléments */}
                <section className={styles.section}>
                    <h2>⚡ Les 7 Éléments</h2>
                    <div className={styles.elementGrid}>
                        {elements.map((element) => (
                            <div
                                key={element}
                                className={styles.elementCard}
                                style={{ borderColor: ELEMENT_COLORS[element].primary }}
                            >
                                <span className={styles.elementIcon}>{ELEMENT_SYMBOLS[element]}</span>
                                <span className={styles.elementName}>{ELEMENT_NAMES[element]}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Cycle Élémentaire */}
                <section className={styles.section}>
                    <h2>🔄 Cycle Élémentaire</h2>
                    <div className={styles.cycleContainer}>
                        <div className={styles.mainCycle}>
                            <h3>Cycle Principal</h3>
                            <div className={styles.cycleFlow}>
                                <span>🔥 Feu</span> → <span>💨 Air</span> → <span>🌿 Terre</span> →
                                <span>⚡ Foudre</span> → <span>💧 Eau</span> → <span>🔥 Feu</span>
                            </div>
                        </div>
                        <div className={styles.parallelCycle}>
                            <h3>Cycle Parallèle</h3>
                            <div className={styles.cycleFlow}>
                                <span>☀️ Lumière</span> ⚔️ <span>💀 Ténèbres</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.highlight}>
                        <strong>💥 Bonus de faiblesse :</strong> Frapper sur la faiblesse d&apos;un dieu
                        inflige <strong>des dégâts doublés !</strong>
                    </div>
                </section>

                {/* Énergie */}
                <section className={styles.section}>
                    <h2>⚡ Système d&apos;Énergie</h2>
                    <div className={styles.energyRules}>
                        <div className={styles.energyRule}>
                            <div className={styles.energyIcon}>🎮</div>
                            <div>
                                <strong>Premier joueur</strong>
                                <p>Commence avec 0 énergie</p>
                            </div>
                        </div>
                        <div className={styles.energyRule}>
                            <div className={styles.energyIcon}>⏳</div>
                            <div>
                                <strong>Second joueur</strong>
                                <p>Commence avec 1 énergie</p>
                            </div>
                        </div>
                    </div>

                    <h3>Générer de l&apos;énergie :</h3>
                    <ul className={styles.list}>
                        <li><strong>Jouer une carte générateur</strong> - Gagne l&apos;énergie indiquée</li>
                        <li><strong>Défausser une carte</strong> - Gagne +1 énergie</li>
                    </ul>
                </section>

                {/* Déroulement d'un tour */}
                <section className={styles.section}>
                    <h2>🔁 Déroulement d&apos;un Tour</h2>
                    <div className={styles.turnSteps}>
                        <div className={styles.turnStep}>
                            <div className={styles.stepNumber}>1</div>
                            <div className={styles.stepContent}>
                                <strong>Phase de Pioche</strong>
                                <p>Piochez jusqu&apos;à avoir 5 cartes en main (uniquement des cartes de vos dieux vivants)</p>
                            </div>
                        </div>
                        <div className={styles.turnStep}>
                            <div className={styles.stepNumber}>2</div>
                            <div className={styles.stepContent}>
                                <strong>Phase d&apos;Action</strong>
                                <p>Jouez une carte OU défaussez une carte pour gagner +1 énergie</p>
                            </div>
                        </div>
                        <div className={styles.turnStep}>
                            <div className={styles.stepNumber}>3</div>
                            <div className={styles.stepContent}>
                                <strong>Fin du Tour</strong>
                                <p>Le tour passe à l&apos;adversaire</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mort d'un Dieu */}
                <section className={styles.section}>
                    <h2>💀 Mort d&apos;un Dieu</h2>
                    <p>
                        Lorsque les points de vie d&apos;un dieu tombent à <strong>0 ou moins</strong>,
                        il est considéré comme mort. Toutes ses cartes (main, deck et défausse)
                        sont <strong>retirées du jeu</strong>.
                    </p>
                </section>

                {/* Fatigue */}
                <section className={styles.section}>
                    <h2>😫 Fatigue</h2>
                    <p>
                        Quand votre deck est vide, la défausse est mélangée pour former un nouveau deck.
                        À chaque recyclage, tous vos dieux vivants subissent des <strong>dégâts croissants</strong>{' '}
                        (+1, +2, +3, etc.).
                    </p>
                </section>

                {/* Effets de Statut */}
                <section className={styles.section}>
                    <h2>✨ Effets de Statut</h2>
                    <div className={styles.statusGrid}>
                        <div className={styles.statusCard}>
                            <span className={styles.statusIcon}>🧪</span>
                            <strong>Poison</strong>
                            <p>Avant chaque sort, le dieu subit des dégâts égaux aux marques de poison</p>
                        </div>
                        <div className={styles.statusCard}>
                            <span className={styles.statusIcon}>⚡</span>
                            <strong>Foudre</strong>
                            <p>+2 dégâts par marque de foudre quand elles sont retirées</p>
                        </div>
                        <div className={styles.statusCard}>
                            <span className={styles.statusIcon}>🛡️</span>
                            <strong>Bouclier</strong>
                            <p>Absorbe les dégâts avant qu&apos;ils ne touchent les points de vie</p>
                        </div>
                        <div className={styles.statusCard}>
                            <span className={styles.statusIcon}>😤</span>
                            <strong>Provocation</strong>
                            <p>Force les attaques mono-cibles à cibler ce dieu</p>
                        </div>
                        <div className={styles.statusCard}>
                            <span className={styles.statusIcon}>😵</span>
                            <strong>Stun</strong>
                            <p>Le dieu ne peut pas lancer de sorts pendant la durée</p>
                        </div>
                        <div className={styles.statusCard}>
                            <span className={styles.statusIcon}>🩸</span>
                            <strong>Saignement</strong>
                            <p>
                                Inflige ses dégâts en <strong>fin de tour</strong> et ignore le bouclier.
                                Maximum 2 marques ; chaque point de soin en retire une.
                            </p>
                        </div>
                        <div className={styles.statusCard}>
                            <span className={styles.statusIcon}>🗿</span>
                            <strong>Pétrification</strong>
                            <p>
                                Le prochain coup subi infligera <strong>+2 dégâts par marque</strong>.
                                La marque attend ce coup sans jamais expirer : seuls des dégâts reçus
                                ou un sort de purification la retirent.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className={styles.ctaSection}>
                    <Link href="/game" className={styles.playButton}>
                        ⚔️ Commencer une partie
                    </Link>
                </section>
            </div>
        </main>
    );
}
