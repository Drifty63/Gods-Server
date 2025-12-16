'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { ALL_GODS } from '@/data/gods';

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

    // Utiliser l'ambroisie du profil ou 0 par défaut
    const userAmbroisie = profile?.ambroisie ?? 0;

    // Obtenir le dieu du mois actuel
    const currentMonth = new Date().getMonth();
    const currentGodId = MONTHLY_GODS[currentMonth];
    const currentGod = ALL_GODS.find(g => g.id === currentGodId);

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
                <Link href="/" className={styles.backButton}>← Retour</Link>
                <h1 className={styles.title}>Boutique</h1>
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
                {/* Onglets de navigation */}
                <div className={styles.navTabs}>
                    <button
                        className={styles.navTab}
                        onClick={() => document.getElementById('section-offre')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Offre
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

                {/* Section Offre - Abonnement */}
                <section id="section-offre" className={styles.section}>
                    <h2 className={styles.sectionTitle}>⭐ Offre Spéciale</h2>
                    <div className={styles.subscriptionCard}>
                        <div className={styles.subscriptionBadge}>Abonnement</div>
                        <h3 className={styles.subscriptionTitle}>Pass Divin Mensuel</h3>
                        <div className={styles.subscriptionBenefits}>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitIcon}>🎁</span>
                                <span>1 000 Ambroisie offerts immédiatement</span>
                            </div>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitIcon}>📅</span>
                                <span>150 Ambroisie par jour pendant 30 jours</span>
                            </div>
                            <div className={styles.benefitItem}>
                                <span className={styles.benefitIcon}>💰</span>
                                <span>Total : 5 500 Ambroisie !</span>
                            </div>
                        </div>
                        <div className={styles.subscriptionPrice}>
                            <span className={styles.priceValue}>4,99 €</span>
                            <span className={styles.priceLabel}>/ mois</span>
                        </div>
                        <button className={styles.buyButton}>S'abonner</button>
                    </div>
                </section>

                {/* Section Coffrets */}
                <section id="section-coffrets" className={styles.section}>
                    <h2 className={styles.sectionTitle}>🎁 Coffrets</h2>
                    <div className={styles.coffretsGrid}>
                        {COFFRETS.map((coffret) => {
                            const coffretGods = coffret.godIds.map(id => ALL_GODS.find(g => g.id === id)).filter(Boolean);
                            return (
                                <div
                                    key={coffret.id}
                                    className={styles.coffretCard}
                                    style={{ borderColor: coffret.color }}
                                >
                                    <h3 className={styles.coffretName} style={{ color: coffret.color }}>
                                        {coffret.name}
                                    </h3>
                                    <div className={styles.coffretGodsImages}>
                                        {coffretGods.map((god) => god && (
                                            <div key={god.id} className={styles.coffretGodImage}>
                                                <Image
                                                    src={god.imageUrl}
                                                    alt={god.name}
                                                    width={50}
                                                    height={50}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.coffretPrice}>
                                        <Image src="/icons/ambroisie.png" alt="Ambroisie" width={18} height={18} />
                                        <span>{coffret.price.toLocaleString()}</span>
                                    </div>
                                    <button className={styles.buyButton}>Acheter</button>
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
                        <div className={styles.featuredGod}>
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
                                    <button className={styles.buyButtonSmall}>Acheter</button>
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
                        {ALL_GODS.map((god) => (
                            <div key={god.id} className={styles.godCard}>
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
                                <button className={styles.buyButtonMini}>Acheter</button>
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
        </main>
    );
}
