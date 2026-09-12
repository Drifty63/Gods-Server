/**
 * Contenu du panneau « Actualité » de l'accueil.
 *
 * Extrait du JSX de la page pour qu'il se modifie sans toucher au code : c'est le seul endroit
 * du jeu où l'on s'adresse directement au joueur entre deux parties, et il change souvent.
 *
 * Il n'y a volontairement pas de source de données distante : une table de plus pour trois
 * phrases n'apporterait rien tant que les mises à jour passent par un déploiement.
 */

export interface NewsItem {
    /** Titre court, mis en avant. */
    title: string;
    /** Corps du message. Une idée par entrée. */
    text: string;
}

export const NEWS_ITEMS: NewsItem[] = [
    {
        title: 'Les saisons sont là',
        text: "Chaque mois ouvre une nouvelle saison. À sa clôture, les classements repartent de zéro — mais rien n'est perdu : le palmarès de chaque saison reste consultable dans l'onglet Classement.",
    },
    {
        title: 'Trois classements distincts',
        text: "Partie Classée, Duel 13 points et Duel illimité ont chacun leur tableau. Les équipes n'y sont pas composées sous les mêmes contraintes : les mélanger n'aurait rien appris à personne.",
    },
    {
        title: 'Cinq matchs de placement',
        text: 'Vos cinq premiers matchs dans un classement comptent double, à la victoire comme à la défaite, et votre rang reste masqué tant qu’ils ne sont pas joués. De quoi vous situer vite, sans vingt parties de montée.',
    },
    {
        title: 'Récompenses de fin de saison',
        text: "Dès 1000 téléchargements, les 50 premiers de chaque classement recevront un Pass Divin mensuel. D'ici là, les saisons tournent et les palmarès s'accumulent.",
    },
];
