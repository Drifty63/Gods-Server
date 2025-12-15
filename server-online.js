// Serveur Socket.IO pour GODS - Mode En Ligne
// Ce serveur est conçu pour être déployé séparément (Render, Railway, Fly.io, etc.)

const { createServer } = require('http');
const { Server } = require('socket.io');

const port = process.env.PORT || 3001;

// Stockage des parties en cours
const games = new Map();
const playerSockets = new Map();
const matchmakingQueue = [];

const httpServer = createServer((req, res) => {
    // Simple health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            games: games.size,
            players: playerSockets.size,
            queue: matchmakingQueue.length
        }));
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GODS Game Server');
});

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// Génération d'ID de partie
function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Fonction de matchmaking
function tryMatchmaking() {
    while (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();

        // Vérifier que les deux joueurs sont encore connectés
        if (!player1.socket.connected || !player2.socket.connected) {
            // Remettre les joueurs connectés dans la queue
            if (player1.socket.connected) matchmakingQueue.unshift(player1);
            if (player2.socket.connected) matchmakingQueue.unshift(player2);
            continue;
        }

        // Créer une partie
        const gameId = generateGameId();
        const game = {
            id: gameId,
            hostSocket: player1.socket.id,
            guestSocket: player2.socket.id,
            hostName: player1.playerName,
            guestName: player2.playerName,
            hostGods: null,
            guestGods: null,
            status: 'selecting', // Passe directement à la sélection
            gameState: null,
            createdAt: Date.now()
        };

        games.set(gameId, game);
        playerSockets.set(player1.socket.id, gameId);
        playerSockets.set(player2.socket.id, gameId);

        player1.socket.join(gameId);
        player2.socket.join(gameId);

        // Notifier les deux joueurs
        player1.socket.emit('match_found', {
            gameId,
            isHost: true,
            opponentName: player2.playerName
        });
        player2.socket.emit('match_found', {
            gameId,
            isHost: false,
            opponentName: player1.playerName
        });

        console.log(`Match trouvé: ${player1.playerName} vs ${player2.playerName} (${gameId})`);
    }
}

