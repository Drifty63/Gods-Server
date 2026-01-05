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
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Soudain, les ténèbres s'épaississent. Une silhouette émerge de l'obscurité, se matérialisant aux côtés d'Hadès...",
        emotion: 'neutral'
    },
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "*apparaît dans un voile de nuit* Ton frère n'aurait jamais pu te vaincre seul, Zeus. Il lui fallait... un avantage.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*écarquille les yeux* Nyx ?! C'était donc toi... Cette ombre, cette oppression, cette fatigue avant le combat...",
        emotion: 'surprised'
    },
    {
        speakerId: 'nyx',
        speakerName: 'Nyx',
        text: "J'ai drainé ton essence divine pendant que tu dormais, nuit après nuit. Tu ne t'en es même pas rendu compte.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*réalisation amère* Je pensais que c'était Hadès qui projetait cette aura menaçante... Mais c'était toi, cachée dans l'ombre !",
        emotion: 'angry'
    },
    {
        speakerId: 'hades',
        speakerName: 'Hadès',
        text: "*ricane* Tu vois, frère ? Tu n'es pas le seul à avoir des alliés puissants. Sauf que les miens sont plus... discrets.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*à genoux* Deux traîtres... Ce n'est pas terminé, Hadès. Je reviendrai...",
        emotion: 'determined'
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
// COMBAT 2 DU PROLOGUE - LA FUITE SUR TERRE
// Zeus trouve refuge chez Hestia, Arès les attaque
// ===========================================

// Narrateur - Zeus fuit vers la Terre
export const PROLOGUE_BATTLE2_NARRATOR: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Gravement blessé par l'attaque surprise de Nyx, Zeus n'a d'autre choix que de fuir l'Olympe tombé aux mains de son frère.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le Roi des Dieux connaît bien la Terre des mortels. Il y est descendu maintes fois pour diverses raisons... certaines plus nobles que d'autres.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Mais cette fois, son objectif est clair : trouver Hestia, déesse du foyer, la seule qui pourra l'accueillir, l'aider et soigner ses blessures.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Au cœur d'une forêt verdoyante de la Grèce antique, Zeus aperçoit enfin une modeste cabane entourée de fleurs aux mille couleurs...",
        emotion: 'neutral'
    }
];

// Dialogue Zeus et Hestia dans la cabane (AVANT l'arrivée d'Arès)
export const PROLOGUE_BATTLE2_INTRO_CABIN: DialogueLine[] = [
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Zeus ?! Par les dieux, dans quel état tu es ! Entre vite, assieds-toi près du feu.",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*s'effondre sur une chaise* Hestia... L'Olympe... est tombé...",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Tombé ? Comment est-ce possible ? L'Olympe est imprenable !",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Hadès... Notre propre frère m'a trahi. Il a préparé son coup pendant des millénaires. Et Nyx l'a aidé.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Ils m'ont affaibli avant même le combat. J'ai... j'ai perdu le trône.",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*pose une main réconfortante sur son épaule* Du calme, frère. Le foyer de ma demeure te protège. Ici, tu es en sécurité.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Je vais soigner tes blessures. Mais cela prendra du temps... ta force divine a été gravement entamée.",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Je n'ai pas le temps, Hestia. Hadès va chercher à m'éliminer. Il enverra ses sbires.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Alors nous devons trouver des alliés. Je sais où se trouve Artémis... et Déméter. Elles sont liées à notre frère Poséidon.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Si nous parvenons à rallier Poséidon à notre cause, nous aurons une chance de—",
        emotion: 'determined'
    }
];

// Arrivée d'Arès qui défonce la porte
export const PROLOGUE_BATTLE2_ARES_ENTRANCE: DialogueLine[] = [
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*défonce la porte* ZEUS ! Tu pensais pouvoir te cacher du dieu de la guerre ?!",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Arès ?! Comment nous as-tu trouvés si vite ?!",
        emotion: 'surprised'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Hadès m'a promis le commandement de ses armées. En échange... je dois lui ramener ta tête !",
        emotion: 'angry'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*se place devant Zeus* Tu devras d'abord passer par moi, traître ! Le feu du foyer brûle aussi fort que ta rage sanguinaire !",
        emotion: 'angry'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Hestia la pacifique qui ose combattre ? HAHAHAHA ! Ce sera un plaisir de t'écraser aussi !",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*se lève péniblement* Je ne laisserai pas ma sœur affronter ce monstre seule. Même affaibli... je suis toujours Zeus !",
        emotion: 'determined'
    }
];

// Garder l'ancien export pour compatibilité (combinaison des deux)
export const PROLOGUE_BATTLE2_INTRO: DialogueLine[] = [
    ...PROLOGUE_BATTLE2_INTRO_CABIN,
    ...PROLOGUE_BATTLE2_ARES_ENTRANCE
];

// Après victoire contre Arès
export const PROLOGUE_BATTLE2_WIN: DialogueLine[] = [
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*à genoux, blessé* Impossible... Même affaibli et avec cette cuisinière, tu parviens à me battre ?!",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Cuisinière ? Le feu du foyer réchauffe les cœurs, Arès. Mais il peut aussi réduire en cendres ceux qui menacent ma famille.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Fuis, Arès. Et dis à Hadès que je reviendrai reprendre mon trône.",
        emotion: 'determined'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*se relève en titubant* Tu as gagné cette manche, père... Mais Hadès a des légions entières à sa disposition !",
        emotion: 'angry'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*disparaît dans une lueur rouge* On se reverra... et la prochaine fois, je ne serai pas seul !",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Il est parti. Zeus, tu dois te reposer maintenant. Cette bataille t'a encore plus affaibli.",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Non, Hestia. Nous devons bouger. Si Arès nous a trouvés, d'autres viendront.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Tu as raison... Allons trouver Artémis. Elle saura nous cacher le temps que tu récupères.",
        emotion: 'determined'
    }
];

