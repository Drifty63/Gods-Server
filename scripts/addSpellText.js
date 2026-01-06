/**
 * Script pour ajouter du texte sur les cartes de sorts
 * Utilise Mount Olympus + GreekHouse Symbolized
 */

const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Charger les polices
const fontsDir = path.join(__dirname, '../public/fonts');

try {
    registerFont(path.join(fontsDir, 'mount_olympus/Mount Olympus.otf'), { family: 'Mount Olympus' });
    console.log('✅ Police Mount Olympus chargée');
} catch (e) {
    console.log('⚠️ Mount Olympus non trouvée:', e.message);
}

try {
    registerFont(path.join(fontsDir, 'greekhousesymbolized/GreekHouse Symbolized_Free.ttf'), { family: 'GreekHouse' });
    console.log('✅ Police GreekHouse chargée');
} catch (e) {
    console.log('⚠️ GreekHouse non trouvée:', e.message);
}

// Configuration des zones de texte pour carte de sort (1024x1024)
const SPELL_CARD_CONFIG = {
    // Nom du sort (bannière du haut)
    spellName: {
        x: 512,
        y: 68,
        fontSize: 32,
        font: 'Mount Olympus',
        color: '#3d2914'
    },
    // Nom du dieu (bannière du milieu)
    godName: {
        x: 512,
        y: 590,
        fontSize: 28,
        font: 'Mount Olympus',
        color: '#3d2914'
    },
    // Description de l'effet (grande zone du bas)
    effect: {
        x: 512,
        y: 750,
        fontSize: 24,
        font: 'GreekHouse',
        color: '#3d2914',
        maxWidth: 520,
        lineHeight: 32
    }
};

async function addSpellText(imagePath, spellName, godName, effect, outputPath) {
    console.log(`🎨 Création de la carte de sort...`);
    console.log(`   Sort: ${spellName}`);
    console.log(`   Dieu: ${godName}`);
    console.log(`   Effet: ${effect}`);

    const image = await loadImage(imagePath);
    const width = image.width;
    const height = image.height;

    console.log(`   Dimensions: ${width}x${height}`);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Dessiner l'image de base
    ctx.drawImage(image, 0, 0);

    // 1. Nom du sort (haut)
    const spellConfig = SPELL_CARD_CONFIG.spellName;
    ctx.font = `${spellConfig.fontSize}px "${spellConfig.font}"`;
    ctx.fillStyle = spellConfig.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spellName.toUpperCase(), spellConfig.x, spellConfig.y);

    // 2. Nom du dieu (milieu)
    const godConfig = SPELL_CARD_CONFIG.godName;
    ctx.font = `${godConfig.fontSize}px "${godConfig.font}"`;
    ctx.fillStyle = godConfig.color;
    ctx.fillText(godName.toUpperCase(), godConfig.x, godConfig.y);

    // 3. Effet (bas) - avec retour à la ligne
    const effectConfig = SPELL_CARD_CONFIG.effect;
    ctx.font = `${effectConfig.fontSize}px "${effectConfig.font}"`;
    ctx.fillStyle = effectConfig.color;

    wrapText(ctx, effect, effectConfig.x, effectConfig.y, effectConfig.maxWidth, effectConfig.lineHeight);

    // Sauvegarder
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Carte sauvegardée: ${outputPath}`);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
            lines.push(line.trim());
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    // Centrer verticalement
    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2 + lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, startY + i * lineHeight);
    }
}

// Exécution
const args = process.argv.slice(2);
if (args.length < 5) {
    console.log('Usage: node addSpellText.js <image> <spellName> <godName> <effect> <output>');
    console.log('');
    console.log('Exemple:');
    console.log('  node scripts/addSpellText.js image.jpg "Charme Divin" "Aphrodite" "Charme une cible..." output.png');
} else {
    const [imagePath, spellName, godName, effect, outputPath] = args;
    addSpellText(imagePath, spellName, godName, effect, outputPath).catch(console.error);
}

module.exports = { addSpellText };
