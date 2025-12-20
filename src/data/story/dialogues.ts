// Dialogues du mode histoire - Campagne Zeus
import { DialogueLine } from '@/types/story';

// ===========================================
// CHAPITRE 1 - PROLOGUE : LA TRAHISON
// ===========================================

// Introduction narrative - L'histoire du monde
export const PROLOGUE_NARRATIVE: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Au commencement, il n'y avait que le Chaos. Puis naquirent Gaïa, la Terre, et Ouranos, le Ciel étoilé...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "De leur union naquirent les Titans, et parmi eux Cronos, qui dévora ses propres enfants par crainte d'une prophétie.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Mais Rhéa, désespérée, cacha le dernier né : Zeus. Celui-ci grandit en secret, et libéra un jour ses frères et sœurs des entrailles de son père.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Après une guerre terrible contre les Titans - la Titanomachie - les trois frères se partagèrent le monde.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Zeus reçut le Ciel et devint roi des dieux. Poséidon obtint les Mers. Et Hadès... Hadès fut relégué aux Enfers.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Pendant des millénaires, les trois royaumes coexistèrent. Mais dans les profondeurs du Tartare, une rancœur grandissait...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Cette nuit, sur l'Olympe, le tonnerre gronde d'une façon inhabituelle. Zeus sent une présence familière approcher...",
        emotion: 'neutral'
    }
];

// Dialogue entre Zeus et Hadès avant le combat
export const PROLOGUE_INTRO: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Qui ose troubler la quiétude de l'Olympe à cette heure ? Montre-toi !",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Calme-toi, frère. Tu sais très bien qui je suis. Tu m'as toujours su présent, même quand tu feignais de m'ignorer.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Hadès... Cela fait des siècles que tu n'as pas quitté ton royaume. Que me vaut cette... visite ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Visite ? Non, Zeus. Je préfère le terme 'réclamation'.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Réclamation ? Mais de quoi parles-tu ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Du trône ! De CE trône que tu occupes depuis la chute de Cronos !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "J'étais l'aîné ! Le droit d'aînesse aurait dû me revenir ! Mais non... vous aviez TOUS peur de moi.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Le sort a décidé, Hadès. Ce n'est pas moi qui ai choisi les Enfers pour toi.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Le sort ? Tu parles du tirage truqué que toi et Poséidon avez orchestré ?",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "J'ai eu des millénaires pour méditer dans les ténèbres. Des millénaires pour préparer... ceci.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Tu ne peux pas me menacer sur mon propre trône ! Je suis le Roi des Dieux !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Tu ÉTAIS le roi. Les morts que tu m'as envoyés pendant des siècles m'ont rendu plus puissant que tu ne l'imagines.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Très bien, frère... Si c'est un combat que tu veux, c'est un combat que tu auras !",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Que le plus digne des fils de Cronos prenne le trône de l'Olympe. Mais sache que je t'ai déjà affaibli... regarde-toi.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "L'ombre... le malaise que je ressentais... C'était TOI ! Tu as drainé mon énergie !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Les Enfers m'ont appris la patience. Maintenant, TOMBE !",
        emotion: 'angry'
    }
];

// Après la victoire du combat (Zeus gagne mais Nyx intervient en surprise)
export const PROLOGUE_AFTER_BATTLE_1_WIN: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*souffle lourd* Tu... tu pensais vraiment pouvoir me vaincre, Hadès ?",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "*à genoux* Impossible... même affaibli, tu parviens à me repousser...",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Je suis le Maître de la Foudre. Mon pouvoir perdure quelles que soient tes machinations.",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "*sourire sinistre* Tu as peut-être gagné ce duel, Zeus... Mais tu n'as pas gagné la guerre.",
        emotion: 'happy'
    },
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "*surgissant des ombres* Maître Hadès... laissez-moi finir ce que vous avez commencé.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "NYX ?! Comment as-tu pu pénétrer dans l'Olympe sans—ARGH !",
        emotion: 'surprised'
    },
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "*frappe Zeus par surprise* Les ténèbres sont partout, roi déchu. Vous ne pouvez pas échapper à la nuit.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*s'effondre* Traîtresse... vous m'avez piégé depuis le début...",
        emotion: 'sad'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Bien joué, Nyx. Maintenant, frère, regarde-moi prendre ce qui m'était destiné.",
        emotion: 'happy'
    }
];