// Après défaite contre Arès
export const PROLOGUE_BATTLE2_LOSE: DialogueLine[] = [
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "HAHAHAHA ! Regardez-vous, pathétiques ! Le grand Zeus, à genoux devant moi !",
        emotion: 'happy'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*protège Zeus* Tu n'as aucun honneur, Arès ! Attaquer un dieu blessé !",
        emotion: 'angry'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "L'honneur ? La guerre n'a pas d'honneur, vieille folle ! Seule la victoire compte !",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*essaie de se relever* Je... ne me rendrai... jamais...",
        emotion: 'determined'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Têtu jusqu'au bout. Hadès sera content de te voir ramper à ses pieds.",
        emotion: 'happy'
    }
];

// ===========================================
// COMBAT 3 - CHEZ ARTÉMIS
// ===========================================

// Narrateur - Le voyage vers Artémis
export const PROLOGUE_BATTLE3_NARRATOR: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La victoire contre Arès n'a apporté qu'un bref répit. Zeus, épuisé et encore affaibli, doit fuir à nouveau.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Hestia guide son frère à travers les sentiers cachés de la forêt. Elle qui d'ordinaire ne quitte jamais son foyer, n'a pas hésité une seconde.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Car telle est sa nature : protectrice, bienveillante, toujours prête à aider les siens sans poser de questions. Le feu de son cœur brûle pour sa famille.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Elle n'a pas cherché à comprendre tous les détails de la trahison d'Hadès. Pour Hestia, seul compte le présent : son frère a besoin d'elle.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les deux dieux marchent en silence, évitant les routes principales. Chaque bruissement de feuilles pourrait cacher un ennemi...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Enfin, après des heures de marche, ils aperçoivent le territoire d'Artémis : une forêt plus dense, plus ancienne, où même les dieux hésitent à pénétrer sans invitation.",
        emotion: 'neutral'
    }
];

// Dialogue avec Artémis
export const PROLOGUE_BATTLE3_ARTEMIS_INTRO: DialogueLine[] = [
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*surgit des fourrés, arc bandé* Qui ose pénétrer dans mon domaine sans... Hestia ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*sourit malgré la fatigue* Artémis, ma chère... Pardonne cette intrusion. Nous avons besoin de ton aide.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*baisse son arc, remarque Zeus* Et tu amènes... lui. *ton froid* Que s'est-il passé ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "C'est une longue histoire. Hadès a trahi Zeus avec l'aide de Nyx. Il a pris le contrôle de l'Olympe.",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Zeus a fui chez moi, mais Arès nous a retrouvés. Nous l'avons repoussé, mais d'autres viendront.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*croise les bras* Hadès, roi de l'Olympe ? Et Arès qui chasse pour lui ? Les temps changent vite...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Artémis, je sais que tu n'as aucune raison de m'aider. Notre passé n'a pas toujours été... harmonieux.",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*regard perçant* En effet. Tu n'as pas toujours fait honneur à ta position, père. Tes... écarts sont légendaires.",
        emotion: 'angry'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*pose sa main sur le bras d'Artémis* Ma chère amie, je ne te demande pas de pardonner le passé. Seulement de nous cacher quelques heures.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*soupire, son expression s'adoucit vers Hestia* Pour toi, Hestia... Pour toi seule, je le ferai.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Ma forêt sait masquer les présences. Même les sbires d'Hadès ne pourront pas vous trouver ici.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Je peux brouiller vos traces, surveiller chaque sentier. Rien n'échappe à mes sens dans cette forêt.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Je te remercie, Artémis. Je n'oublierai pas cette dette.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*détourne le regard* Ne me remercie pas encore. Suivez-moi, j'ai un abri où vous pourrez vous reposer.",
        emotion: 'neutral'
    }
];

// Après le repos - Direction Déméter
export const PROLOGUE_BATTLE3_AFTER_REST: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Plusieurs heures s'écoulent dans le calme de la forêt d'Artémis. Zeus récupère lentement ses forces...",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*entre dans l'abri* Vous avez dormi suffisamment. Mes éclaireurs rapportent des mouvements suspects aux frontières.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*se lève, plus vigoureux* Je me sens mieux. Merci pour ce répit, Artémis.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Que devons-nous faire maintenant ? Nous ne pouvons pas rester cachés éternellement.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*hésite* J'ai réfléchi pendant votre repos. Il n'y a qu'une personne qui peut vraiment vous aider.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Quelqu'un qui connaît chaque dieu, chaque sanctuaire, chaque refuge caché... Quelqu'un qui peut rallier les autres à votre cause.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Tu parles de Déméter, n'est-ce pas ? Notre sœur...",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Exactement. Déméter connaît les secrets de la terre et de ses habitants. Elle a des contacts partout.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Je sais où la trouver. Elle vit dans un corps de ferme près d'Éleusis, supervisant les moissons des mortels.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Éleusis... Le lieu de ses mystères. Elle y sera protégée par ses fidèles.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*soupire* Je... Je suis réticente à quitter ma forêt. Ma place est ici, parmi mes animaux et mes arbres.",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Mais... *regarde le ciel* L'équilibre du monde est en jeu. Si Hadès règne sur l'Olympe, les saisons, la chasse, tout sera perturbé.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Je vous guiderai moi-même jusqu'à Déméter. C'est trop important pour que je reste les bras croisés.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*prend les mains d'Artémis* Merci, chère amie. Ton aide nous est précieuse.",
        emotion: 'happy'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*petit sourire* Hestia, tu es la seule à pouvoir me faire quitter mes bois. Allez, en route. Le temps presse.",
        emotion: 'neutral'
    }
];

