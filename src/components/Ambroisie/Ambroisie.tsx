import Image from 'next/image';

/**
 * Icône d'ambroisie, partout la même.
 *
 * L'ambroisie a une vraie illustration (`/icons/ambroisie.png`) — la goutte dorée qu'on voit
 * dans la barre de monnaie de l'accueil. Ailleurs, elle était parfois remplacée par un émoji
 * approchant : une goutte d'eau, un pot de miel. Ce n'est pas un détail de style — le joueur
 * croit alors qu'il gagne une AUTRE récompense que celle qu'il connaît.
 *
 * Ce composant existe pour qu'il n'y ait plus qu'un seul endroit à changer, et aucune occasion
 * de retomber dans l'à-peu-près.
 */
export default function Ambroisie({ size = 15 }: { size?: number }) {
    return (
        <Image
            src="/icons/ambroisie.png"
            alt="ambroisie"
            width={size}
            height={size}
            style={{ verticalAlign: '-2px', display: 'inline-block' }}
        />
    );
}
