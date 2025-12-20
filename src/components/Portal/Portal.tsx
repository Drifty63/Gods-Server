'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

/**
 * Composant Portal pour rendre les modaux directement dans le body.
 * Cela résout les problèmes de z-index et de position: fixed 
 * qui peuvent être affectés par des propriétés CSS parentes comme transform ou backdrop-filter.
 */
export default function Portal({ children }: PortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Ne rendre le portail que côté client
    if (typeof window === 'undefined' || !mounted) {
        return null;
    }

    return createPortal(children, document.body);
}
