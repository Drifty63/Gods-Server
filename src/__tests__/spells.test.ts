/**
 * Tests unitaires pour les sorts du jeu GODS
 * Vérifie la structure, la cohérence et la validité de tous les sorts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ALL_SPELLS, getSpellsByGodId, validateDeck } from '@/data/spells';
import { ALL_GODS } from '@/data/gods';
import { SpellCard, SpellEffect, Element, SpellType } from '@/types/cards';

// =====================================================
// CONFIGURATION DES TESTS
// =====================================================

const VALID_ELEMENTS: Element[] = ['fire', 'air', 'earth', 'lightning', 'water', 'light', 'darkness'];
const VALID_SPELL_TYPES: SpellType[] = ['generator', 'competence', 'utility'];
const VALID_EFFECT_TYPES = ['damage', 'heal', 'shield', 'energy', 'draw', 'discard', 'mill', 'status', 'remove_status', 'custom'];
const VALID_TARGET_TYPES = ['enemy_god', 'all_enemies', 'ally_god', 'all_allies', 'self', 'any_god', 'all_gods', 'dead_ally_god', 'enemy_hand', 'same'];

// Dieux jouables (non cachés, non ennemis histoire)
const PLAYABLE_GOD_IDS = ALL_GODS
    .filter(god => !god.hidden)
    .map(god => god.id);

// =====================================================
// TESTS DE STRUCTURE DES SORTS
// =====================================================

describe('Structure des sorts', () => {
    it('devrait avoir au moins 60 sorts (12 dieux × 5 sorts)', () => {
        expect(ALL_SPELLS.length).toBeGreaterThanOrEqual(60);
    });

    it('chaque sort devrait avoir un ID unique', () => {
        const ids = ALL_SPELLS.map(spell => spell.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('chaque sort devrait avoir toutes les propriétés requises', () => {
        ALL_SPELLS.forEach(spell => {
            expect(spell).toHaveProperty('id');
            expect(spell).toHaveProperty('name');
            expect(spell).toHaveProperty('element');
            expect(spell).toHaveProperty('godId');
            expect(spell).toHaveProperty('type');
            expect(spell).toHaveProperty('energyCost');
            expect(spell).toHaveProperty('energyGain');
            expect(spell).toHaveProperty('effects');
            expect(spell).toHaveProperty('imageUrl');
            expect(spell).toHaveProperty('description');
        });
    });

    it('chaque sort devrait avoir un élément valide', () => {
        ALL_SPELLS.forEach(spell => {
            expect(VALID_ELEMENTS).toContain(spell.element);
        });
    });

    it('chaque sort devrait avoir un type valide', () => {
        ALL_SPELLS.forEach(spell => {
            expect(VALID_SPELL_TYPES).toContain(spell.type);
        });
    });

    it('les coûts et gains d\'énergie devraient être des nombres non négatifs', () => {
        ALL_SPELLS.forEach(spell => {
            expect(spell.energyCost).toBeGreaterThanOrEqual(0);
            expect(spell.energyGain).toBeGreaterThanOrEqual(0);
        });
    });

    it('les effets devraient être un tableau non vide', () => {
        ALL_SPELLS.forEach(spell => {
            expect(Array.isArray(spell.effects)).toBe(true);
            expect(spell.effects.length).toBeGreaterThan(0);
        });
    });
});

// =====================================================
// TESTS DES EFFETS
// =====================================================

describe('Effets des sorts', () => {
    it('chaque effet devrait avoir un type valide', () => {
        ALL_SPELLS.forEach(spell => {
            spell.effects.forEach(effect => {
                expect(VALID_EFFECT_TYPES).toContain(effect.type);
            });
        });
    });

    it('les effets avec target devraient avoir une cible valide', () => {
        ALL_SPELLS.forEach(spell => {
            spell.effects.forEach(effect => {
                if (effect.target) {
                    expect(VALID_TARGET_TYPES).toContain(effect.target);
                }
            });
        });
    });

    it('les effets damage/heal/shield devraient avoir une valeur positive', () => {
        ALL_SPELLS.forEach(spell => {
            spell.effects.forEach(effect => {
                if (['damage', 'heal', 'shield'].includes(effect.type)) {
                    expect(effect.value).toBeDefined();
                    expect(effect.value).toBeGreaterThan(0);
                }
            });
        });
    });

    it('les effets status devraient avoir un statut défini', () => {
        ALL_SPELLS.forEach(spell => {
            spell.effects.forEach(effect => {
                if (effect.type === 'status') {
                    expect(effect.status).toBeDefined();
                }
            });
        });
    });

    it('les effets custom devraient avoir un customEffectId', () => {
        ALL_SPELLS.forEach(spell => {
            spell.effects.forEach(effect => {
                if (effect.type === 'custom') {
                    expect(effect.customEffectId).toBeDefined();
                    expect(effect.customEffectId).not.toBe('');
                }
            });
        });
    });
});

// =====================================================
// TESTS PAR TYPE DE SORT
// =====================================================

describe('Sorts Générateurs', () => {
    const generators = ALL_SPELLS.filter(s => s.type === 'generator');

    it('la majorité des générateurs devraient avoir un coût de 0', () => {
        const zeroGostGenerators = generators.filter(s => s.energyCost === 0);
        // Au moins 80% des générateurs ont un coût de 0
        expect(zeroGostGenerators.length / generators.length).toBeGreaterThanOrEqual(0.8);
    });

    it('les générateurs devraient générer de l\'énergie', () => {
        generators.forEach(spell => {
            expect(spell.energyGain).toBeGreaterThan(0);
        });
    });
});

describe('Sorts Compétences', () => {
    const competences = ALL_SPELLS.filter(s => s.type === 'competence');

    it('les compétences devraient avoir un coût > 0', () => {
        competences.forEach(spell => {
            expect(spell.energyCost).toBeGreaterThan(0);
        });
    });

    it('la majorité des compétences ne devraient pas générer d\'énergie', () => {
        const zeroGainCompetences = competences.filter(s => s.energyGain === 0);
        // Au moins 80% des compétences ne génèrent pas d'énergie
        expect(zeroGainCompetences.length / competences.length).toBeGreaterThanOrEqual(0.8);
    });
});

describe('Sorts Utilitaires', () => {
    const utilities = ALL_SPELLS.filter(s => s.type === 'utility');

    it('il devrait y avoir des sorts utilitaires', () => {
        expect(utilities.length).toBeGreaterThan(0);
    });
});

// =====================================================
// TESTS PAR DIEU
// =====================================================

describe('Sorts par dieu jouable', () => {
    PLAYABLE_GOD_IDS.forEach(godId => {
        describe(`Dieu: ${godId}`, () => {
            const godSpells = getSpellsByGodId(godId);

            it(`devrait avoir exactement 5 sorts`, () => {
                expect(godSpells.length).toBe(5);
            });

            it(`devrait avoir 2 générateurs`, () => {
                const generators = godSpells.filter(s => s.type === 'generator');
                expect(generators.length).toBe(2);
            });

            it(`devrait avoir 2 compétences`, () => {
                const competences = godSpells.filter(s => s.type === 'competence');
                expect(competences.length).toBe(2);
            });

            it(`devrait avoir 1 utilitaire`, () => {
                const utilities = godSpells.filter(s => s.type === 'utility');
                expect(utilities.length).toBe(1);
            });

            it(`tous les sorts devraient référencer le bon godId`, () => {
                godSpells.forEach(spell => {
                    expect(spell.godId).toBe(godId);
                });
            });

            it(`l'élément des sorts devrait correspondre à l'élément du dieu`, () => {
                const god = ALL_GODS.find(g => g.id === godId);
                if (god) {
                    godSpells.forEach(spell => {
                        expect(spell.element).toBe(god.element);
                    });
                }
            });
        });
    });
});

// =====================================================
// TESTS DES HELPERS
// =====================================================

describe('Helper getSpellsByGodId', () => {
    it('devrait retourner les sorts d\'un dieu existant', () => {
        const poseidonSpells = getSpellsByGodId('poseidon');
        expect(poseidonSpells.length).toBe(5);
        expect(poseidonSpells.every(s => s.godId === 'poseidon')).toBe(true);
    });

    it('devrait retourner un tableau vide pour un dieu inexistant', () => {
        const unknownSpells = getSpellsByGodId('unknown_god');
        expect(unknownSpells.length).toBe(0);
    });
});

describe('Helper validateDeck', () => {
    it('devrait valider un deck correct de 4 dieux', () => {
        const godIds = ['poseidon', 'zeus', 'hestia', 'athena'];
        const spells = godIds.flatMap(id => getSpellsByGodId(id));
        const result = validateDeck(godIds, spells);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('devrait rejeter un deck avec moins de 4 dieux', () => {
        const godIds = ['poseidon', 'zeus'];
        const spells = godIds.flatMap(id => getSpellsByGodId(id));
        const result = validateDeck(godIds, spells);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('4 dieux'))).toBe(true);
    });
});

// =====================================================
// TESTS DE COHÉRENCE GLOBALE
// =====================================================

describe('Cohérence globale', () => {
    it('tous les godId référencés dans les sorts devraient exister', () => {
        const allGodIds = ALL_GODS.map(g => g.id);
        ALL_SPELLS.forEach(spell => {
            expect(allGodIds).toContain(spell.godId);
        });
    });

    it('les URLs d\'images devraient commencer par /', () => {
        ALL_SPELLS.forEach(spell => {
            expect(spell.imageUrl.startsWith('/')).toBe(true);
        });
    });

    it('les descriptions ne devraient pas être vides', () => {
        ALL_SPELLS.forEach(spell => {
            expect(spell.description.length).toBeGreaterThan(0);
        });
    });

    it('les noms ne devraient pas être vides', () => {
        ALL_SPELLS.forEach(spell => {
            expect(spell.name.length).toBeGreaterThan(0);
        });
    });
});

// =====================================================
// TESTS DES EFFETS SPÉCIAUX (CUSTOM)
// =====================================================

describe('Effets custom', () => {
    const spellsWithCustom = ALL_SPELLS.filter(s =>
        s.effects.some(e => e.type === 'custom')
    );

    it('les effets custom devraient avoir une description', () => {
        spellsWithCustom.forEach(spell => {
            spell.effects
                .filter(e => e.type === 'custom')
                .forEach(effect => {
                    expect(effect.description).toBeDefined();
                    expect(effect.description!.length).toBeGreaterThan(0);
                });
        });
    });

    it('les customEffectId devraient être en snake_case', () => {
        spellsWithCustom.forEach(spell => {
            spell.effects
                .filter(e => e.type === 'custom')
                .forEach(effect => {
                    // Vérifie que c'est en snake_case (lettres minuscules, chiffres et underscores)
                    expect(effect.customEffectId).toMatch(/^[a-z0-9_]+$/);
                });
        });
    });
});

// =====================================================
// TESTS DE BALANCE (INFORMATIFS)
// =====================================================

describe('Balance des sorts (informatif)', () => {
    it('rapport coût/dégâts des compétences', () => {
        const competences = ALL_SPELLS.filter(s => s.type === 'competence');

        competences.forEach(spell => {
            const totalDamage = spell.effects
                .filter(e => e.type === 'damage')
                .reduce((sum, e) => sum + (e.value || 0), 0);

            const ratio = totalDamage / spell.energyCost;

            // Log pour analyse (ne fait pas échouer le test)
            // console.log(`${spell.name}: ${totalDamage} dmg / ${spell.energyCost} cost = ${ratio.toFixed(2)} ratio`);

            // Les sorts devraient avoir un ratio raisonnable
            // (pas plus de 10 dégâts par point d'énergie en moyenne)
            if (totalDamage > 0) {
                expect(ratio).toBeLessThanOrEqual(10);
            }
        });
    });

    it('les générateurs devraient infliger au moins 1 dégât', () => {
        const generators = ALL_SPELLS.filter(s => s.type === 'generator');

        generators.forEach(spell => {
            const hasDamage = spell.effects.some(e =>
                e.type === 'damage' || e.type === 'custom'
            );
            expect(hasDamage).toBe(true);
        });
    });
});
