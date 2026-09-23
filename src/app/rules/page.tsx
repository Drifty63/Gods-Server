'use client';

import Link from 'next/link';
import BackButton from '@/components/BackButton/BackButton';
import styles from './page.module.css';
import { ELEMENT_SYMBOLS, ELEMENT_NAMES, ELEMENT_COLORS } from '@/game-engine/ElementSystem';
import { Element, StatusEffect } from '@/types/cards';
import { STATUS_ICONS } from '@/data/statusIcons';

/**
 * Ce que chaque statut fait, en français de joueur.
 *
 * L'ICÔNE ne vient PAS d'ici : elle est lue dans STATUS_ICONS, la table qu'utilise le plateau
 * de combat. Cette page en avait recopié trois à la main, et elles avaient divergé depuis : le
 * poison y montrait 🧪 quand le combat montre ☠️, la provocation 😤 contre 🎯,
 * l'étourdissement 😵 contre 💫. La page censée APPRENDRE les symboles en enseignait trois faux.
 * Elle faisait déjà bien ce travail pour les éléments (ELEMENT_SYMBOLS) — elle le fait
 * maintenant aussi pour les statuts.
 *
 * Le type `Record<StatusEffect, …>` est l'autre moitié du garde-fou : ajouter un statut à
 * l'union casse la compilation tant qu'il n'est pas décrit ici. Saignement, pétrification et
 * brûlure étaient restés des mois sans documentation, faute exactement de ce rappel.
 */
const STATUS_RULES: Record<StatusEffect, { name: string; text: string }> = {
    poison: {
        name: 'Poison',
        text: 'Avant chaque sort, le dieu subit des dégâts égaux à ses marques de poison. Un dieu qui n\'agit pas ne les paie jamais',
    },
    bleed: {
        name: 'Saignement',
        text: '1 dégât par marque en fin de tour, qui ignore le bouclier. 2 marques au maximum, et un soin le referme',
    },
    petrify: {
        name: 'Pétrification',
        text: 'Étourdit un tour, puis chaque marque ajoute +1 dégât à tous les sorts reçus. Ne s\'efface jamais seule : seul un nettoyage la retire',
    },
    burn: {
        name: 'Brûlure',
        text: '+1 dégât par marque, mais uniquement pour les sorts de feu. Sans limite de cumul, et un soin l\'éteint',
    },
    lightning: {
        name: 'Foudre',
        text: '+2 dégâts par marque de foudre au moment où elles sont retirées',
    },
    shield: {
        name: 'Bouclier',
        text: 'Absorbe les dégâts avant qu\'ils ne touchent les points de vie. Plusieurs boucliers s\'additionnent',
    },
    regen: {
        name: 'Régénération',
        text: 'Rend en fin de tour autant de points de vie que de marques. En s\'appliquant, elle retire le poison',
    },
    provocation: {
        name: 'Provocation',
        text: 'Force les attaques mono-cibles adverses à cibler ce dieu',
    },
    stun: {
        name: 'Étourdissement',
        text: 'Le dieu ne peut lancer aucun sort pendant la durée',
    },
    untargetable: {
        name: 'Inciblable',
        text: 'L\'adversaire ne peut plus le désigner, et les attaques de zone ne l\'atteignent pas. Ses alliés peuvent toujours le soigner',
    },
    weakness: {
        name: 'Faiblesse',
        text: 'Ajoute une seconde faiblesse élémentaire, en plus de celle du dieu, pendant la durée',
    },
    weakness_immunity: {
        name: 'Immunité',
        text: 'Le dieu n\'a plus aucune faiblesse élémentaire pendant la durée',
    },
};

export default function RulesPage() {
    const elements: Element[] = ['fire', 'air', 'earth', 'lightning', 'water', 'light', 'darkness'];

    return (
        <main className={styles.main}>
            <BackButton href="/play" label="Retour aux modes de jeu" />

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
                                <p>Jouez une carte OU défaussez : autant de cartes que vous voulez, mais l&apos;énergie n&apos;est gagnée qu&apos;une seule fois par tour (+1)</p>
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
                        {(Object.keys(STATUS_RULES) as StatusEffect[]).map(key => (
                            <div key={key} className={styles.statusCard}>
                                <span className={styles.statusIcon}>{STATUS_ICONS[key]}</span>
                                <strong>{STATUS_RULES[key].name}</strong>
                                <p>{STATUS_RULES[key].text}</p>
                            </div>
                        ))}
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
