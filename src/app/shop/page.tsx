'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_GODS, getVisibleGods, getGodById } from '@/data/gods';

// Cycle annuel des dieux en promo
const MONTHLY_GODS: { [key: number]: string } = {
    0: 'hestia',      // Janvier
    1: 'hades',       // Février
    2: 'ares',        // Mars
    3: 'aphrodite',   // Avril
    4: 'demeter',     // Mai
    5: 'apollon',     // Juin
    6: 'poseidon',    // Juillet
    7: 'artemis',     // Août
    8: 'dionysos',    // Septembre
    9: 'athena',      // Octobre
    10: 'zeus',       // Novembre
    11: 'nyx',        // Décembre
};

// Coffrets
const COFFRETS = [
    {
        id: 'poseidon',
        name: 'Coffret Poséidon',
        godIds: ['poseidon', 'artemis', 'athena', 'demeter'],
        price: 10000,
        color: '#3b82f6' // Bleu
    },
    {
        id: 'hades',
        name: 'Coffret Hadès',
        godIds: ['hades', 'nyx', 'apollon', 'ares'],
        price: 10000,
        color: '#ef4444' // Rouge
    },
    {
        id: 'zeus',
        name: 'Coffret Zeus',
        godIds: ['zeus', 'hestia', 'aphrodite', 'dionysos'],
        price: 10000,
        color: '#fbbf24' // Jaune
    }
];

// Packs d'Ambroisie
const AMBROISIE_PACKS = [
    { id: 1, amount: 500, bonus: 0, price: 0.99 },
    { id: 2, amount: 2500, bonus: 0, price: 2.99 },
    { id: 3, amount: 10000, bonus: 1000, price: 9.99 }
];

