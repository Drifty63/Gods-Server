'use client';

import React, { useEffect } from 'react';

export default function ClientOrientationLock() {
    useEffect(() => {
        const lockOrientation = async () => {
            if (typeof window !== 'undefined' && window.screen && window.screen.orientation && window.screen.orientation.lock) {
                try {
                    await window.screen.orientation.lock('landscape');
                } catch (error) {
                    console.log("Could not lock orientation programatically.");
                }
            }
        };
        lockOrientation();
        
        return () => {
            if (typeof window !== 'undefined' && window.screen && window.screen.orientation && window.screen.orientation.unlock) {
                try { window.screen.orientation.unlock(); } catch (e) {}
            }
        };
    }, []);

    return (
        <>
            <style jsx global>{`
                .global-portrait-warning {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: #0f172a;
                    z-index: 2147483647;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                    color: white;
                }
                
                .global-portrait-warning-icon {
                    font-size: 4rem;
                    margin-bottom: 24px;
                    animation: rotatePhone 2s infinite ease-in-out;
                }
                
                @keyframes rotatePhone {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(-90deg); }
                    100% { transform: rotate(0deg); }
                }

                @media screen and (max-width: 900px) and (orientation: portrait) {
                    .global-portrait-warning {
                        display: flex;
                    }
                    /* Force body overflow hidden to prevent scrolling under the overlay */
                    body {
                        overflow: hidden !important;
                    }
                }
            `}</style>
            
            <div className="global-portrait-warning">
                <div className="global-portrait-warning-icon">📱</div>
                <h2 style={{ fontFamily: 'var(--font-cinzel)', marginBottom: '16px', fontSize: '1.5rem', color: '#f59e0b' }}>
                    MODE PAYSAGE REQUIS
                </h2>
                <p style={{ fontFamily: 'var(--font-inter)', opacity: 0.8, maxWidth: '300px', lineHeight: 1.5 }}>
                    Pour une expérience optimale, veuillez faire pivoter votre appareil.
                </p>
            </div>
        </>
    );
}
