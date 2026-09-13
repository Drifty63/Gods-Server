'use client';

import Link from 'next/link';
import styles from './BackButton.module.css';

interface BackButtonProps {
    /** Destination du retour. Fournir `href` OU `onClick`, jamais les deux. */
    href?: string;
    /** Action de fermeture, pour les vues qui ne sont pas des pages (modales, zoom). */
    onClick?: () => void;
    /** Libellé lu par les lecteurs d'écran. Le chevron seul ne dit rien. */
    label?: string;
}

/**
 * Retour ancré au viewport, en miroir de la roue des paramètres.
 *
 * Existe parce que le même besoin revenait dans quatre écrans avec quatre implémentations
 * différentes — et aucune ne tombait au niveau de la roue, puisqu'elles étaient toutes en flux
 * dans un en-tête. Voir le commentaire du module CSS pour le détail de l'alignement.
 */
export default function BackButton({ href, onClick, label = 'Retour' }: BackButtonProps) {
    if (href) {
        return (
            <Link href={href} className={styles.backButton} aria-label={label}>
                <span aria-hidden="true">‹</span>
            </Link>
        );
    }

    return (
        <button type="button" className={styles.backButton} onClick={onClick} aria-label={label}>
            <span aria-hidden="true">‹</span>
        </button>
    );
}