export default function ShopPage() {
    const { profile } = useAuth();
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [selectedCoffret, setSelectedCoffret] = useState<typeof COFFRETS[0] | null>(null);
    const [selectedGod, setSelectedGod] = useState<ReturnType<typeof getGodById> | null>(null);

    // Utiliser l'ambroisie du profil ou 0 par défaut
    const userAmbroisie = profile?.ambroisie ?? 0;
    // Filtrer les dieux selon le statut créateur
    const visibleGods = useMemo(() => getVisibleGods(profile?.isCreator || false), [profile?.isCreator]);

    // Fonction pour obtenir la couleur de fond selon le dieu
    const getGodBgColor = (godId: string) => {
        switch (godId) {
            case 'poseidon': return 'rgba(59, 130, 246, 0.25)'; // Bleu
            case 'zeus': return 'rgba(251, 191, 36, 0.25)'; // Jaune
            case 'nyx': return 'rgba(139, 92, 246, 0.25)'; // Violet
            case 'hestia': return 'rgba(239, 68, 68, 0.25)'; // Rouge
            case 'athena': return 'rgba(212, 175, 55, 0.25)'; // Dorée
            case 'demeter': return 'rgba(34, 197, 94, 0.25)'; // Vert
            case 'dionysos': return 'rgba(34, 197, 94, 0.25)'; // Vert
            case 'hades': return 'rgba(239, 68, 68, 0.25)'; // Rouge
            case 'apollon': return 'rgba(255, 255, 255, 0.2)'; // Blanc
            case 'ares': return 'rgba(34, 197, 94, 0.25)'; // Vert
            case 'artemis': return 'rgba(255, 255, 255, 0.2)'; // Blanc
            case 'aphrodite': return 'rgba(212, 175, 55, 0.25)'; // Dorée
            default: return 'rgba(0, 0, 0, 0.4)';
        }
    };

    // Fonction pour obtenir le symbole d'élément
    const getElementSymbol = (element: string) => {
        switch (element) {
            case 'water': return '💧';
            case 'lightning': return '⚡';
            case 'darkness': return '💀';
            case 'fire': return '🔥';
            case 'earth': return '🌿';
            case 'light': return '☀️';
            case 'nature': return '🌿';
            case 'wind': return '💨';
            case 'love': return '💕';
            case 'wine': return '🍷';
            case 'hunt': return '🏹';
            case 'war': return '⚔️';
            default: return '✨';
        }
    };

    // Fonction pour obtenir le type de jeu par dieu
    const getGodPlaystyle = (godId: string) => {
        switch (godId) {
            case 'poseidon': return 'Contrôle';
            case 'zeus': return 'Dégâts';
            case 'hades': return 'Dégâts';
            case 'nyx': return 'Contrôle';
            case 'ares': return 'Tank';
            case 'athena': return 'Tank';
            case 'dionysos': return 'Support';
            case 'artemis': return 'Dégâts';
            case 'aphrodite': return 'Support';
            case 'demeter': return 'Support';
            case 'hestia': return 'Support';
            case 'apollon': return 'Contrôle';
            default: return 'Hybride';
        }
    };

    // Obtenir le dieu du mois actuel
    const currentMonth = new Date().getMonth();
    const currentGodId = MONTHLY_GODS[currentMonth];
    const currentGod = getGodById(currentGodId);

    // Countdown jusqu'au prochain mois
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const diff = nextMonth.getTime() - now.getTime();

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>‹ Retour</Link>
                <h1 className={styles.title}>Boutique</h1>
            </header>

            <div className={styles.content}>
                {/* Onglets de navigation + Ambroisie */}
                <div className={styles.navRow}>
                    <div className={styles.navTabs}>
                        <button
                            className={styles.navTab}
                            onClick={() => document.getElementById('section-offre')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Offres
                        </button>
                        <button
                            className={styles.navTab}
                            onClick={() => document.getElementById('section-coffrets')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Coffrets
                        </button>
                        <button
                            className={styles.navTab}
                            onClick={() => document.getElementById('section-dieux')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Dieux
                        </button>
                        <button
                            className={styles.navTab}
                            onClick={() => document.getElementById('section-cosmetiques')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Cosmétiques
                        </button>
                        <button
                            className={styles.navTab}
                            onClick={() => document.getElementById('section-ambroisie')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Ambroisie
                        </button>
                    </div>
                    <div className={styles.goldBalance}>
                        <Image
                            src="/icons/ambroisie.png"
                            alt="Ambroisie"
                            width={20}
                            height={20}
                        />
                        <span>{userAmbroisie.toLocaleString()}</span>
                    </div>
                </div>

                {/* Section Offre - Abonnement */}
                <section id="section-offre" className={styles.section}>
                    <h2 className={styles.sectionTitle}>⭐ Offre Spéciale</h2>
                    <div className={styles.subscriptionCard}>
                        <div className={styles.subscriptionBadge}>Abonnement</div>
                        <h3 className={styles.subscriptionTitle}>Pass Divin Mensuel</h3>
                        <div className={styles.subscriptionBenefits}>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitIcon}>📅</span>
                                <span>150 Ambroisie par jour pendant 30 jours</span>
                            </div>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitIcon}>🎁</span>
                                <span>1 000 Ambroisie offerts immédiatement</span>
                            </div>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitIcon}>💰</span>
                                <span>Total : 5 500 Ambroisie !</span>
                            </div>
                        </div>
                        <div className={styles.subscriptionPrice}>
                            <span className={styles.priceValue}>4,99 €</span>
                        </div>
                        <button className={styles.buyButton}>Acheter</button>
                    </div>
                </section>

                {/* Section Coffrets */}
                <section id="section-coffrets" className={styles.section}>
                    <h2 className={styles.sectionTitle}>🎁 Coffrets</h2>
                    <div className={styles.coffretsGrid}>
                        {COFFRETS.map((coffret) => {
                            const coffretGods = coffret.godIds.map(id => getGodById(id)).filter(Boolean);
                            return (
                                <div
                                    key={coffret.id}
                                    className={styles.coffretCard}
                                    style={{
                                        borderColor: coffret.color,
                                        background: `linear-gradient(145deg, ${coffret.color}25, rgba(0, 0, 0, 0.5))`
                                    }}
                                    onClick={() => setSelectedCoffret(coffret)}
                                >
                                    <h3 className={styles.coffretName} style={{ color: coffret.color }}>
                                        {coffret.name}
                                    </h3>
                                    {/* Dieu principal - plus gros et seul */}
                                    {coffretGods[0] && (
                                        <div className={styles.coffretMainGod}>
                                            <Image
                                                src={coffretGods[0].imageUrl}
                                                alt={coffretGods[0].name}
                                                width={70}
                                                height={70}
                                            />
                                        </div>
                                    )}
                                    {/* 3 autres dieux - plus petits et alignés */}
                                    <div className={styles.coffretSecondaryGods}>
                                        {coffretGods.slice(1).map((god) => god && (
                                            <div key={god.id} className={styles.coffretSecondaryGodImage}>
                                                <Image
                                                    src={god.imageUrl}
                                                    alt={god.name}
                                                    width={40}
                                                    height={40}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.coffretPrice}>
                                        <Image src="/icons/ambroisie.png" alt="Ambroisie" width={18} height={18} />
                                        <span>{coffret.price.toLocaleString()}</span>
                                    </div>
                                    <button className={styles.viewButton}>Voir le contenu</button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Section Dieux */}
                <section id="section-dieux" className={styles.section}>
                    <h2 className={styles.sectionTitle}>⚡ Dieux</h2>

                    {/* Dieu du mois en vedette */}
                    {currentGod && (
                        <div
                            className={styles.featuredGod}
                            style={{ background: `linear-gradient(145deg, ${getGodBgColor(currentGod.id)}, rgba(0, 0, 0, 0.5))`, cursor: 'pointer' }}
                            onClick={() => setSelectedGod(currentGod)}
                        >
                            <div className={styles.featuredBadge}>🌟 Dieu du Mois</div>
                            <div className={styles.featuredContent}>
                                <div className={styles.featuredImageWrapper}>
                                    <Image
                                        src={currentGod.imageUrl}
                                        alt={currentGod.name}
                                        width={120}
                                        height={120}
                                        className={styles.featuredImage}
                                    />
                                </div>
                                <div className={styles.featuredInfo}>
                                    <h3 className={styles.featuredName}>{currentGod.name}</h3>
                                    <div className={styles.featuredPriceRow}>
                                        <span className={styles.originalGodPrice}>3 000</span>
                                        <div className={styles.featuredPrice}>
                                            <Image src="/icons/ambroisie.png" alt="Ambroisie" width={20} height={20} />
                                            <span>2 000</span>
                                        </div>
                                    </div>
                                    <button className={styles.viewButtonSmall}>Voir les détails</button>
                                </div>
                            </div>
                            <div className={styles.countdown}>
                                <span className={styles.countdownLabel}>Temps restant :</span>
                                <div className={styles.countdownTimer}>
                                    <div className={styles.countdownBlock}>
                                        <span className={styles.countdownValue}>{countdown.days}</span>
                                        <span className={styles.countdownUnit}>j</span>
                                    </div>
                                    <div className={styles.countdownBlock}>
                                        <span className={styles.countdownValue}>{countdown.hours.toString().padStart(2, '0')}</span>
                                        <span className={styles.countdownUnit}>h</span>
                                    </div>
                                    <div className={styles.countdownBlock}>
                                        <span className={styles.countdownValue}>{countdown.minutes.toString().padStart(2, '0')}</span>
                                        <span className={styles.countdownUnit}>m</span>
                                    </div>
                                    <div className={styles.countdownBlock}>
                                        <span className={styles.countdownValue}>{countdown.seconds.toString().padStart(2, '0')}</span>
                                        <span className={styles.countdownUnit}>s</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tous les dieux */}
                    <h3 className={styles.subSectionTitle}>Tous les Dieux</h3>
                    <div className={styles.godsGrid}>
                        {visibleGods.map((god) => (
                            <div
                                key={god.id}
                                className={styles.godCard}
                                style={{ background: getGodBgColor(god.id) }}
                                onClick={() => setSelectedGod(god)}
                            >
                                <div className={styles.godImageWrapper}>
                                    <Image
                                        src={god.imageUrl}
                                        alt={god.name}
                                        width={80}
                                        height={80}
                                        className={styles.godImage}
                                    />
                                </div>
                                <h4 className={styles.godName}>{god.name}</h4>
                                <div className={styles.godPrice}>
                                    <Image src="/icons/ambroisie.png" alt="Ambroisie" width={14} height={14} />
                                    <span>3 000</span>
                                </div>
                                <button className={styles.viewButtonMini}>Voir</button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section Cosmétiques */}
                <section id="section-cosmetiques" className={styles.section}>
                    <h2 className={styles.sectionTitle}>✨ Cosmétiques</h2>
                    <div className={styles.comingSoon}>
                        <span className={styles.comingSoonIcon}>🚧</span>
                        <p className={styles.comingSoonText}>Cette section n'est pas encore disponible.</p>
                        <p className={styles.comingSoonSubtext}>Les cosmétiques arrivent bientôt !</p>
                    </div>
                </section>

                {/* Section Ambroisie */}
                <section id="section-ambroisie" className={styles.section}>
                    <h2 className={styles.sectionTitle}>🍯 Acheter de l'Ambroisie</h2>
                    <div className={styles.ambroisieGrid}>
                        {AMBROISIE_PACKS.map((pack) => (
                            <div
                                key={pack.id}
                                className={`${styles.ambroisiePack} ${pack.bonus > 0 ? styles.bestValue : ''}`}
                            >
                                {pack.bonus > 0 && (
                                    <div className={styles.bonusBadge}>+{pack.bonus.toLocaleString()} offerts</div>
                                )}
                                <div className={styles.ambroisieAmount}>
                                    <Image src="/icons/ambroisie.png" alt="Ambroisie" width={24} height={24} />
                                    <span>{pack.amount.toLocaleString()}</span>
                                </div>
                                {pack.bonus > 0 && (
                                    <div className={styles.totalAmount}>
                                        Total : {(pack.amount + pack.bonus).toLocaleString()}
                                    </div>
                                )}
                                <div className={styles.realPrice}>{pack.price.toFixed(2).replace('.', ',')} €</div>
                                <button className={styles.buyButton}>Acheter</button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Modal Coffret */}
            {selectedCoffret && (
                <div className={styles.modalOverlay} onClick={() => setSelectedCoffret(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setSelectedCoffret(null)}>✕</button>

                        <h2 className={styles.modalTitle} style={{ color: selectedCoffret.color }}>
                            {selectedCoffret.name}
                        </h2>

                        <p className={styles.modalSubtitle}>Contient 4 dieux exclusifs</p>

                        <div className={styles.modalGodsGrid}>
                            {selectedCoffret.godIds.map(id => {
                                const god = getGodById(id);
                                if (!god) return null;
                                return (
                                    <div key={god.id} className={styles.modalGodCard}>
                                        <div className={styles.modalGodImage}>
                                            <Image
                                                src={god.imageUrl}
                                                alt={god.name}
                                                width={100}
                                                height={100}
                                            />
                                        </div>
                                        <span className={styles.modalGodName}>{god.name.split(',')[0]}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.modalPrice}>
                            <Image src="/icons/ambroisie.png" alt="Ambroisie" width={24} height={24} />
                            <span>{selectedCoffret.price.toLocaleString()}</span>
                        </div>

                        <button className={styles.buyButton}>Acheter ce coffret</button>
                    </div>
                </div>
            )}

            {/* Modal Dieu */}
            {selectedGod && (
                <div className={styles.modalOverlay} onClick={() => setSelectedGod(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setSelectedGod(null)}>✕</button>

                        <div className={styles.modalGodHero}>
                            <div className={styles.modalGodHeroImage}>
                                <Image
                                    src={selectedGod.imageUrl}
                                    alt={selectedGod.name}
                                    width={150}
                                    height={150}
                                />
                            </div>
                        </div>

                        <h2 className={styles.modalTitle}>{selectedGod.name}</h2>

                        {selectedGod.flavorText && (
                            <p className={styles.modalFlavorText}>"{selectedGod.flavorText}"</p>
                        )}

                        <div className={styles.modalGodStats}>
                            <div className={styles.modalGodStat}>
                                <span className={styles.statLabel}>PV Max</span>
                                <span className={styles.statValue}>{selectedGod.maxHealth}</span>
                            </div>
                            <div className={styles.modalGodStat}>
                                <span className={styles.statLabel}>Élément</span>
                                <span className={styles.statValue}>{getElementSymbol(selectedGod.element)}</span>
                            </div>
                            <div className={styles.modalGodStat}>
                                <span className={styles.statLabel}>Type</span>
                                <span className={styles.statValue}>{getGodPlaystyle(selectedGod.id)}</span>
                            </div>
                        </div>

                        <div className={styles.modalPrice}>
                            <Image src="/icons/ambroisie.png" alt="Ambroisie" width={24} height={24} />
                            <span>{currentGod?.id === selectedGod.id ? '2 000' : '3 000'}</span>
                            {currentGod?.id === selectedGod.id && (
                                <span className={styles.promoBadge}>Promo du mois !</span>
                            )}
                        </div>

                        <button className={styles.buyButton}>Acheter ce dieu</button>
                    </div>
                </div>
            )}
        </main>
    );
}
