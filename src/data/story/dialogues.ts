// Dialogues du mode histoire - Campagne Zeus
import { DialogueLine } from '@/types/story';

// ===========================================
// CHAPITRE 1 - PROLOGUE : LA TRAHISON
// ===========================================

// Introduction - Avant le combat 1
export const PROLOGUE_INTRO: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "L'Olympe est en paix depuis des siècles. Les mortels nous vénèrent, et l'équilibre règne entre les royaumes.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Mais je sens une ombre grandir... Une menace que je n'arrive pas à identifier.",
        emotion: 'surprised'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Cher frère... Tu aurais dû écouter cette intuition plus tôt.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Hadès ?! Que fais-tu ici ? Et... pourquoi es-tu accompagné d'une armée ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Depuis trop longtemps, je suis relégué aux Enfers pendant que TU règnes sur l'Olympe !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Aujourd'hui, je prends ce qui m'appartient de droit. Le trône sera MIEN !",
        emotion: 'angry'
    },
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "Les ténèbres engloutiront la lumière, Zeus. Ta chute est inévitable.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Zeus ! Nous sommes attaqués de toutes parts ! C'est une embuscade !",
        emotion: 'surprised'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "Nous n'avons pas le temps de nous préparer... Il faut nous défendre !",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Hé bien... la fête va être sanglante ce soir !",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Mes fidèles alliés, préparez-vous au combat ! Nous ne céderons pas face à cette traîtrise !",
        emotion: 'determined'
    }
];

// Après la défaite ou la victoire du combat 1
export const PROLOGUE_AFTER_BATTLE_1_WIN: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Nous... nous les avons repoussés... pour l'instant...",
        emotion: 'sad'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Tu crois avoir gagné, frère ? Regarde autour de toi !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Pendant que tu te battais contre nous, mes légions ont pris le contrôle de l'Olympe.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Non... C'est impossible...",
        emotion: 'surprised'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "L'Olympe est à MOI désormais ! Et toi, Zeus, tu n'es plus rien !",
        emotion: 'happy'
    }
];

export const PROLOGUE_AFTER_BATTLE_1_LOSE: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Nous... nous sommes vaincus...",
        emotion: 'sad'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Comme je l'avais prévu. Tu es devenu faible, Zeus.",
        emotion: 'happy'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "L'Olympe m'appartient désormais. Emmènes-les !",
        emotion: 'determined'
    }
];

// Hadès prend le trône (commun aux deux issues)
export const PROLOGUE_HADES_TAKES_THRONE: DialogueLine[] = [
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Enfin... Le trône de l'Olympe est mien !",
        emotion: 'happy'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "Une nouvelle ère commence. L'ère des Ténèbres !",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Ce n'est pas terminé, Hadès. Nous reviendrons...",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Nous devons fuir pour l'instant. Regroupons nos forces.",
        emotion: 'sad'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "Les autres dieux... nous devons les rallier à notre cause !",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Tu as raison. La résistance commence maintenant.",
        emotion: 'determined'
    }
];

// ===========================================
// FIN DU CHAPITRE 1
// ===========================================
export const PROLOGUE_END: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Nous avons perdu l'Olympe... mais pas la guerre.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "À suivre...",
        emotion: 'neutral'
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
