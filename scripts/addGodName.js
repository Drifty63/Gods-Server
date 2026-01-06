/**
 * Script pour ajouter le nom du dieu sur une carte
 * Version avec police intégrée via Sharp + SVG
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function addGodName(imagePath, godName, outputPath) {
    console.log(`🎨 Ajout du nom "${godName}" sur l'image...`);

    // Charger l'image pour obtenir ses dimensions
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width;
    const height = metadata.height;

    console.log(`   Dimensions: ${width}x${height}`);

    // Position de la plaque dorée (ajustée pour l'image 1024x1024)
    const plateY = 95;
    const plateX = width / 2;

    // Créer le SVG avec le texte
    // Utiliser une police Google Fonts compatible ou une police système
    const svgText = `
    <svg width="${width}" height="${height}">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&amp;display=swap');
            .god-name {
                font-family: 'Cinzel', serif;
                font-size: 40px;
                font-weight: 700;
                fill: #2a1810;
                text-anchor: middle;
                dominant-baseline: middle;
            }
        </style>
        <text x="${plateX}" y="${plateY}" class="god-name">${godName.toUpperCase()}</text>
    </svg>`;

    // Superposer le texte sur l'image
    await sharp(imagePath)
        .composite([{
            input: Buffer.from(svgText),
            top: 0,
            left: 0
        }])
        .png()
        .toFile(outputPath);

    console.log(`✅ Image sauvegardée: ${outputPath}`);
}

// Exécution
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node addGodName.js <image> <godName> <output>');
} else {
    addGodName(args[0], args[1], args[2]).catch(console.error);
}

module.exports = { addGodName };
