'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RequireAuth } from '@/components/Auth/RequireAuth';
import { getBugReports, setBugReportStatus, type BugReport } from '@/services/supabase-profile';
import { toast } from '@/lib/toast';
import styles from './page.module.css';

/**
 * Rapports de bugs envoyés par les joueurs.
 *
 * Page volontairement absente de toute navigation : on y accède par la roue des paramètres, et
 * seulement si le compte porte `is_creator`.
 *
 * La garde ci-dessous n'est qu'un confort d'affichage — la vraie barrière est la politique RLS
 * de `bug_reports`, qui refuse la lecture à quiconque n'est pas créateur. Même en forçant l'URL,
 * un joueur ordinaire ne récupérerait aucune ligne.
 */
export default function AdminBugsPage() {
    return (
        <RequireAuth>
            <AdminBugsContent />
        </RequireAuth>
    );
}

const STATUS_LABELS: Record<BugReport['status'], string> = {
    new: 'Nouveau',
    seen: 'Vu',
    resolved: 'Résolu',
};

type Filter = 'all' | BugReport['status'];

function AdminBugsContent() {
    const router = useRouter();
    const { profile, profileLoading } = useAuth();

    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');

    const isAdmin = !!profile?.is_creator;

    // Renvoi discret : inutile d'annoncer l'existence d'une page à qui n'y a pas droit.
    useEffect(() => {
        if (!profileLoading && profile && !isAdmin) router.replace('/');
    }, [profileLoading, profile, isAdmin, router]);

    // `setLoading(true)` n'est PAS posé ici : l'état part déjà à true, et l'écrire
    // synchroniquement dans un effet déclencherait un rendu en cascade.
    const load = useCallback(() => {
        if (!isAdmin) return;
        getBugReports()
            .then(setReports)
            .catch(() => toast.error('Chargement des rapports impossible'))
            .finally(() => setLoading(false));
    }, [isAdmin]);

    useEffect(() => { load(); }, [load]);

    const changeStatus = async (id: string, status: BugReport['status']) => {
        // Optimiste : la liste se réordonne immédiatement, et on recharge en cas d'échec.
        setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
        try {
            await setBugReportStatus(id, status);
        } catch {
            toast.error('Mise à jour impossible');
            load();
        }
    };

    if (!isAdmin) return null;

    const visible = filter === 'all' ? reports : reports.filter(r => r.status === filter);
    const countOf = (s: BugReport['status']) => reports.filter(r => r.status === s).length;

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <Link href="/" className={styles.backButton} aria-label="Retour à l'accueil">
                    <span aria-hidden="true">‹</span>
                </Link>
                <h1 className={styles.title}>🐞 Rapports de bugs</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.filters}>
                    {(['all', 'new', 'seen', 'resolved'] as Filter[]).map(f => (
                        <button
                            key={f}
                            className={`${styles.filterTab} ${filter === f ? styles.filterActive : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? `Tous (${reports.length})` : `${STATUS_LABELS[f]} (${countOf(f)})`}
                        </button>
                    ))}
                </div>

                {loading && <p className={styles.empty}>Chargement…</p>}

                {!loading && visible.length === 0 && (
                    <p className={styles.empty}>Aucun rapport dans cette catégorie.</p>
                )}

                {visible.map(report => (
                    <article key={report.id} className={styles.report}>
                        <div className={styles.reportHead}>
                            <span className={styles.reportAuthor}>{report.username || 'Anonyme'}</span>
                            <span className={`${styles.badge} ${styles[report.status]}`}>
                                {STATUS_LABELS[report.status]}
                            </span>
                        </div>

                        <p className={styles.reportMessage}>{report.message}</p>

                        <div className={styles.reportMeta}>
                            <span>{new Date(report.created_at).toLocaleString('fr-FR')}</span>
                            {report.page_url && <span>📄 {report.page_url}</span>}
                            {report.app_version && <span>v{report.app_version}</span>}
                        </div>

                        {report.user_agent && (
                            <p className={styles.userAgent} title={report.user_agent}>
                                {report.user_agent}
                            </p>
                        )}

                        <div className={styles.reportActions}>
                            {(['new', 'seen', 'resolved'] as BugReport['status'][])
                                .filter(s => s !== report.status)
                                .map(s => (
                                    <button
                                        key={s}
                                        className={styles.actionBtn}
                                        onClick={() => changeStatus(report.id, s)}
                                    >
                                        Marquer « {STATUS_LABELS[s]} »
                                    </button>
                                ))}
                        </div>
                    </article>
                ))}
            </div>
        </main>
    );
}
