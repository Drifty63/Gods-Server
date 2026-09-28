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
 * Les quatre actions prédictibles — c'est-à-dire TOUT ce qu'un joueur peut faire de son tour.
 *
 * L'énumération est exhaustive à dessein : le pari doit être un vrai choix entre des options
 * qui couvrent le champ des possibles, sinon prédire reviendrait à cocher la seule case
 * plausible. Les trois types de carte, plus la défausse contre énergie.
 */
const CHOICES: { id: ProphecyAction; icon: string; name: string; hint: string }[] = [
    { id: 'generator', icon: '🟢', name: 'Générateur', hint: 'Une carte qui produit de l’énergie' },
    { id: 'competence', icon: '⚔️', name: 'Compétence', hint: 'Une attaque ou un effet offensif' },
    { id: 'utility', icon: '🛡️', name: 'Utilitaire', hint: 'Bouclier, soin, provocation…' },
    { id: 'discard', icon: '♻️', name: 'Défausse', hint: 'Jeter une carte pour gagner 1 énergie' },
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
