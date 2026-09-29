import { DialogueLine } from '@/types/story';

/**
 * CHAPITRE 3 — L'EXPÉDITION
 *
 * Dans un fichier à part, et non à la suite des 4 000 lignes de `dialogues.ts` : le chapitre
 * comptera quatre combats, et tout écrire au même endroit rendrait le fichier illisible. Il est
 * réexporté par `dialogues.ts`, donc les tests qui balaient tous les dialogues le voient aussi.
 *
 * Neuf personnages voyagent désormais ensemble — Zeus, Hestia, Aphrodite, Dionysos, Apollon,
 * Déméter, Artémis, Athéna et Ulysse.
 */

// ============================================================
// COMBAT 1 — LE CHANT DES RÉCIFS
// ============================================================

/** Scène 1 : l'embarquement, au port du Pirée. Narration seule. */
export const CH3_BATTLE1_DEPARTURE: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La nuit sur Athènes fut douce, et sans présage. Aucun songe envoyé des Enfers, aucune ombre aux fenêtres. Pour la première fois depuis la chute de l'Olympe, les dieux ont dormi.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "L'aube se lève sur le port du Pirée. L'air sent le sel, le goudron chaud et le bois mouillé. Les mouettes crient au-dessus des mâts.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Sur le quai, neuf silhouettes attendent. Aucune n'est en retard. Pas même Dionysos, ce qui, de l'avis d'Apollon, constitue à lui seul un présage favorable.",
        emotion: 'happy'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Devant eux, un navire aux flancs sombres et à la voile reprisée. Rien d'un vaisseau divin : une coque de marin, choisie par un marin.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ulysse monte le premier. Il pose la main sur le bastingage comme on salue un vieil ami, puis se tourne vers les dieux et leur fait signe d'embarquer.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les amarres tombent. La coque quitte le quai. Le voyage vers le cap Ténare commence.",
        emotion: 'determined'
    }
];