// Après la défaite du combat (Zeus perd contre Hadès)
export const PROLOGUE_AFTER_BATTLE_1_LOSE: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*s'effondre* La foudre... ne répond plus... Mon pouvoir s'éteint...",
        emotion: 'sad'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "*se dresse victorieux* Enfin... Après des millénaires dans l'ombre, le tout-puissant Zeus tombe devant moi.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Tu... tu m'as eu par traîtrise... M'affaiblir avant le combat...",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "La ruse fait partie de la guerre, frère. Tu aurais dû l'apprendre pendant la Titanomachie.",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Savoure ta défaite. Tu l'as bien méritée après des millénaires d'arrogance et de mépris.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*à genoux, respirant difficilement* Ce n'est pas... terminé... Hadès...",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Oh, mais ça l'est. Regarde autour de toi. Mes ombres ont déjà envahi l'Olympe pendant notre combat.",
        emotion: 'happy'
    }
];

// Hadès prend le trône (commun aux deux issues)
export const PROLOGUE_HADES_TAKES_THRONE: DialogueLine[] = [
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Enfin... ENFIN ! Ce trône qui m'était destiné est mien !",
        emotion: 'happy'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Une nouvelle ère commence, frère. L'ère des Ténèbres Éternelles.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Tu penses avoir gagné, mais tu te trompes. Les autres dieux ne se laisseront pas faire.",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Les autres dieux ? Arès s'est déjà rallié à moi. Nyx me sert depuis toujours. Qui te reste-t-il ?",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Athéna... Poséidon... Ils ne te laisseront pas régner. Je reviendrai, Hadès.",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Fuis alors ! Fuis pendant que je te laisse encore respirer. Mais sache que la prochaine fois...",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "...je ne serai pas aussi clément.",
        emotion: 'determined'
    }
];

// Fin du chapitre
export const PROLOGUE_END: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "L'Olympe est tombé... mais moi, je suis toujours debout.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Je dois trouver mes alliés. Athéna la Sage... Poséidon des Océans... ensemble, nous reprendrons ce qui nous appartient.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "La résistance commence maintenant. Ce n'est que le début...",
        emotion: 'determined'
    }
];

// ===========================================
// CHAPITRE 2 - LA RÉSISTANCE
// ===========================================

// Introduction du Chapitre 2 - Recherche d'alliés
export const CHAPTER2_INTRO: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Nous avons trouvé refuge dans les forêts de Thessalie. L'Olympe est sous le contrôle d'Hadès...",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Nous ne sommes que quatre. Comment pourrions-nous reprendre l'Olympe avec si peu de forces ?",
        emotion: 'sad'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "Athéna et Poséidon n'étaient pas présents lors de l'attaque. Ils pourraient nous aider !",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Athéna est sage, elle comprendra la gravité de la situation. Quant à Poséidon...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Mon frère Poséidon... Il a toujours été neutre dans les conflits de l'Olympe. Mais cette fois...",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Rendons-nous d'abord au temple d'Athéna. Sa sagesse nous sera précieuse.",
        emotion: 'determined'
    }
];

// Rencontre avec Athéna
export const CHAPTER2_ATHENA_INTRO: DialogueLine[] = [
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Zeus ! J'ai appris ce qui s'est passé. Hadès a franchi une limite impardonnable.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Athéna, nous avons besoin de ta sagesse et de ta force. M'aieras-tu ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "La question ne se pose même pas. Cependant... Hadès a corrompu certains dieux avec ses promesses.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Arès et Artémis sont venus ici pour me... convaincre de rejoindre Hadès. Par la force.",
        emotion: 'surprised'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "Arès ?! Il a toujours été violent, mais trahir l'Olympe...",
        emotion: 'surprised'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Ils arrivent. Préparez-vous au combat !",
        emotion: 'determined'
    }
];