// Arrivée chez Déméter - Confrontation
export const PROLOGUE_BATTLE3_DEMETER_INTRO: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Après un long voyage à travers les plaines de Grèce, les trois dieux atteignent enfin les champs dorés d'Éleusis...",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*sort de la ferme, surprise* Artémis ? Et... Zeus ?! Que faites-vous ici ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Ma sœur ! *l'étreint* Nous avons besoin de ton aide. Hadès a pris le contrôle de l'Olympe.",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*recule* Hadès ? Le maître des Enfers... a conquis le Ciel ? *regarde Zeus avec méfiance*",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Déméter, je sais que notre relation n'a pas toujours été simple. Mais je—",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*l'interrompt* Simple ?! Tu m'as pris ma fille ! Perséphone est aux Enfers à cause de tes décisions !",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Déméter, l'équilibre du monde est en jeu. Si nous ne faisons rien, les saisons, les récoltes... tout sera compromis.",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*réfléchit* Tu as raison, Artémis. Mais... *regarde Zeus* Comment savoir s'il est digne de reprendre le trône ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "S'il est trop faible pour nous vaincre, comment pourrait-il espérer défier Hadès et Nyx ?",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*hoche la tête* Un test de bravoure. Je suis d'accord. Zeus doit prouver sa valeur.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Attendez ! Vous voulez l'affronter maintenant ? Il n'est pas encore complètement rétabli !",
        emotion: 'surprised'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Raison de plus. S'il ne peut nous vaincre affaibli, il mourra face à Hadès de toute façon.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*se redresse* Soit. Je comprends ton besoin de certitude, ma sœur. Hestia et moi acceptons ce défi.",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*fait surgir des racines du sol qui immobilisent Zeus* Et ne compte pas sur tes éclairs pour commencer...",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*bande son arc* Montrez-nous de quoi vous êtes capables !",
        emotion: 'determined'
    }
];

// Victoire contre Déméter et Artémis
export const PROLOGUE_BATTLE3_WIN: DialogueLine[] = [
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*à genoux, essoufflée* Impressionnant... Même enchaîné par mes racines, tu as su te libérer.",
        emotion: 'surprised'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*abaisse son arc* Je dois admettre... tu es plus fort que je ne le pensais, père.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*tend la main à Déméter* Ce n'était pas facile. Vous êtes redoutables.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*épuisée mais souriante* Alors ? Êtes-vous convaincues maintenant ?",
        emotion: 'happy'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*prend la main de Zeus et se relève* Oui. Je vois en toi la même flamme qu'autrefois... celle d'un vrai roi.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Tu as gagné mon respect, père. Et mon arc sera à tes côtés pour reprendre l'Olympe.",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Je connais d'autres dieux qui pourraient se rallier à notre cause. Ensemble, nous formerons une résistance.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*sourire déterminé* Alors le combat pour l'Olympe ne fait que commencer. Hadès... je reviens.",
        emotion: 'determined'
    }
];

// Défaite contre Déméter et Artémis
export const PROLOGUE_BATTLE3_LOSE: DialogueLine[] = [
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*secoue la tête tristement* Comme je le craignais... Tu es trop faible, Zeus.",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*croise les bras* Si tu ne peux même pas nous vaincre, comment espères-tu défier Hadès ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*à genoux, lié par les racines* Je... Je refuse d'abandonner...",
        emotion: 'sad'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*affaiblie* S'il vous plaît... Laissez-lui une autre chance...",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*soupire* Une autre chance... Très bien. Mais prouve-nous que tu mérites notre confiance.",
        emotion: 'neutral'
    }
];

// ===========================================
// CHAPITRE 2 - LA RÉSISTANCE
// Combat 1 : Zeus + Hestia + Déméter + Artémis vs Dionysos + Apollon + Aphrodite
// ===========================================

// Narrateur - Le voyage vers Thèbes
export const CHAPTER2_BATTLE1_NARRATOR: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Après leur victoire contre l'embuscade d'Arès, l'alliance des dieux reprend la route vers Thèbes, la cité de Dionysos.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Zeus est persuadé qu'Hermès a été capturé et emprisonné par Hadès. Le messager des dieux était trop dangereux pour le nouveau tyran.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Hermès fait le lien entre tous les dieux. Il peut aller où il veut, quand il veut. Et surtout... il aime défier l'autorité.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Sans lui, les dieux sont coupés les uns des autres. C'est exactement ce que voulait Hadès : isoler ses ennemis potentiels.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les quatre dieux voyagent en se montrant discrets, agissant comme de simples mortels. Ils ne savent pas ce qui les attend...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ils espèrent que le destin n'est pas écrit, que Zeus pourra remonter sur le trône et rétablir l'équilibre du monde avant qu'il ne soit trop tard.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Pour reconquérir l'Olympe, ils devront passer par un des passages vers le ciel. Zeus, figure d'autorité suprême, pouvait autrefois circuler entre tous les royaumes...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Mais depuis qu'il a perdu son trône, il sent que des choses ont changé. Il faudra permettre aux autres dieux de le suivre dans l'Olympe.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le Mont Olympe depuis la Terre est sûrement gardé et piégé par Hadès et les dieux renégats. Trop risqué. Ils devront passer par ailleurs...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Mais d'abord, la priorité est de rallier d'autres dieux à leur alliance. Direction : Thèbes.",
        emotion: 'neutral'
    }
];