io.on('connection', (socket) => {
    console.log(`Joueur connecté: ${socket.id}`);

    // =====================================
    // MATCHMAKING - Recherche automatique
    // =====================================

    socket.on('join_queue', (data) => {
        // Vérifier si le joueur n'est pas déjà dans la queue
        const existingIndex = matchmakingQueue.findIndex(p => p.socket.id === socket.id);
        if (existingIndex !== -1) {
            socket.emit('queue_status', { position: existingIndex + 1, total: matchmakingQueue.length });
            return;
        }

        // Ajouter à la file d'attente
        matchmakingQueue.push({
            socket,
            playerName: data.playerName,
            rating: data.rating || 1000,
            joinedAt: Date.now()
        });

        console.log(`${data.playerName} a rejoint la file d'attente (${matchmakingQueue.length} joueurs)`);

        socket.emit('queue_joined', {
            position: matchmakingQueue.length,
            total: matchmakingQueue.length
        });

        // Tenter un match
        tryMatchmaking();
    });

    socket.on('leave_queue', () => {
        const index = matchmakingQueue.findIndex(p => p.socket.id === socket.id);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
            console.log(`Joueur a quitté la file d'attente (${matchmakingQueue.length} restants)`);
        }
        socket.emit('queue_left');
    });

    // =====================================
    // CRÉATION/JONCTION DE PARTIE (privée)
    // =====================================

    socket.on('create_private_game', (data) => {
        const gameId = generateGameId();
        const game = {
            id: gameId,
            hostSocket: socket.id,
            guestSocket: null,
            hostName: data.playerName,
            guestName: null,
            hostGods: null,
            guestGods: null,
            status: 'waiting',
            gameState: null,
            isPrivate: true,
            createdAt: Date.now()
        };

        games.set(gameId, game);
        playerSockets.set(socket.id, gameId);
        socket.join(gameId);

        socket.emit('game_created', { gameId, isHost: true });
        console.log(`Partie privée créée: ${gameId} par ${data.playerName}`);
    });

    socket.on('join_private_game', (data) => {
        const game = games.get(data.gameId);
        if (!game) {
            socket.emit('error', { message: 'Partie introuvable' });
            return;
        }

        if (game.status !== 'waiting') {
            socket.emit('error', { message: 'Cette partie a déjà commencé' });
            return;
        }

        game.guestSocket = socket.id;
        game.guestName = data.playerName;
        game.status = 'selecting';

        playerSockets.set(socket.id, data.gameId);
        socket.join(data.gameId);

        io.to(data.gameId).emit('player_joined', {
            hostName: game.hostName,
            guestName: game.guestName,
            status: 'selecting'
        });

        console.log(`${data.playerName} a rejoint la partie privée ${data.gameId}`);
    });

    // =====================================
    // SÉLECTION DES DIEUX
    // =====================================

    socket.on('select_gods', (data) => {
        const gameId = playerSockets.get(socket.id);
        const game = games.get(gameId);
        if (!game) return;

        const isHost = game.hostSocket === socket.id;
        if (isHost) {
            game.hostGods = data.gods;
        } else {
            game.guestGods = data.gods;
        }

        // Notifier l'adversaire
        socket.to(gameId).emit('opponent_selected');

        // Si les deux joueurs ont sélectionné
        if (game.hostGods && game.guestGods) {
            game.status = 'playing';
            const firstPlayer = Math.random() < 0.5 ? 'host' : 'guest';

            io.to(gameId).emit('game_start', {
                hostGods: game.hostGods,
                guestGods: game.guestGods,
                hostName: game.hostName,
                guestName: game.guestName,
                firstPlayer
            });

            console.log(`Partie ${gameId} démarrée - Premier joueur: ${firstPlayer}`);
        }
    });

    // =====================================
    // ACTIONS DE JEU
    // =====================================

    socket.on('game_action', (data) => {
        const gameId = playerSockets.get(socket.id);
        if (!gameId) return;
        socket.to(gameId).emit('game_action', data);
    });

    socket.on('sync_state', (data) => {
        const gameId = playerSockets.get(socket.id);
        if (!gameId) return;

        const game = games.get(gameId);
        if (game) {
            game.gameState = data.gameState;
            socket.to(gameId).emit('sync_state', data);
        }
    });

    // =====================================
    // RECONNEXION
    // =====================================

    socket.on('rejoin_game', (data) => {
        const game = games.get(data.gameId);
        if (!game) {
            socket.emit('error', { message: 'Partie introuvable' });
            return;
        }

        let isHost = false;
        if (game.hostName === data.playerName) {
            game.hostSocket = socket.id;
            isHost = true;
        } else if (game.guestName === data.playerName) {
            game.guestSocket = socket.id;
        } else {
            socket.emit('error', { message: 'Joueur non trouvé dans cette partie' });
            return;
        }

        playerSockets.set(socket.id, data.gameId);
        socket.join(data.gameId);

        socket.emit('rejoined', {
            gameId: data.gameId,
            isHost,
            status: game.status,
            gameState: game.gameState
        });

        socket.to(data.gameId).emit('opponent_reconnected');
        console.log(`${data.playerName} reconnecté à la partie ${data.gameId}`);
    });

    // =====================================
    // DÉCONNEXION
    // =====================================

    socket.on('disconnect', () => {
        // Retirer de la file d'attente
        const queueIndex = matchmakingQueue.findIndex(p => p.socket.id === socket.id);
        if (queueIndex !== -1) {
            matchmakingQueue.splice(queueIndex, 1);
        }

        // Gérer la déconnexion de partie
        const gameId = playerSockets.get(socket.id);
        if (gameId) {
            const game = games.get(gameId);
            if (game) {
                socket.to(gameId).emit('player_disconnected');

                // Supprimer la partie après un délai (5 minutes pour permettre la reconnection)
                setTimeout(() => {
                    const currentGame = games.get(gameId);
                    if (currentGame && currentGame.status !== 'finished') {
                        games.delete(gameId);
                        console.log(`Partie ${gameId} supprimée (timeout après déconnexion)`);
                    }
                }, 300000); // 5 minutes
            }
            playerSockets.delete(socket.id);
        }

        console.log(`Joueur déconnecté: ${socket.id}`);
    });

    // =====================================
    // QUITTER UNE PARTIE
    // =====================================

    socket.on('leave_game', () => {
        const gameId = playerSockets.get(socket.id);
        if (gameId) {
            socket.to(gameId).emit('opponent_left');
            socket.leave(gameId);
            playerSockets.delete(socket.id);
        }
    });
});

// Nettoyage périodique des parties inactives
setInterval(() => {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    games.forEach((game, gameId) => {
        if (now - game.createdAt > timeout && game.status !== 'playing') {
            games.delete(gameId);
            console.log(`Partie ${gameId} nettoyée (inactive)`);
        }
    });
}, 60000); // Vérifier toutes les minutes

httpServer.listen(port, () => {
    console.log(`🎮 GODS Game Server démarré sur le port ${port}`);
    console.log(`📡 En attente de connexions...`);
});