// Après victoire contre Arès et Artémis
export const CHAPTER2_AFTER_ARES_WIN: DialogueLine[] = [
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Grr... Vous êtes plus forts que prévu. Mais Hadès vous écrasera !",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Nous reviendrons... La chasse n'est jamais vraiment terminée.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Qu'ils partent. Nous avons plus important à faire.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Athéna, tu es des nôtres. À présent, allons convaincre Poséidon.",
        emotion: 'determined'
    }
];

// Après défaite contre Arès et Artémis
export const CHAPTER2_AFTER_ARES_LOSE: DialogueLine[] = [
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Pathétique ! Hadès avait raison sur votre faiblesse !",
        emotion: 'happy'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Repliez-vous ! Nous ne pouvons pas les vaincre dans cet état !",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Nous avons réussi à fuir... mais à quel prix...",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Peu importe. Nous devons continuer. Vers le royaume de Poséidon.",
        emotion: 'determined'
    }
];

// Rencontre avec Poséidon
export const CHAPTER2_POSEIDON_INTRO: DialogueLine[] = [
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Zeus ! Que me vaut cette visite inattendue dans mon royaume ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Frère, Hadès a pris l'Olympe. J'ai besoin de ton aide pour le reprendre.",
        emotion: 'determined'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "L'Olympe ne me concerne pas. Mes océans sont mon royaume, et ils sont en paix.",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Poséidon, si Hadès contrôle l'Olympe, combien de temps avant qu'il ne convoite les mers ?",
        emotion: 'determined'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Hmm... Tu marques un point, Athéna. Mais je ne suis pas convaincu.",
        emotion: 'neutral'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Prouvez-moi votre valeur ! Affrontez mes champions des mers !",
        emotion: 'determined'
    }
];

// Après victoire contre les champions de Poséidon
export const CHAPTER2_AFTER_POSEIDON_WIN: DialogueLine[] = [
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Impressionnant ! Vous avez vaincu mes meilleurs guerriers.",
        emotion: 'happy'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Très bien, Zeus. Tu as ma parole. Les océans se lèvent contre Hadès !",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Merci, frère. Ensemble, nous reprendrons l'Olympe !",
        emotion: 'happy'
    }
];

// Après défaite contre les champions de Poséidon
export const CHAPTER2_AFTER_POSEIDON_LOSE: DialogueLine[] = [
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Décevant. Vous n'êtes pas prêts à affronter Hadès.",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Poséidon, je t'en prie. Même affaiblis, nous devons agir !",
        emotion: 'sad'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "...Soit. Peut-être que ma puissance compensera vos faiblesses. Je vous rejoins.",
        emotion: 'neutral'
    }
];

// Fin du Chapitre 2
export const CHAPTER2_END: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Nous avons maintenant une armée digne de reprendre l'Olympe.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Hadès ne s'y attendra pas. Nous devons frapper vite et fort.",
        emotion: 'determined'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Mes vagues feront trembler les fondations de son règne.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "L'heure de la reconquête approche. Hadès... nous arrivons.",
        emotion: 'determined'
    }
];

// ===========================================
// CHAPITRE 3 - LA RECONQUÊTE
// ===========================================

// Introduction du Chapitre 3 - L'assaut de l'Olympe
export const CHAPTER3_INTRO: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Voici l'Olympe... Mon Olympe. Souillé par les ténèbres d'Hadès.",
        emotion: 'sad'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Ah, les voilà ! Je vous attendais, chers frères et sœurs.",
        emotion: 'happy'
    },
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "Les ombres murmurent votre venue. Vous êtes si prévisibles...",
        emotion: 'neutral'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Nous ne sommes pas venus parler, Hadès. Rends-toi !",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Me rendre ? Moi qui suis enfin roi des dieux ? JAMAIS !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Nyx ! Thanatos ! Détruisez-les une bonne fois pour toutes !",
        emotion: 'angry'
    }
];

