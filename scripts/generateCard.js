/**
 * Script de génération de cartes GODS v2
 * Illustration DERRIÈRE les ornements
 */

const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Enregistrer les polices
const fontsDir = path.join(__dirname, '../public/fonts');

try {
    registerFont(path.join(fontsDir, 'mount_olympus/Mount Olympus.otf'), { family: 'MountOlympus' });
    console.log('✅ Police MountOlympus chargée');
} catch (e) {
    console.log('⚠️ Police MountOlympus non trouvée');
}

try {
    registerFont(path.join(fontsDir, 'greekhousesymbolized/GreekHouse Symbolized_Free.ttf'), { family: 'GreekHouse' });
    console.log('✅ Police GreekHouse chargée');
} catch (e) {
    console.log('⚠️ Police GreekHouse non trouvée');
}

// Configuration (template 1024x1024)
const CARD_CONFIG = {
    // Zone d'illustration (limitée à l'intérieur des ornements dorés)
    illustration: {
        x: 150,      // Après le méandre grec gauche
        y: 170,      // Sous les ornements vagues du haut
        width: 725,  // Jusqu'avant le méandre grec droit
        height: 395  // Jusqu'aux ornements vagues du bas
    },
    // Couleurs bleues du fond à rendre transparentes
    blueBackground: {
        // Bleu foncé du fond
        r: { min: 0, max: 100 },
        g: { min: 40, max: 140 },
        b: { min: 80, max: 200 }
    },
    spellName: {
        x: 512,
        y: 93,       // Centré dans la bannière dorée du haut
        fontSize: 30,
        fontFamily: 'MountOlympus',
        color: '#2a1810'  // Couleur plus foncée pour meilleure lisibilité
    },
    godName: {
        x: 512,
        y: 618,      // Centré dans la bannière dorée du milieu
        fontSize: 26,
        fontFamily: 'MountOlympus',
        color: '#2a1810'
    },
    effect: {
        x: 512,
        y: 760,
        fontSize: 22,
        fontFamily: 'GreekHouse',
        color: '#d4af37',
        maxWidth: 500
    }
};

/**
 * Génère une carte avec illustration derrière les ornements
 */
async function generateCard(options) {
    const { templatePath, illustrationPath, spellName, godName, effect, outputPath } = options;

    console.log('🎨 Génération de la carte (v2 - illustration derrière ornements)...');

    try {
        // Charger les images
        const template = await loadImage(templatePath);
        const illustration = await loadImage(illustrationPath);

        const width = template.width;
        const height = template.height;
        console.log(`   Template: ${width}x${height}`);

        // Créer le canvas final
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 1. D'abord dessiner l'illustration (elle sera en arrière-plan)
        const illConfig = CARD_CONFIG.illustration;

        // Calculer les dimensions pour couvrir la zone
        const scaleX = illConfig.width / illustration.width;
        const scaleY = illConfig.height / illustration.height;
        const scale = Math.max(scaleX, scaleY);

        const scaledW = illustration.width * scale;
        const scaledH = illustration.height * scale;
        const offsetX = illConfig.x + (illConfig.width - scaledW) / 2;
        const offsetY = illConfig.y + (illConfig.height - scaledH) / 2;

        // Clipper pour ne pas dépasser
        ctx.save();
        ctx.beginPath();
        ctx.rect(illConfig.x, illConfig.y, illConfig.width, illConfig.height);
        ctx.clip();
        ctx.drawImage(illustration, offsetX, offsetY, scaledW, scaledH);
        ctx.restore();

        // 2. Traiter le template pour rendre le fond bleu transparent
        const templateCanvas = createCanvas(width, height);
        const templateCtx = templateCanvas.getContext('2d');
        templateCtx.drawImage(template, 0, 0);

        const imageData = templateCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const blueBg = CARD_CONFIG.blueBackground;

        // Rendre transparent le bleu dans la zone d'illustration
        for (let y = illConfig.y; y < illConfig.y + illConfig.height; y++) {
            for (let x = illConfig.x; x < illConfig.x + illConfig.width; x++) {
                const i = (y * width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Si c'est un pixel bleu foncé (fond), le rendre transparent
                if (r >= blueBg.r.min && r <= blueBg.r.max &&
                    g >= blueBg.g.min && g <= blueBg.g.max &&
                    b >= blueBg.b.min && b <= blueBg.b.max) {
                    data[i + 3] = 0; // Alpha = 0 (transparent)
                }
            }
        }

        templateCtx.putImageData(imageData, 0, 0);

        // 3. Superposer le template (avec zones transparentes) sur l'illustration
        ctx.drawImage(templateCanvas, 0, 0);

        // 4. Ajouter les textes
        const spellConfig = CARD_CONFIG.spellName;
        ctx.font = `bold ${spellConfig.fontSize}px "${spellConfig.fontFamily}", serif`;
        ctx.fillStyle = spellConfig.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spellName.toUpperCase(), spellConfig.x, spellConfig.y);

        const godConfig = CARD_CONFIG.godName;
        ctx.font = `bold ${godConfig.fontSize}px "${godConfig.fontFamily}", serif`;
        ctx.fillStyle = godConfig.color;
        ctx.fillText(godName.toUpperCase(), godConfig.x, godConfig.y);

        const effectConfig = CARD_CONFIG.effect;
        ctx.font = `${effectConfig.fontSize}px "${effectConfig.fontFamily}", sans-serif`;
        ctx.fillStyle = effectConfig.color;
        wrapText(ctx, effect, effectConfig.x, effectConfig.y, effectConfig.maxWidth, effectConfig.fontSize + 5);

        // 5. Sauvegarder
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Carte générée: ${outputPath}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = words[i] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, currentY);
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 5) {
        console.log('Usage: node generateCard.js <template> <illustration> <spellName> <godName> <effect> [output]');
        return;
    }

    const [templatePath, illustrationPath, spellName, godName, effect, outputPath] = args;

    await generateCard({
        templatePath,
        illustrationPath,
        spellName,
        godName,
        effect,
        outputPath: outputPath || 'output_card.png'
    });
}

module.exports = { generateCard, CARD_CONFIG };

if (require.main === module) {
    main().catch(console.error);
}