/** Scène 2 : sur le pont, Ulysse détaille l'itinéraire aux neuf. */
export const CH3_BATTLE1_BRIEFING: DialogueLine[] = [
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*déroule une carte usée sur un tonneau* Approchez. Tous. Je veux que chacun sache où nous allons, et ce qui nous attend. Un équipage qui découvre le danger en le rencontrant est un équipage mort.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*croise les bras* Parle, mortel. C'est ton navire et ta route.",
        emotion: 'neutral'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*pose le doigt sur la carte* Notre but : le cap Ténare, la porte des Enfers. Mais avant lui, il faut trouver Poséidon, et Poséidon ne se laisse pas trouver.",
        emotion: 'neutral'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "D'abord, ce que nous NE ferons PAS. Nous ne passerons pas par le détroit de Messine.",
        emotion: 'determined'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*fronce les sourcils* Pourtant c'est la route la plus directe.",
        emotion: 'surprised'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "C'est la route la plus directe vers le fond. D'un côté Charybde, qui avale la mer et tout ce qui flotte dessus. De l'autre Scylla.",
        emotion: 'worried'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*voix plus basse* J'y suis passé. J'y ai laissé six hommes. Je les ai entendus m'appeler par mon nom pendant qu'elle les emportait. Je n'y retournerai pas.",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*doucement* Alors nous n'y retournerons pas.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*hoche la tête* Nous éviterons aussi les îles boisées du sud. Elles ont l'air accueillantes, avec leurs forêts et leurs sources. C'est précisément le problème.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*intéressée* Qu'y a-t-il dans ces forêts ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "Tout ce qui a fui les hommes depuis mille ans. Et rien de tout cela n'a envie de discuter.",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*lève une main* Donc : pas de monstre marin, pas de forêt hostile. J'aime beaucoup ce voyage. Continue.",
        emotion: 'happy'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*fait glisser son doigt sur la carte* Les premiers jours seront calmes. Vent portant, mer basse, aucune terre hostile. Reposez-vous : c'est un ordre de marin, pas une invitation.",
        emotion: 'neutral'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*son doigt s'arrête* Et puis il y a ceci. Les îles rocheuses.",
        emotion: 'worried'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*penche la tête* Ce nom ne me dit rien de bon, et j'ai un excellent instinct pour ces choses-là.",
        emotion: 'worried'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "Le repaire des sirènes. Des récifs à fleur d'eau, des courants qui changent sans prévenir, des passages où l'on ne tient pas à deux navires. On y navigue au pouce et à l'oreille.",
        emotion: 'worried'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*hausse la voix* Et tu comptes nous y conduire ?!",
        emotion: 'angry'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*calme* C'est moi qui l'ai validé, père.",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Le contourner nous coûterait trois semaines. Le traverser nous en coûte deux jours. Et nous n'avons pas trois semaines : chaque jour qui passe, Hadès s'enracine un peu plus sur ton trône.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*sourcils froncés* Le gain est extraordinaire, je te l'accorde. Le risque aussi.",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*se tourne vers Déméter* Le risque est moindre que tu ne le crois. Ma tante, dis-leur.",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*surprise* Moi ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Perséphone passait ses printemps dans ces récifs. Elle chantait avec les sirènes. Elles la laissaient s'asseoir parmi elles, ce qu'elles n'ont jamais accordé à personne d'autre.",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Et parce qu'elles aimaient la fille, elles étaient en paix avec la mère. Déméter est la seule d'entre nous que les sirènes aient jamais saluée.",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*regarde la mer* C'était vrai. Je ne sais pas si ça l'est encore.",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Je ne les ai pas revues depuis des années, Athéna. Depuis que ma fille est aux Enfers. Elles chantaient pour elle, pas pour moi.",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*serre son écharpe* Espérons qu'elles se souviennent. Espérons seulement.",
        emotion: 'worried'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*se racle la gorge* Puisque nous parlons d'espérer... il y a autre chose.",
        emotion: 'worried'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*soupire* Il y a toujours autre chose.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "Les marins qui reviennent de là-bas — les rares — racontent que les harpies s'installent dans les îles rocheuses. Par dizaines.",
        emotion: 'worried'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*sèche* Impossible. Les harpies nichent sur les îlots isolés, loin de tout. Elles ne se mêlent à rien, pas même entre elles.",
        emotion: 'surprised'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "C'est exactement ce que je me suis dit. C'est pour ça que je vous le rapporte plutôt que de le garder pour moi.",
        emotion: 'neutral'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*rassurant* Et si c'était vrai, ce ne changerait rien. Les harpies n'ont jamais reconnu qu'une seule autorité.",
        emotion: 'happy'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*désigne Zeus* La sienne. Un mot de mon père et elles se posent. C'est le seul dieu qu'elles respectent, et elles le respectent depuis toujours.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*un demi-sourire* Les harpies obéissent à la foudre. Elles volent, et le ciel m'appartient. Ce n'est pas du respect, c'est de la géographie.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*soulagée* Alors nous avons Déméter pour les sirènes et Zeus pour les harpies. C'est presque rassurant.",
        emotion: 'happy'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*ne sourit pas* Presque.",
        emotion: 'worried'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*fait glisser son doigt plus loin sur la carte* Une fois les récifs derrière nous, nous mettons le cap ici. Les îles sauvages. Le pays des Cyclopes.",
        emotion: 'neutral'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*porte la main à sa bouche* Oh non.",
        emotion: 'worried'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*repose sa coupe* Attends. Attends. Les Cyclopes ? Les fils de Poséidon, les Cyclopes ?",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*pâlit* Ulysse... dis-moi que nous allons seulement les croiser.",
        emotion: 'worried'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*soutient son regard* Non.",
        emotion: 'determined'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "Poséidon ne répond à aucune prière, à aucun sacrifice, à aucune ambassade. Il ne répond qu'à une chose : la douleur des siens.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "Pour le trouver, nous allons devoir blesser des Cyclopes. Peut-être en tuer. Je préfère le dire ici, à voix haute, plutôt que de vous le faire découvrir là-bas.",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*horrifiée* C'est monstrueux.",
        emotion: 'sad'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*sans détourner les yeux* Oui. Et c'est la seule porte qui s'ouvre.",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*silence, puis* ...Poséidon ne pardonnera jamais.",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*se tourne vers Ulysse* Il ne pardonnera pas, et il ne se contentera pas de nous affronter, nous. C'est toi qu'il voudra.",
        emotion: 'worried'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Un dieu n'a pas le droit de frapper un mortel de sa propre main. C'est la loi. Cette fois, il la transgressera.",
        emotion: 'determined'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*calme* Je sais. Il attend ce moment depuis vingt ans.",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Alors préparons-nous. Vous ne connaissez pas Poséidon en colère. Moi si.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Il ne se maîtrise plus. Il devient la mer elle-même : une tempête sans rive, sans fond et sans fin. Le chaos, le mal à l'état pur.",
        emotion: 'worried'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*plus bas* J'ai vu Hadès en fureur. Ce n'est rien à côté. Hadès calcule, même quand il hurle. Poséidon, lui, ne calcule plus rien.",
        emotion: 'worried'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*inquiet* Alors comment veux-tu lui parler ?",
        emotion: 'worried'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "On ne parle pas à une tempête. On l'épuise. Il faudra le contenir par la force jusqu'à ce qu'il retrouve ses esprits — et alors, seulement alors, il nous écoutera.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*lentement* Battre mon frère pour qu'il accepte de m'aider. Voilà donc où j'en suis.",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*ferme* C'est le prix. Nous le paierons.",
        emotion: 'determined'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*roule la carte* Voilà. Vous savez tout ce que je sais. À partir de maintenant, plus personne sur ce pont ne sera surpris.",
        emotion: 'determined'
    }
];