// Combat contre les gardiens (Nyx et Thanatos)
export const CHAPTER3_BEFORE_GUARDIAN_BATTLE: DialogueLine[] = [
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "Vous pensez pouvoir traverser les ténèbres éternelles ? Naïfs...",
        emotion: 'determined'
    },
    {
        speakerId: 'thanatos',
        speakerName: 'Thanatos',
        text: "La mort est inévitable. Pourquoi lutter ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Parce que l'Olympe ne cédera JAMAIS ! En avant !",
        emotion: 'determined'
    }
];

// Après victoire contre les gardiens
export const CHAPTER3_AFTER_GUARDIAN_WIN: DialogueLine[] = [
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "Impossible... Ma nuit éternelle... dissipée...",
        emotion: 'surprised'
    },
    {
        speakerId: 'thanatos',
        speakerName: 'Thanatos',
        text: "Même la mort peut être vaincue... Je comprends maintenant...",
        emotion: 'sad'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "Le chemin vers Hadès est ouvert ! Allons-y !",
        emotion: 'determined'
    }
];

// Après défaite contre les gardiens
export const CHAPTER3_AFTER_GUARDIAN_LOSE: DialogueLine[] = [
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Nous... nous n'y arrivons pas...",
        emotion: 'sad'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Ressaisissez-vous ! C'est notre dernière chance ! Nous devons continuer !",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Elle a raison. Même affaiblis, nous devons affronter Hadès !",
        emotion: 'determined'
    }
];

// Confrontation finale avec Hadès
export const CHAPTER3_HADES_CONFRONTATION: DialogueLine[] = [
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Vous avez vaincu mes gardiens... Impressionnant, je l'admets.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "C'est terminé, Hadès. Descends de ce trône qui n'est pas le tien.",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Le tien ? Tu es si arrogant ! Ce trône m'appartient par droit de conquête !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Tu veux le reprendre ? ALORS VIENS LE CHERCHER !",
        emotion: 'angry'
    }
];

// Victoire finale
export const CHAPTER3_VICTORY: DialogueLine[] = [
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Non... NON ! C'est impossible ! J'étais si proche...",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "C'est fini, Hadès. Retourne aux Enfers, là où est ta place.",
        emotion: 'determined'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Tu gagnes aujourd'hui, Zeus... Mais les ténèbres reviendront. Elles reviennent toujours.",
        emotion: 'angry'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Et nous serons là pour les repousser. Encore et encore.",
        emotion: 'determined'
    },
    {
        speakerId: 'poseidon',
        speakerName: 'Poséidon',
        text: "L'équilibre est restauré. L'Olympe respire à nouveau.",
        emotion: 'happy'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Le foyer de l'Olympe se rallume enfin. Bienvenue chez vous, mes frères et sœurs.",
        emotion: 'happy'
    }
];

// Défaite finale
export const CHAPTER3_DEFEAT: DialogueLine[] = [
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "HAHAHAHA ! Vous voir ainsi à genoux... Quel délice !",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Nous... avons échoué...",
        emotion: 'sad'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "L'ère des Olympiens est révolue. L'ère des Ténèbres commence !",
        emotion: 'happy'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "Non... Ce ne peut pas être la fin...",
        emotion: 'sad'
    }
];

// Épilogue - Victoire
export const CHAPTER3_EPILOGUE: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "L'Olympe est enfin en paix. Mais cette guerre m'a appris une chose...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Nous devons rester vigilants. Les ténèbres guettent toujours.",
        emotion: 'determined'
    },
    {
        speakerId: 'athena',
        speakerName: 'Athéna',
        text: "Et nous serons prêts. Ensemble, nous sommes invincibles.",
        emotion: 'happy'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "En attendant... quelqu'un veut célébrer ? J'ai du vin divin !",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "...Oui, Dionysos. Célébrons notre victoire. Nous l'avons méritée.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "FIN DE LA CAMPAGNE",
        emotion: 'neutral'
    }
];