// Arrivée à Thèbes - Recherche de Dionysos
export const CHAPTER2_BATTLE1_THEBES_ARRIVAL: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*observe la ville depuis une rue animée* Nous voilà enfin à Thèbes. Dionysos doit être quelque part dans cette cité...",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "C'est une grande ville. Comment allons-nous le trouver sans nous faire remarquer ?",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Dionysos n'est pas du genre discret. Cherchons les tavernes, les fêtes... les endroits où coule le vin.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Restons prudents. Nous ne savons pas qui pourrait reconnaître des Olympiens en fuite.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*plisse les yeux* Attendez... Là-bas, au fond de la rue !",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Qu'as-tu vu, Artémis ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*pointe du doigt* Un satyre ! Au milieu de la foule ! Regardez !",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Un satyre en pleine ville ? C'est inhabituel... Ils restent généralement près des forêts.",
        emotion: 'surprised'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "C'est un signe ! Les satyres sont les compagnons de Dionysos. Suivons-le !",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*hoche la tête* Bien vu, ma fille. Allons-y, mais restons discrets.",
        emotion: 'determined'
    }
];

// Arrivée au banquet de Dionysos
export const CHAPTER2_BATTLE1_BANQUET: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les quatre dieux suivent le satyre à travers les ruelles de Thèbes jusqu'à un vaste domaine : une somptueuse villa grecque.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Dans le jardin de la villa, un grand banquet est en cours. Des rires, de la musique, et l'odeur enivrante du vin emplissent l'air.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*écarquille les yeux* Regardez ! À la table principale !",
        emotion: 'surprised'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "C'est... c'est Dionysos ! Et il n'est pas seul !",
        emotion: 'surprised'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*sourire* Mon jumeau ! Apollon est là aussi !",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Et Aphrodite... Le destin est avec nous ! Trois alliés potentiels réunis au même endroit !",
        emotion: 'happy'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Dionysos, Apollon et Aphrodite festoient joyeusement. Tous semblent en bonne santé et de bonne humeur. Un soulagement pour nos héros.",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*lève les yeux et aperçoit les arrivants* Par Olympe ! Zeus ! Hestia ! Déméter ! Artémis !",
        emotion: 'surprised'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*se lève* Ma sœur ! *court vers Artémis* Que fais-tu ici ? Et... père ?!",
        emotion: 'happy'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*sourire radieux* Quelle surprise ! Venez, venez, joignez-vous à nous !",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*grave* Nous sommes heureux de vous voir tous sains et saufs, mais... nous devons parler. En privé. C'est urgent.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Oui, ce que nous avons à vous dire ne peut pas attendre. Pouvons-nous écourter le banquet ?",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*fait la moue* Écourter MON banquet ? Mais je serais un mauvais hôte !",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Ça peut attendre un peu, non ? Asseyez-vous, mangez, buvez ! Vous avez l'air épuisés par votre voyage !",
        emotion: 'happy'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*soupire* Dionysos... Tu ne changes pas. Très bien, profitons un moment, mais il faudra vite parler.",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Sans donner trop de détails pour l'instant... sachez que nous apportons des nouvelles graves de l'Olympe.",
        emotion: 'sad'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*fronce les sourcils* Graves ? Que s'est-il passé ?",
        emotion: 'worried'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Plus tard, mon fils. Acceptons l'invitation de Dionysos pour l'instant. Nous en parlerons quand nous serons seuls.",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*lève son verre* Parfait ! Bienvenue à tous ! Que la fête continue !",
        emotion: 'happy'
    }
];

// Discussion privée - La trahison
export const CHAPTER2_BATTLE1_BETRAYAL: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le temps passe. Les invités du banquet se retirent peu à peu. Finalement, les sept dieux se retrouvent seuls dans la villa de Dionysos.",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*verse du vin dans des coupes* Bien ! Maintenant que nous sommes entre nous... Que vouliez-vous nous dire ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Je vous propose d'en parler en dégustant ce merveilleux cru. C'est ma meilleure réserve !",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*prend une coupe* Merci, Dionysos. Ce que nous allons vous révéler est... difficile à entendre.",
        emotion: 'sad'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Zeus explique tout : la trahison d'Hadès, l'attaque surprise de Nyx, la perte de l'Olympe, la fuite, les combats contre Arès...",
        emotion: 'neutral'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*choqué* Hadès règne sur l'Olympe ?! Mais c'est impossible !",
        emotion: 'surprised'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*pose sa coupe* Et Arès... Il a vraiment rejoint Hadès ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Oui. Arès nous a attaqués deux fois déjà. Il est convaincu qu'Hadès lui donnera plus de pouvoir.",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*boit du vin* Nous avons besoin de votre aide pour... pour...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*porte la main à sa tête* Je... Je ne me sens pas bien...",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*chancelle* Moi non plus... Ma tête tourne...",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*se lève brusquement, renversant sa coupe* Non... Non, ce n'est pas possible !",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*comprend avec horreur* Le vin... Le vin est EMPOISONNÉ !",
        emotion: 'angry'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*se lève lentement, un sourire froid sur les lèvres* Bravo, Artémis. Toujours aussi perspicace.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*s'appuie sur la table* Aphrodite... Qu'as-tu fait ?!",
        emotion: 'angry'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*froide* J'ai fait ce qu'il fallait. Arès m'a tout raconté avant vous, vous savez.",
        emotion: 'determined'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "Il m'a dit comment VOUS êtes les véritables traîtres. Comment vous voulez détruire l'équilibre du monde !",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*outragée* Des mensonges ! C'est Arès le traître !",
        emotion: 'angry'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "J'ai charmé Dionysos pour qu'il m'aide à venger mon Arès ! Et ça a parfaitement fonctionné.",
        emotion: 'happy'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*regarde Dionysos* Il est... envoûté. Ses yeux sont vides !",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*s'accroche à une chaise* Et Apollon ? Où est Apollon ?!",
        emotion: 'worried'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*rit* Oh, Apollon ? Dionysos lui a servi une dose spéciale. Il délire déjà dans l'autre pièce, le pauvre.",
        emotion: 'happy'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*voix monotone, yeux vitreux* La maîtresse a ordonné. J'obéis. Le poison coule dans vos veines...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*serrant les poings malgré la douleur* Aphrodite... Tu as été manipulée ! Arès t'a menti !",
        emotion: 'angry'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*regard froid* Nous verrons bien qui ment. Finissons-en ! Dionysos, Apollon... ATTAQUEZ !",
        emotion: 'angry'
    }
];