/** Scène 3 : courte transition, fin de journée. Le calme avant la tempête. */
export const CH3_BATTLE1_EVENING: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le soleil descend dans la mer. Le vent est tombé, la coque avance à peine. Sur le pont, on a sorti du pain et du fromage.",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*allongé sur le pont* Je dois l'avouer : je m'attendais à pire. Trois jours de mer et pas un monstre. C'est presque décevant.",
        emotion: 'happy'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*sans lever les yeux de son arc* Dis-le plus fort. Quelque chose finira par t'entendre.",
        emotion: 'neutral'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*regarde l'horizon* Il y a une chose que personne ne dit jamais des voyages en mer : c'est beau. Regardez-moi cette lumière.",
        emotion: 'happy'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*accorde sa lyre* Si tu veux, je mets ça en musique.",
        emotion: 'happy'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*sourit* Fais donc. Un feu, un repas, de la musique — pour une soirée, on pourrait presque se croire chez nous.",
        emotion: 'happy'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*assise à l'écart, contre le bastingage* ...",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*s'assoit près d'elle* Tu penses à elle.",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*petit sourire triste* Je pense à un printemps où elle est rentrée trempée, en riant, en disant qu'elle avait appris une chanson.",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*debout à la proue, à voix basse* Demain, les récifs.",
        emotion: 'neutral'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*à la barre* Demain, les récifs. Dormez tant que la mer le permet.",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*à son père, sans le regarder* Bonne nuit, père.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*un temps* Bonne nuit, ma fille.",
        emotion: 'neutral'
    }
];

/** Scène 4 : au petit matin, les îles rocheuses apparaissent au loin. Narration. */
export const CH3_BATTLE1_ROCKY_ISLES: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La nuit a passé sans incident. Au petit matin, une brume basse traîne sur l'eau, et l'air s'est refroidi.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Droit devant, encore lointaines, des formes noires percent la brume. Non pas des collines : des dents. Des rochers dressés à la verticale, par dizaines, semés sur des lieues de mer.",
        emotion: 'worried'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les îles rocheuses. Le repaire des sirènes.",
        emotion: 'worried'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Un à un, les dieux montent sur le pont sans qu'on les appelle. Personne ne parle. La mer, ici, ne fait aucun bruit.",
        emotion: 'worried'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ulysse prend la barre lui-même et ne la lâchera plus.",
        emotion: 'determined'
    }
];

