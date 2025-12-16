'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function ShopPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'gods' | 'spells' | 'cosmetics' | 'offers'>('all');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Données placeholder
    const userAmbroisie = 1250;

    const gods = [
        { id: 1, name: 'Arès', element: '🔥', elementName: 'Feu', pv: 160, price: 500, owned: false, rarity: 'epic' },
        { id: 2, name: 'Hadès', element: '💀', elementName: 'Ténèbres', pv: 180, price: 750, owned: false, rarity: 'legendary' },
        { id: 3, name: 'Dionysos', element: '🌿', elementName: 'Terre', pv: 140, price: 400, owned: true, rarity: 'rare' },
        { id: 4, name: 'Hermès', element: '💨', elementName: 'Air', pv: 120, price: 350, owned: false, rarity: 'rare' },
    ];

    const cosmetics = [
        { id: 1, name: 'Dos de Carte Olympien', type: 'dos', price: 200, preview: '🏛️' },
        { id: 2, name: 'Cadre Doré', type: 'cadre', price: 300, preview: '✨' },
        { id: 3, name: 'Effet de Victoire', type: 'effet', price: 500, preview: '🎆' },
    ];

    const specialOffers = [
        { id: 1, name: 'Pack de Démarrage', originalPrice: 1500, price: 750, items: ['2 Dieux aléatoires', '500 Ambroisie'], discount: 50 },
        { id: 2, name: 'Pack Élémentaire', originalPrice: 2000, price: 1200, items: ['1 Dieu au choix', '1000 Ambroisie', '1 Cosmétique'], discount: 40 },
    ];

    const getRarityClass = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return styles.legendary;
            case 'epic': return styles.epic;
            default: return styles.rare;
        }
    };

    const getRarityLabel = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'Légendaire';
            case 'epic': return 'Épique';
            default: return 'Rare';
        }
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>🏛️ Boutique</h1>
                <div className={styles.goldBalance}>
                    <Image
                        src="/icons/ambroisie.png"
                        alt="Ambroisie"
                        width={20}
                        height={20}
                    />
                    <span>{userAmbroisie.toLocaleString()}</span>
                </div>
            </header>

            <div className={styles.content}>
                {/* Onglets */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Tout
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'gods' ? styles.active : ''}`}
                        onClick={() => setActiveTab('gods')}
                    >
                        Dieux
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'cosmetics' ? styles.active : ''}`}
                        onClick={() => setActiveTab('cosmetics')}
                    >
                        Cosmétiques
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'offers' ? styles.active : ''}`}
                        onClick={() => setActiveTab('offers')}
                    >
                        Offres 🔥
                    </button>
                </div>

                {/* Offres spéciales */}
                {(activeTab === 'all' || activeTab === 'offers') && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>🔥 Offres Limitées</h2>
                        <div className={styles.offersGrid}>
                            {specialOffers.map((offer) => (
                                <div key={offer.id} className={styles.offerCard}>
                                    <div className={styles.discountBadge}>-{offer.discount}%</div>
                                    <h3 className={styles.offerName}>{offer.name}</h3>
                                    <ul className={styles.offerItems}>
                                        {offer.items.map((item, idx) => (
                                            <li key={idx}>✓ {item}</li>
                                        ))}
                                    </ul>
                                    <div className={styles.offerPrice}>
                                        <span className={styles.originalPrice}>{offer.originalPrice}</span>
                                        <span className={styles.discountedPrice}>{offer.price}</span>
                                    </div>
                                    <button className={styles.buyButton}>Acheter</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Dieux disponibles */}
                {(activeTab === 'all' || activeTab === 'gods') && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>⚔️ Dieux</h2>
                        <div className={styles.godsGrid}>
                            {gods.map((god) => (
                                <div
                                    key={god.id}
                                    className={`${styles.godCard} ${getRarityClass(god.rarity)} ${god.owned ? styles.owned : ''}`}
                                    onClick={() => !god.owned && setSelectedItem(god)}
                                >
                                    <div className={`${styles.rarityBadge} ${getRarityClass(god.rarity)}`}>
                                        {getRarityLabel(god.rarity)}
                                    </div>
                                    <div className={styles.godImage}>
                                        <span className={styles.godElement}>{god.element}</span>
                                    </div>
                                    <h3 className={styles.godName}>{god.name}</h3>
                                    <div className={styles.godStats}>
                                        <span>{god.elementName}</span>
                                        <span>❤️ {god.pv}</span>
                                    </div>
                                    {god.owned ? (
                                        <div className={styles.ownedBadge}>✓ Possédé</div>
                                    ) : (
                                        <div className={styles.godPrice}>
                                            <span>{god.price}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Cosmétiques */}
                {(activeTab === 'all' || activeTab === 'cosmetics') && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>✨ Cosmétiques</h2>
                        <div className={styles.cosmeticsGrid}>
                            {cosmetics.map((item) => (
                                <div key={item.id} className={styles.cosmeticCard}>
                                    <div className={styles.cosmeticPreview}>{item.preview}</div>
                                    <h3 className={styles.cosmeticName}>{item.name}</h3>
                                    <span className={styles.cosmeticType}>{item.type}</span>
                                    <div className={styles.cosmeticPrice}>
                                        <span>{item.price}</span>
                                    </div>
                                    <button className={styles.buySmallButton}>Acheter</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Acheter de l'Ambroisie */}
                <section className={styles.buyGoldSection}>
                    <h2 className={styles.sectionTitle}>🍯 Acheter de l'Ambroisie</h2>
                    <div className={styles.goldPacksGrid}>
                        <div className={styles.goldPack}>
                            <span className={styles.goldAmount}>500</span>
                            <span className={styles.goldRealPrice}>0,99 €</span>
                        </div>
                        <div className={`${styles.goldPack} ${styles.popular}`}>
                            <span className={styles.popularBadge}>Populaire</span>
                            <span className={styles.goldAmount}>1500</span>
                            <span className={styles.goldRealPrice}>2,49 €</span>
                        </div>
                        <div className={styles.goldPack}>
                            <span className={styles.goldAmount}>5000</span>
                            <span className={styles.goldRealPrice}>7,99 €</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* Modal de détail */}
            {selectedItem && (
                <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
                    <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setSelectedItem(null)}>✕</button>
                        <div className={styles.modalContent}>
                            <div className={styles.modalImage}>
                                <span className={styles.modalElement}>{selectedItem.element}</span>
                            </div>
                            <h2 className={styles.modalName}>{selectedItem.name}</h2>
                            <div className={styles.modalStats}>
                                <span>Élément: {selectedItem.elementName}</span>
                                <span>PV: {selectedItem.pv}</span>
                            </div>
                            <p className={styles.modalDescription}>
                                Débloquez ce dieu pour l'ajouter à votre collection et l'utiliser en combat !
                            </p>
                            <div className={styles.modalPrice}>
                                <span>{selectedItem.price}</span>
                            </div>
                            <button
                                className={styles.confirmBuyButton}
                                disabled={userAmbroisie < selectedItem.price}
                            >
                                {userAmbroisie >= selectedItem.price ? 'Acheter maintenant' : 'Ambroisie insuffisante'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