// Victoire du Combat 1 du Chapitre 2
export const CHAPTER2_BATTLE1_WIN: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Malgré le poison qui affaiblit leurs corps, Zeus, Hestia, Déméter et Artémis parviennent à vaincre leurs assaillants.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*essoufflé, s'appuie sur un pilier* C'est... C'est terminé...",
        emotion: 'neutral'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*à genoux, regarde ses mains trembler* Comment... Comment est-ce possible ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*s'approche d'Aphrodite* Écoute-moi bien, Aphrodite. Arès t'a MENTI.",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Hadès a pris le trône de l'Olympe par la force et la traîtrise. C'est LUI le véritable ennemi !",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*doucement* Arès a rejoint Hadès pour le pouvoir. Il t'a utilisée, Aphrodite. Comme il utilise tout le monde.",
        emotion: 'sad'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*les larmes aux yeux* Mais il m'a dit... Il m'a promis que...",
        emotion: 'sad'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*s'agenouille devant elle* Aphrodite, tu es la déesse de l'amour. Cherche dans ton cœur. Qui ment vraiment ici ?",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le regard d'Aphrodite vacille. Les vérités de ses actes la frappent comme une vague de clarté...",
        emotion: 'neutral'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*effondrée* Je... J'ai été aveuglée... Par mes sentiments pour Arès. Pardonnez-moi !",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Libère Dionysos de ton charme. Maintenant.",
        emotion: 'determined'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*ferme les yeux, une aura rose l'entoure puis se dissipe* C'est fait... Je le libère.",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*secoue la tête, hébété* Qu'est-ce que... Où suis-je ? Ma tête... Que s'est-il passé ?!",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Dionysos ! Tu as l'antidote au poison que tu nous as servi ?",
        emotion: 'worried'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*horrifié* Le poison ?! PAR OLYMPE ! Oui, oui, j'ai l'antidote dans ma cave ! Je... Je me souviens de tout maintenant !",
        emotion: 'surprised'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Apollon aussi a été empoisonné. Il est dans l'autre pièce.",
        emotion: 'worried'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*court vers la porte* Je vais chercher l'antidote immédiatement ! Tenez bon !",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Dionysos administre l'antidote à tous. Apollon reprend conscience, confus mais soulagé d'être libéré du délire.",
        emotion: 'neutral'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*se relève péniblement* Ma sœur... Père... Qu'est-ce qui m'est arrivé ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*le serre dans ses bras* C'est une longue histoire, mon jumeau. Mais nous sommes ensemble maintenant. C'est l'essentiel.",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*regarde le groupe* Nous avons failli nous entre-tuer à cause des machinations d'Hadès et Arès.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Mais le destin nous a réunis. Sept dieux... Sept alliés contre les ténèbres. L'espoir n'est pas perdu.",
        emotion: 'determined'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*essuie ses larmes* Je ferai tout pour réparer mes erreurs. Je vous le jure.",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Et moi je vous dois des explications... et beaucoup de vin non empoisonné, cette fois !",
        emotion: 'happy'
    }
];

// Défaite du Combat 1 du Chapitre 2
export const CHAPTER2_BATTLE1_LOSE: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le poison fait son effet. Un par un, Zeus, Hestia, Déméter et Artémis s'effondrent...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*s'écroule au sol* Non... Nous... avons échoué...",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*tombe à genoux* Le poison... est trop fort...",
        emotion: 'sad'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*triomphante* Parfait ! Arès sera si fier de moi !",
        emotion: 'happy'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*rampe vers Hestia inconsciente* Ma sœur... Perséphone... je ne te reverrai jamais...",
        emotion: 'sad'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*voix monotone* Les traîtres sont vaincus. La maîtresse a gagné.",
        emotion: 'neutral'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*s'approche de Zeus* Le puissant roi des dieux... à mes pieds. Arès avait raison.",
        emotion: 'happy'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "Envoyons un message à Hadès. Ses ennemis ont été... neutralisés.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La résistance s'éteint avant même d'avoir pu rallier ses alliés. Le règne d'Hadès est désormais incontesté...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "L'Olympe sombre dans les ténèbres éternelles. L'équilibre du monde est rompu à jamais...",
        emotion: 'neutral'
    }
];

// ===========================================
// COMBAT 2 DU CHAPITRE 2 - LE DRAGON DE THÈBES
// Zeus + Aphrodite + Apollon + Dionysos vs Dragon
// ===========================================