/** Scène 5 : la navigation dans le passage étroit, entre les falaises. */
export const CH3_BATTLE1_NARROWS: DialogueLine[] = [
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*les deux mains sur la barre* Silence sur le pont. Total. Je dois entendre l'eau.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les falaises se referment sur le navire. À gauche, à droite, la pierre monte si haut qu'elle vole le ciel. Le jour devient gris.",
        emotion: 'worried'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*à mi-voix* Artémis, à la proue. Tes yeux valent mieux que les miens. Tu m'annonces tout ce qui affleure.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*se penche au-dessus de l'eau* Récif à trois longueurs, sur ta droite. Un autre juste derrière, plus bas.",
        emotion: 'determined'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*corrige* Vu.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La coque frôle la pierre. On entend le bois gémir sur toute sa longueur, puis se taire.",
        emotion: 'worried'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*chuchote* Est-ce que quelqu'un d'autre trouve que c'est TRÈS calme ?",
        emotion: 'worried'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*chuchote* Oui. Et c'est ça qui m'inquiète.",
        emotion: 'worried'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Pas un oiseau sur ces rochers. Pas un seul. Sur des falaises comme celles-ci, il devrait y en avoir des milliers.",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*scrute les récifs* Et pas un chant. Elles auraient dû nous entendre depuis longtemps. Elles chantaient toujours en premier.",
        emotion: 'worried'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*serre les mains* Peut-être qu'elles sont parties ?",
        emotion: 'worried'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*sombre* Les sirènes ne partent pas. Elles se taisent.",
        emotion: 'worried'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ulysse lâche la barre d'une main, fouille dans sa besace, et en sort deux boulettes de cire d'abeille qu'il pétrit entre ses doigts.",
        emotion: 'determined'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*fronce les sourcils* Qu'est-ce que tu fais ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*s'enfonce la cire dans les oreilles* Ce que j'ai fait la première fois. Je ne suis pas assez fier pour croire que j'y résisterais.",
        emotion: 'determined'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*amusé* De la cire ? Ulysse, je suis le dieu de la musique. Aucun chant au monde ne—",
        emotion: 'happy'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Une note s'élève des rochers. Une seule. Très pure, très lente.",
        emotion: 'worried'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*s'interrompt, la tête tournée vers la falaise* ...oh.",
        emotion: 'surprised'
    }
];

