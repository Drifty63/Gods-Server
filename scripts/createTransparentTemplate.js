/**
 * Script pour créer un template avec zones transparentes
 * - Fond blanc extérieur → transparent
 * - Zone bleue intérieure (illustration) → transparent
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function createTransparentTemplate(inputPath, outputPath) {
    console.log('🎨 Création du template transparent...');

    const image = await loadImage(inputPath);
    const width = image.width;
    const height = image.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Zone d'illustration (intérieur des ornements)
    const illustrationZone = {
        x: 150,
        y: 165,
        width: 725,
        height: 400
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 1. Rendre le fond blanc/gris clair transparent (extérieur de la carte)
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0; // Transparent
                continue;
            }

            // 2. Rendre la zone bleue intérieure transparente
            const inIllustrationZone = (
                x >= illustrationZone.x &&
                x <= illustrationZone.x + illustrationZone.width &&
                y >= illustrationZone.y &&
                y <= illustrationZone.y + illustrationZone.height
            );

            if (inIllustrationZone) {
                // Détecter les pixels bleus (fond de la carte)
                const isBlue = (
                    r < 120 &&
                    g >= 40 && g <= 160 &&
                    b >= 80 && b <= 220
                );

                if (isBlue) {
                    data[i + 3] = 0; // Transparent
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Template transparent créé: ${outputPath}`);
}

// Exécution
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node createTransparentTemplate.js <input> <output>');
    console.log('Exemple: node scripts/createTransparentTemplate.js public/cards/templates/water_template.jpg public/cards/templates/water_template_transparent.png');
} else {
    createTransparentTemplate(args[0], args[1]).catch(console.error);
}
