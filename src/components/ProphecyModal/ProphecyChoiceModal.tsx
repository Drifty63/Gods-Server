'use client';

import React from 'react';
import ModalShell from '@/components/ModalShell/ModalShell';
import styles from './ProphecyChoiceModal.module.css';
import { ProphecyAction } from '@/types/cards';

interface ProphecyChoiceModalProps {
    isOpen: boolean;
    onSelect: (choice: ProphecyAction) => void;
    onCancel: () => void;
}

/**
 * Les trois actions prédictibles — c'est-à-dire TOUT ce qu'un joueur peut faire de son tour,
 * sans recouvrement : il joue une carte, il en défausse une, ou il ne fait rien.
 *
 * Elles étaient quatre, découpées par TYPE de carte. Il fallait alors deviner non seulement ce
 * que l'adversaire ferait, mais avec quelle sorte de carte — un pari à une chance sur quatre
 * que presque personne ne gagnait. Trois options font du pari une lecture de l'adversaire
 * plutôt qu'un tirage au sort.
 */
const CHOICES: { id: ProphecyAction; icon: string; name: string; hint: string }[] = [
    { id: 'play', icon: '🃏', name: 'Jouer une carte', hint: 'N’importe laquelle, quel qu’en soit le type' },
    { id: 'discard', icon: '♻️', name: 'Défausser', hint: 'Jeter une carte pour gagner 1 énergie' },
    { id: 'pass', icon: '⏭️', name: 'Passer son tour', hint: 'Ne rien faire du tout' },
];

export default function ProphecyChoiceModal({ isOpen, onSelect, onCancel }: ProphecyChoiceModalProps) {
    return (
        <ModalShell isOpen={isOpen} onCancel={onCancel} accentColor="#c084fc">
            <h2 className={styles.title}>🔮 Destin contrarié</h2>
            <p className={styles.description}>
                Prédisez ce que votre adversaire fera à son prochain tour. S’il le fait,
                son action est <strong>annulée</strong> : chacun de vos dieux vivants gagne
                2 boucliers et vous récupérez 1 énergie.
            </p>
            <div className={styles.grid}>
                {CHOICES.map((c) => (
                    <button key={c.id} className={styles.choiceButton} onClick={() => onSelect(c.id)}>
                        <span className={styles.icon}>{c.icon}</span>
                        <span className={styles.name}>{c.name}</span>
                        <span className={styles.hint}>{c.hint}</span>
                    </button>
                ))}
            </div>
            <p className={styles.warning}>
                Votre adversaire saura qu’une prophétie le vise, mais jamais laquelle.
            </p>
        </ModalShell>
    );
}
