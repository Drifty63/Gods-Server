import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    STARTER_PACKS as CLIENT_PACKS,
    GOD_PRICE as CLIENT_GOD_PRICE,
    GOD_PROMO_PRICE as CLIENT_PROMO_PRICE,
    COFFRET_PRICE as CLIENT_COFFRET_PRICE,
} from '@/services/supabase-profile';
import * as SERVER from '../../supabase/functions/_shared/game-data';
import { floorReward, ascensionFloorBonus, TOTAL_FLOORS } from '@/data/ascension';

/**
 * Parité des données d'ARGENT entre le client, les fonctions serveur et la base.
 *
 * Les prix, le contenu des coffrets et les barèmes d'ambroisie existent en TROIS exemplaires :
 * l'écran (qui les annonce), les fonctions Edge (qui débitent) et les fonctions SQL (qui
 * créditent). C'est le défaut qui revient sans cesse dans ce projet — une table recopiée finit
 * toujours par diverger — et ici il ne se voit pas : la boutique afficherait un prix et le serveur
 * en prélèverait un autre, ou le joueur gagnerait moins que ce que l'écran lui promettait.
 *
 * Les vraies opérations (débit, plafond) vivent en SQL et ne peuvent pas être testées sans base.
 * Ce qui PEUT l'être, c'est que les trois exemplaires disent la même chose — et ce test lit
 * directement le texte des migrations pour en être sûr.
 */

const migration = (name: string) =>
    fs.readFileSync(path.join(__dirname, '../../supabase/migrations', name), 'utf8');

describe('boutique : ce que l’écran annonce est ce que le serveur prélève', () => {
    it('même prix de coffret', () => {
        expect(CLIENT_COFFRET_PRICE).toBe(SERVER.COFFRET_PRICE);
    });

    it('même prix de dieu, promotion comprise', () => {
        expect(CLIENT_GOD_PRICE).toBe(SERVER.GOD_PRICE);
        expect(CLIENT_PROMO_PRICE).toBe(SERVER.GOD_PROMO_PRICE);
    });

    it('même contenu pour chaque coffret', () => {
        // Un dieu ajouté côté écran mais pas côté serveur serait affiché dans le coffret et
        // jamais livré — après que le joueur a payé.
        expect(Object.keys(CLIENT_PACKS).sort()).toEqual(Object.keys(SERVER.STARTER_PACKS).sort());
        for (const id of Object.keys(CLIENT_PACKS) as (keyof typeof CLIENT_PACKS)[]) {
            expect([...CLIENT_PACKS[id].godIds], `coffret ${id}`)
                .toEqual([...SERVER.STARTER_PACKS[id].godIds]);
        }
    });
});

describe('ascension : ce que l’écran promet est ce que la base verse', () => {
    const sqlRun = migration('20261001140000_close_cheat_surface.sql');
    const sqlBonus = migration('20260911120000_unique_rewards_quests_bugs.sql');

    /** Récompense maximale d'un run jusqu'à l'étage f, telle que la calcule l'écran. */
    const clientRunTotal = (f: number) =>
        Array.from({ length: f }, (_, i) => floorReward(i + 1)).reduce((a, b) => a + b, 0);

    it('la formule SQL d’un run est bien la somme des récompenses d’étage', () => {
        // Le SQL plafonne la récompense à `10 * f + 5 * f(f+1)/2`. Si l'écran changeait sa
        // récompense d'étage sans le SQL, le joueur se verrait promettre plus qu'il ne recevra.
        expect(sqlRun).toMatch(/10 \* p_floor_reached \+ 5 \* \(p_floor_reached \* \(p_floor_reached \+ 1\)\) \/ 2/);
        for (let f = 0; f <= TOTAL_FLOORS; f++) {
            expect(clientRunTotal(f), `étage ${f}`).toBe(10 * f + 5 * (f * (f + 1)) / 2);
        }
    });

    it('le plafond quotidien vaut EXACTEMENT une ascension parfaite', () => {
        // C'est ce qui le rend invisible pour un joueur honnête. Si les récompenses d'étage
        // montaient sans que le plafond suive, il amputerait les gains légitimes en silence.
        const cap = Number(sqlRun.match(/ascension_daily_cap\(\)[\s\S]*?select (\d+)/)?.[1]);
        expect(cap).toBe(clientRunTotal(TOTAL_FLOORS));
    });

    it('le bonus de première ascension a le même barème des deux côtés', () => {
        // L'écran annonce le bonus, la base le verse : le SQL fait autorité.
        const tiers = [...sqlBonus.matchAll(/when p_floor between (\d+) and (\d+)\s+then (\d+)/g)]
            .map(m => ({ from: +m[1], to: +m[2], bonus: +m[3] }));
        expect(tiers.length).toBeGreaterThan(0);
        for (const { from, to, bonus } of tiers) {
            for (let f = from; f <= to; f++) {
                expect(ascensionFloorBonus(f), `étage ${f}`).toBe(bonus);
            }
        }
    });
});