/** Scène 6 : l'embuscade. Sirènes et harpies attaquent ensemble. */
export const CH3_BATTLE1_AMBUSH: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La note devient deux. Puis dix. Puis cent. Le chant tombe des falaises de tous les côtés à la fois, et l'eau autour du navire se met à bouillonner.",
        emotion: 'worried'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Et au-dessus du chant, un autre bruit : des ailes. Des centaines d'ailes. Le ciel volé par les falaises s'emplit de silhouettes crochues.",
        emotion: 'worried'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*hurle* HARPIES ! En haut ! Elles descendent !",
        emotion: 'angry'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*lève sa lance* Sirènes dans l'eau ET harpies dans le ciel ? Ce n'est pas une rencontre. C'est un piège.",
        emotion: 'angry'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*crie par-dessus le vacarme* Elles se sont ALLIÉES ! Sirènes et harpies ! Ça n'est jamais arrivé ! Jamais !",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Une forme jaillit de l'eau, s'abat sur Zeus et le plaque contre le mât. Des serres se referment sur ses épaules, dans ses bras, à travers sa tunique.",
        emotion: 'worried'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*rugit* LÂCHE-MOI, CRÉATURE !",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Une harpie se pose sur la vergue au-dessus de lui et lui hurle au visage, un cri si long et si strident que le mât vibre.",
        emotion: 'worried'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La foudre monte dans les mains de Zeus, éclaire la voile par-dessous... et s'éteint.",
        emotion: 'worried'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*les dents serrées* Je ne peux pas. Si je frappe ici, je coule le navire et j'emporte les miens avec lui.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*à la harpie, d'une voix de roi* Toi ! Tu me reconnais ! Ordonne-leur de reculer ! OBÉIS !",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La harpie penche la tête. Elle le regarde longuement, comme on regarde une chose qu'on ne connaît pas. Puis elle crie de nouveau.",
        emotion: 'worried'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*stupéfait* ...Elle ne m'obéit pas. Elle ne m'obéit PAS.",
        emotion: 'surprised'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "À l'autre bout du pont, le chant a trouvé ses proies.",
        emotion: 'worried'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*les yeux vides, marche vers le bastingage* Vous entendez ?... Elles m'appellent. Elles m'appellent, moi.",
        emotion: 'happy'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*fasciné, la lyre tombée à ses pieds* Cette septième... Comment font-elles cette septième ? Il faut que je m'approche. Il faut que je comprenne.",
        emotion: 'happy'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*rit doucement, une main sur le cœur* Oh, elles sont douées. Elles sont tellement douées...",
        emotion: 'happy'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*sa voix se brise* Moi... prise à mon propre jeu. Le charme. La séduction. C'est MON domaine, et je— je ne peux pas—",
        emotion: 'surprised'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*décoche une flèche, attrape Dionysos par le col* TROIS à terre ! Aphrodite, Apollon et Dionysos sont pris !",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Autour du navire, l'eau et le ciel sont pleins. Des dizaines de sirènes sur les récifs, des dizaines de harpies au-dessus. Elles qui vivent seules, chacune sur son rocher, sont là par hordes.",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*immobile au milieu du pont, les bras ballants* Non... non, non, non...",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*fait un pas vers le bastingage, la voix tremblante* C'est moi ! C'est Déméter ! Vous me connaissez ! Vous avez chanté pour ma fille !",
        emotion: 'sad'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Une sirène se hisse sur le bordage à deux pas d'elle. Elle la fixe. Il n'y a rien dans ses yeux : ni haine, ni reconnaissance. Rien du tout.",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*s'effondre à genoux* Elle ne me reconnaît pas. Elle ne sait même plus qui je suis.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*tire son épée, la cire dans les oreilles, sans avoir rien entendu de tout cela* Athéna ! Artémis ! À moi !",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*pare une harpie de son bouclier* Nous trois ! Le chant ne nous touche pas — moi la raison, Artémis la chasse, Ulysse la cire !",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*les flammes aux mains, debout et ferme* Moi non plus, il ne me touche pas. Dites-moi quoi faire, je le fais.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*sans hésiter* Hestia, tu ne te bats pas. Tu PROTÈGES. C'est un ordre.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Va à mon père. Brûle ce qui le tient et couvre-le. Puis Déméter — elle est à découvert et elle ne se défendra pas.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Et ensuite, le plus dur : une sphère de feu autour du navire entier. Rien ne passe. Ni serre, ni chant, ni écume.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*pâlit* Athéna... une sphère de cette taille, tenue pendant tout un combat... ça va me vider.",
        emotion: 'worried'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*la regarde en face* Je sais. Je te le demande quand même. Sans elle, nous y restons tous.",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*respire, puis lève les deux mains* Alors tenez bon. Et faites vite.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*hurle vers le pont* MA TANTE ! DEBOUT !",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Tu pleureras plus tard ! Elles ne te reconnaissent pas, tant pis — mon père et Hestia, EUX, te reconnaissent ! Va les couvrir !",
        emotion: 'angry'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*relève la tête, s'essuie le visage* ...Oui. Oui.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*à Ulysse et Artémis* Nous trois, nous réglons ça. Vite et proprement. Les autres ne tiendront pas longtemps.",
        emotion: 'determined'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*se place dos à dos avec elles* Alors ne perdons pas de temps à parler.",
        emotion: 'determined'
    }
];