// Narrateur - Le matin à la villa de Dionysos
export const CHAPTER2_BATTLE2_NARRATOR: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La nuit a été agitée, mais les sept dieux ont finalement pu se reposer dans la villa de Dionysos.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Au petit matin, rassemblés autour d'une table couverte de cartes et de parchemins, ils font le point sur leur itinéraire.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Leur destination : Athènes, où Athéna les attend. Mais le chemin le plus court depuis Thèbes passe par le Bois de Colone...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ce bois sacré est fortement lié à Hadès et aux Érinyes, les terribles Furies vengeresses.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "L'autre chemin leur ferait perdre plusieurs jours précieux. Dans l'état actuel des choses, ils n'ont pas le choix : le temps presse.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ils devront traverser le Bois de Colone avec prudence et vigilance. Les dangers qui les y attendent sont innombrables...",
        emotion: 'neutral'
    }
];

// Dialogue de départ - Les 7 dieux quittent Thèbes
export const CHAPTER2_BATTLE2_DEPARTURE: DialogueLine[] = [
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*ajuste sa cape* En route. Plus vite nous atteindrons Athènes, mieux ce sera.",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*soupire* Adieu ma belle villa... J'espère qu'elle sera encore debout à mon retour.",
        emotion: 'sad'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*marche à côté de lui* Je suis vraiment désolée pour ce que j'ai fait, Dionysos. Arès m'avait promis...",
        emotion: 'sad'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*léger sourire* Tu m'as envoûté, c'est vrai. Mais j'ai connu pire ivresse, crois-moi.",
        emotion: 'neutral'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*se frotte les tempes* Ce poison... Ma tête résonne encore comme une lyre mal accordée.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*à son frère jumeau* Tu devrais rester en arrière avec moi. Mes sens sont plus aiguisés.",
        emotion: 'neutral'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "Comme toujours, sœur, tu me sous-estimes. J'ai survécu à cette folie, non ?",
        emotion: 'happy'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*observe les champs* La terre ici est fertile. Dommage que nous ne puissions pas rester plus longtemps.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*marche aux côtés de Déméter* Ce qui m'inquiète, c'est le Bois de Colone. Les récits parlent de créatures terrifiantes.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Les Érinyes répondent aux ordres d'Hadès. Elles nous poursuivront si elles nous repèrent.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Pas si je les repère en premier. *tapote son arc* Restez groupés et suivez mes signaux.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les sept dieux s'éloignent de Thèbes, laissant derrière eux la cité et ses souvenirs amers...",
        emotion: 'neutral'
    }
];

// Dialogue avant combat - L'attaque du Dragon
export const CHAPTER2_BATTLE2_DRAGON_ATTACK: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Plusieurs heures de marche plus tard, le groupe traverse une paisible prairie bordée d'un cours d'eau cristallin.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "L'atmosphère est étrangement calme. Trop calme. Même les oiseaux ont cessé de chanter...",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*s'arrête brusquement* Attendez. Quelque chose approche. Quelque chose de... massif.",
        emotion: 'surprised'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Soudain, une ombre gigantesque obscurcit le soleil. Un rugissement primal déchire le silence !",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "BOOOM ! Une créature ailée s'abat au milieu du groupe à une vitesse fulgurante !",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*projetée au sol* AARGH !",
        emotion: 'surprised'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*s'effondre* Non... le choc...",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*renversée par une aile géante* Je ne l'ai pas vu venir... !",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*se relève péniblement* Qu'est-ce que... Par les Titans !",
        emotion: 'surprised'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Devant eux se dresse un dragon colossal, ses écailles noires brillant sous le soleil, ses ailes membraneuses déployées.",
        emotion: 'neutral'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*pâlit* Non... C'est impossible ! Le Dragon de Thèbes ?!",
        emotion: 'surprised'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "Mais Cadmos l'a vaincu il y a des siècles ! C'est dans toutes les chroniques !",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*observe la bête* Ce n'est pas le même. Regarde-le... Il est différent. Plus grand. Plus... évolué.",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Le dragon originel était une créature d'Arès... né de son sang divin, dit-on.",
        emotion: 'neutral'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*recule* Il devait avoir pondu un œuf avant de mourir... Et de cet œuf est né... ça.",
        emotion: 'surprised'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "Les récits décrivaient un grand serpent, un reptile. Celui-ci est un véritable dragon ailé !",
        emotion: 'surprised'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La créature rugit, ses yeux brûlant d'une intelligence malveillante. Elle a grandi dans l'ombre, plus puissante que son ancêtre.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*invoque sa foudre* Hestia, Déméter et Artémis sont inconscientes. Nous devons les protéger !",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*fait apparaître ses vignes* Je suis avec toi, Zeus. Ce monstre sera terrassé !",
        emotion: 'determined'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*brandit sa lyre* Ma musique peut l'affaiblir ! Ensemble, nous pouvons le vaincre !",
        emotion: 'determined'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*concentre son pouvoir* Je dois me racheter. Que mon charme devienne une arme !",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Quatre dieux face à un dragon légendaire. Le combat s'annonce brutal et impitoyable...",
        emotion: 'neutral'
    }
];

// Victoire du Combat 2
export const CHAPTER2_BATTLE2_WIN: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Dans un dernier rugissement de douleur, le Dragon de Thèbes s'effondre, vaincu par les quatre dieux.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*essoufflé* C'est... terminé. La bête est morte.",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*s'appuie sur ses genoux* Par Bacchus... Quelle créature ! J'ai cru qu'on y passerait tous.",
        emotion: 'neutral'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*range sa lyre* Mes harmonies ont trouvé sa faiblesse. Même les dragons ne résistent pas à la musique divine !",
        emotion: 'happy'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*court vers les autres* Artémis ! Hestia ! Déméter ! Réveillez-vous !",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*reprend conscience* Qu'est-ce qui... Le dragon ? Où est-il ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*se relève péniblement* Ma tête... J'ai vu une ombre et puis... plus rien.",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*observe la carcasse du dragon* Vous l'avez vaincu ? Tous les quatre ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "La progéniture d'Arès, plus puissante que l'original. Mais nous avons tenu bon.",
        emotion: 'determined'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "Cette créature gardait-elle le Bois de Colone ? Arès l'a peut-être envoyée pour nous intercepter.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*vérifie son arc* Peu importe. La route vers Athènes est maintenant dégagée.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Les sept dieux, réunis une fois de plus, reprennent leur marche vers Athènes. Leur alliance se forge dans l'adversité...",
        emotion: 'neutral'
    }
];

