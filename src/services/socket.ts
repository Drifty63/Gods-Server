import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// URL du serveur en ligne
// En développement: localhost, en production: le serveur déployé
const getServerUrl = (): string => {
    // Priorité: variable d'environnement
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_URL;
    }

    // En production (Vercel, etc.), on utilise l'URL relative
    if (typeof window !== 'undefined') {
        // Si on est sur localhost, on se connecte en local
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return `http://${window.location.hostname}:3001`;
        }
        // Sinon, on utilise le serveur de production
        return process.env.NEXT_PUBLIC_SOCKET_URL || 'https://gods-server.onrender.com';
    }

    return 'http://localhost:3001';
};

export const getSocket = (): Socket => {
    if (!socket) {
        const serverUrl = getServerUrl();
        console.log('Connecting to socket server:', serverUrl);

        socket = io(serverUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 10000,
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const isSocketConnected = (): boolean => {
    return socket?.connected || false;
};