/** Victoire : le chant se brise, le navire passe. */
export const CH3_BATTLE1_WIN: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La dernière sirène glisse du bordage et disparaît sous l'eau. Au-dessus, les harpies rompent leur cercle et remontent vers les falaises. Le chant s'éteint d'un coup, comme une corde qu'on coupe.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La sphère de feu vacille, rougit, puis s'éteint à son tour. Hestia tombe assise sur le pont.",
        emotion: 'worried'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*à bout de souffle* C'est... c'est fini ? Dites-moi que c'est fini.",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*s'agenouille près d'elle, les mains sur ses épaules* C'est fini. Tu as tenu. Tu as tenu tout du long.",
        emotion: 'sad'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*se redresse, hagard, ramasse sa lyre* Qu'est-ce que... Pourquoi suis-je au bastingage ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*se frotte le visage* J'allais sauter. J'allais sauter en souriant. Je n'aime pas ça du tout.",
        emotion: 'worried'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*les bras serrés autour d'elle, sans son sourire habituel* Elles m'ont eue avec mes propres armes. Je ne l'oublierai pas.",
        emotion: 'sad'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les serres lâchent enfin le mât. Zeus s'en détache, les épaules ouvertes, et reste un long moment à regarder ses mains.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*lentement* Elles ne m'ont pas obéi.",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Depuis que le monde est monde, les harpies se posent quand je parle. Aujourd'hui, l'une d'elles m'a regardé comme on regarde un étranger.",
        emotion: 'sad'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*essuie sa lance* Parce que quelqu'un d'autre parle plus fort que toi, père. Et parce que ce quelqu'un a réuni des créatures qui n'avaient jamais rien fait ensemble.",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*fixe la mer* Ce n'était pas de la fureur, dans leurs yeux. C'était du vide. On leur a pris quelque chose.",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*sombre* Nyx.",
        emotion: 'angry'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*hoche la tête* Les ombres effacent. C'est ce qu'elles font de mieux. On leur a effacé qui elles étaient, et à qui elles tenaient.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*retire la cire de ses oreilles* Alors Hadès nous attend sur toute la route, et pas seulement au bout.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*à son père* Il savait où nous allions avant nous. Cela veut dire qu'il savait pour Ulysse. Et donc pour Poséidon.",
        emotion: 'worried'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*se redresse, la voix retrouvée* Qu'il sache. Qu'il nous voie venir. J'ai perdu l'obéissance des harpies, pas ma foudre.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Devant la proue, les dents de pierre s'écartent enfin. La brume se déchire, et la mer redevient large.",
        emotion: 'determined'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*reprend la barre* Récifs franchis. Deux jours gagnés, comme promis.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*un pauvre sourire* Deux jours. Ils étaient chers.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*regarde l'horizon* Reposez-vous. Vraiment, cette fois.",
        emotion: 'neutral'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "Prochaine terre : les îles sauvages. Le pays des Cyclopes.",
        emotion: 'worried'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Personne ne répond. Le navire file vers le sud, et derrière lui, sur les falaises désertes, aucun oiseau ne revient.",
        emotion: 'worried'
    }
];

/** Défaite : le navire ne passe pas. Il faut recommencer. */
export const CH3_BATTLE1_LOSE: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Athéna tombe un genou à terre. Artémis n'a plus de flèches. Ulysse recule jusqu'au mât, l'épée basse.",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*à genoux, les mains tremblantes* Je ne peux plus... la sphère... je ne peux plus la tenir...",
        emotion: 'sad'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le mur de feu s'effondre. Le chant entre sur le pont d'un seul coup, comme l'eau dans une coque ouverte.",
        emotion: 'sad'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*crie* La barre ! Quelqu'un ! N'IMPORTE QUI À LA BARRE !",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Personne ne la tient. Le courant prend le navire par le flanc et le porte, doucement, presque tendrement, contre la pierre.",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*hurle vers les récifs* ARRÊTEZ ! JE VOUS EN SUPPLIE ! SOUVENEZ-VOUS D'ELLE !",
        emotion: 'sad'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le chant ne s'interrompt pas. Il n'y a personne, dans ces voix, pour se souvenir.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*jette son épée, saisit la barre à deux mains* Pas ici. PAS ENCORE.",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Il force la barre jusqu'à ce que le bois craque, arrache le navire à la falaise, et le ramène dans le courant sortant.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le navire fuit les récifs en gémissant de toute sa coque. Derrière lui, les harpies se reposent sur la pierre et le regardent partir sans le poursuivre.",
        emotion: 'sad'
    },
    {
        speakerId: 'ulysses',
        speakerName: 'Ulysse',
        text: "*épuisé, la voix rauque* Nous avons reculé. Nous avons TOUT reculé. Il faudra recommencer.",
        emotion: 'sad'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "*se relève, une main sur les côtes* Alors nous recommencerons. Et cette fois nous saurons qu'elles sont alliées.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*toujours contre le mât, amer* Elles ne m'ont pas obéi. Rien n'ira comme prévu tant que je n'aurai pas compris pourquoi.",
        emotion: 'angry'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*doucement, la main sur son bras* Alors soigne-toi, et nous y retournons. Je tiendrai la sphère aussi longtemps qu'il faudra.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les récifs s'éloignent, intacts. Rien n'est perdu — mais rien n'est gagné, et le cap Ténare est toujours de l'autre côté.",
        emotion: 'sad'
    }
];