// Défaite du Combat 2
export const CHAPTER2_BATTLE2_LOSE: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le souffle du dragon balaie les quatre dieux restants. Un par un, ils s'effondrent...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*à genoux* Non... Nous n'étions pas... assez forts...",
        emotion: 'sad'
    },
    {
        speakerId: 'apollon',
        speakerName: 'Apollon',
        text: "*lâche sa lyre* La mélodie... s'éteint...",
        emotion: 'sad'
    },
    {
        speakerId: 'dionysos',
        speakerName: 'Dionysos',
        text: "*s'écroule* Les vignes... ne peuvent plus m'aider...",
        emotion: 'sad'
    },
    {
        speakerId: 'aphrodite',
        speakerName: 'Aphrodite',
        text: "*impuissante* Encore... un échec... Je ne peux pas...",
        emotion: 'sad'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le Dragon de Thèbes rugit victorieusement. Sept dieux gisent inconscients à ses pieds.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La résistance contre Hadès s'effondre ce jour-là, dévorée par le monstre né du sang d'Arès...",
        emotion: 'neutral'
    }
];

// Fin du Chapitre 2 (temporaire - gardé pour compatibilité)
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

// ===========================================
// COMBAT 4 - L'EMBUSCADE D'ARÈS
// ===========================================

// Narrateur - Introduction combat 4
export const PROLOGUE_BATTLE4_NARRATOR: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Dès la fin du test de bravoure, les quatre dieux ont pris la route sans attendre.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Durant le trajet, ils ont beaucoup discuté. Déméter a été formelle : pour vaincre Hadès, ils ont absolument besoin de Poséidon.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Poséidon, frère de Zeus et Hadès. Sa maîtrise des océans pourrait renverser l'équilibre. Toute autre aide sera bienvenue, mais lui est indispensable.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La seule capable de le trouver est Athéna, fille de Zeus. Ces deux-là ont toujours partagé un lien unique... une rivalité teintée de respect mutuel.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Le groupe décide donc de se rendre à Athènes, où Athéna se trouve certainement.",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La nuit tombe. Une ferme isolée leur offre un refuge temporaire pour se reposer avant de reprendre la route...",
        emotion: 'neutral'
    }
];

// Dialogue du conseil des 4 dieux
export const PROLOGUE_BATTLE4_COUNCIL: DialogueLine[] = [
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*regarde la carte* En regardant la route... Je réalise que nous allons devoir passer par Thèbes. C'est le chemin le plus rapide vers Athènes.",
        emotion: 'worried'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*inquiète* Mais nous ne pouvons pas ! Thèbes est une ville guerrière où Arès est vénéré comme un dieu suprême.",
        emotion: 'worried'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Il sera sûrement là-bas, et cette fois il ne sera pas seul. Des hommes lui sont fidèles, des guerriers qui tueraient pour lui.",
        emotion: 'worried'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*pensive* Justement... Thèbes. J'y ai réfléchi. Nous devrions y faire un détour.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "Quoi ? Mais je viens de dire que—",
        emotion: 'surprised'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Écoute-moi. À Thèbes se trouve Dionysos. J'ai des contacts avec lui pour le commerce agricole — le blé pour son vin.",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Il pourrait être un allié précieux. Si l'équilibre du monde change, il ne pourra plus s'amuser, festoyer, vivre...",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*acquiesce* Je sais que mon jumeau Apollon traîne souvent avec lui là-bas. Ils se querellent gentiment, mais ils sont proches.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Apollon est le dieu de la lumière et de la raison. Il serait logique qu'il rejoigne notre cause. J'y avais déjà pensé...",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Et il y a autre chose. Aphrodite entretient une relation... intime avec Arès. Elle pourrait être dans les parages.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*hausse un sourcil* Aphrodite ? Tu penses qu'elle pourrait le raisonner ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Peut-être. Ce n'est pas à négliger. Dionysos est aussi attiré par elle... et tout le monde s'est toujours demandé si c'était réciproque.",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "La déesse de l'amour est contre le conflit par nature. Si elle rejoint notre cause...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*voix grave, fatiguée* Arès...",
        emotion: 'sad'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Tous se tournent vers Zeus, qui est resté silencieux pendant toute la discussion, le regard perdu dans les flammes.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Je suis... déçu de mon fils. De ce qu'il est devenu.",
        emotion: 'sad'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*froidement* Je ne suis pas surprise de mon frère. Il veut la gloire, le pouvoir, la reconnaissance.",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Il pense être le plus fort, pouvoir tout se permettre. Mais au fond... il est faible. Il n'a rien d'un leader.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*regarde Artémis* Ma fille...",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Je suis fier de la femme que tu es devenue. Tu es courageuse, brillante, inébranlable... Une véritable guerrière. Tout ce qu'un père peut rêver.",
        emotion: 'happy'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Un long silence s'installe dans la pièce. Les flammes crépitent. Les événements récents font sortir beaucoup de vérités et de choses non dites...",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*émue, surprise* Zeus... Je ne t'ai jamais entendu parler ainsi. Tu... tu as changé.",
        emotion: 'surprised'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Avec tout ce qui se passe... je m'inquiète pour ma fille Perséphone. Elle est toujours prisonnière des Enfers...",
        emotion: 'worried'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*pose sa main sur celle de Déméter* Quand tout cela sera terminé, je m'engage à t'aider. Nous trouverons une solution pour la libérer.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ce moment solennel montre que malgré le passé de tous, cette alliance est possible. Et peut-être que l'avenir sera radieux à la fin de tout ça.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Alors nous sommes d'accord. Demain à l'aube, nous partons pour Thèbes.",
        emotion: 'determined'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*soupire* Que les dieux nous protègent... même si nous sommes les dieux. Bonne nuit à tous.",
        emotion: 'neutral'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Bonne nuit. Reposez-vous bien. Demain sera une longue journée.",
        emotion: 'neutral'
    }
];

