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