// L'attaque nocturne d'Arès
export const PROLOGUE_BATTLE4_AMBUSH: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "La nuit est profonde. Tous dorment d'un sommeil agité...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Soudain, un bruit sourd et assourdissant déchire le silence !",
        emotion: 'neutral'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*défonce la porte* PÈRE ! Tu pensais pouvoir te cacher de moi ?!",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Arès n'est pas seul. Deux guerriers en armure l'accompagnent — des hommes fidèles, prêts à mourir pour leur dieu.",
        emotion: 'neutral'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*se lève brusquement* Arès ! Tu nous as suivis ?!",
        emotion: 'surprised'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*rire cruel* Je n'étais jamais loin. Ma défaite lors de notre dernier combat... Je n'ai pas digéré cette humiliation !",
        emotion: 'angry'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Où est Hestia ?! HESTIA !",
        emotion: 'worried'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*montre le corps inconscient* La douce Hestia ? Elle m'avait humilié en aidant mon père à me battre. Mes soldats l'ont assommée en premier.",
        emotion: 'happy'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*attrape son arc* Tu vas payer pour ça, Arès !",
        emotion: 'angry'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Cette fois, c'est VOUS qui allez tomber ! Soldats, à l'attaque !",
        emotion: 'angry'
    }
];

// Victoire combat 4
export const PROLOGUE_BATTLE4_WIN: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Malgré l'effet de surprise, Zeus, Déméter et Artémis parviennent à repousser Arès et ses soldats.",
        emotion: 'neutral'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*à genoux, blessé* Impossible... Encore une fois...",
        emotion: 'angry'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*le domine de toute sa hauteur* Tu aurais pu choisir la famille, Arès. Tu as choisi la guerre.",
        emotion: 'determined'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*pointe une flèche* Donne-moi une raison de ne pas te transpercer le cœur.",
        emotion: 'angry'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*crache du sang* Fais-le. Mais sache que d'autres viendront. Hadès ne s'arrêtera jamais.",
        emotion: 'determined'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "Hestia ! *court vers elle* Elle respire... Elle va s'en sortir.",
        emotion: 'neutral'
    },
    {
        speakerId: 'hestia',
        speakerName: 'Hestia',
        text: "*reprend conscience* Ma tête... Qu'est-ce qui s'est passé ?",
        emotion: 'surprised'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "Arès a tenté de nous éliminer. Mais nous avons tenu bon. *se tourne vers Arès* Pars. Et ne reviens plus.",
        emotion: 'determined'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*se relève péniblement* Ce n'est pas fini, père. Loin de là...",
        emotion: 'angry'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Arès bat en retraite avec ses soldats blessés. L'aube se lève sur la ferme en ruines.",
        emotion: 'neutral'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "Nous devons partir immédiatement pour Thèbes. Avant qu'il ne revienne avec des renforts.",
        emotion: 'determined'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*hoche la tête* Tu as raison. La route sera dangereuse, mais nous n'avons pas le choix.",
        emotion: 'determined'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "Ainsi s'achève le prologue. L'alliance des dieux résiste, et leur quête continue vers Thèbes...",
        emotion: 'neutral'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "FIN DU CHAPITRE 1 - LA TRAHISON",
        emotion: 'neutral'
    }
];

// Défaite combat 4
export const PROLOGUE_BATTLE4_LOSE: DialogueLine[] = [
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "L'attaque surprise a été trop efficace. Sans Hestia, l'équilibre de l'équipe est rompu.",
        emotion: 'neutral'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "*triomphant* HA ! Voyez comme ils tombent ! Le grand Zeus, à mes pieds !",
        emotion: 'happy'
    },
    {
        speakerId: 'zeus',
        speakerName: 'Zeus',
        text: "*à bout de forces* Arès... Tu aurais pu être... un grand guerrier...",
        emotion: 'sad'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Je SUIS un grand guerrier ! Et maintenant, père, tu vas comprendre ce que ça fait d'être vaincu et humilié !",
        emotion: 'angry'
    },
    {
        speakerId: 'artemis',
        speakerName: 'Artémis',
        text: "*s'effondre* Non... Nous avons échoué...",
        emotion: 'sad'
    },
    {
        speakerId: 'demeter',
        speakerName: 'Déméter',
        text: "*protège Hestia inconsciente* Perséphone... Je ne te reverrai jamais...",
        emotion: 'sad'
    },
    {
        speakerId: 'ares',
        speakerName: 'Arès',
        text: "Emmenez-les à Hadès. Il sera ravi de ces... cadeaux.",
        emotion: 'happy'
    },
    {
        speakerId: 'narrator',
        speakerName: 'Narrateur',
        text: "L'espoir s'éteint. L'alliance naissante des dieux est brisée avant même d'avoir pu accomplir sa mission...",
        emotion: 'neutral'
    }
];
