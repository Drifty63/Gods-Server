// Serveur Socket.IO pour GODS - Mode En Ligne
// Ce serveur est conçu pour être déployé séparément (Render, Railway, Fly.io, etc.)
// Avec validation des actions et persistance Firebase

const { createServer } = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const path = require('path');

const port = process.env.PORT || 3001;

// =====================================
// FIREBASE ADMIN SDK - Initialisation
// =====================================

let db = null;
let firebaseEnabled = false;

try {
    // Essayer de charger les credentials depuis un fichier local (dev)
    // ou depuis les variables d'environnement (prod sur Render)
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // En production : credentials depuis variable d'environnement
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('📦 Firebase: Credentials chargées depuis variable d\'environnement');
    } else {
        // En développement : credentials depuis fichier local
        const keyPath = path.join(__dirname, 'firebase-admin-key.json');
        serviceAccount = require(keyPath);
        console.log('📦 Firebase: Credentials chargées depuis fichier local');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });

    db = admin.firestore();
    firebaseEnabled = true;
    console.log('✅ Firebase Admin SDK initialisé avec succès');
} catch (error) {
    console.warn('⚠️ Firebase non configuré:', error.message);
    console.warn('🔄 Le serveur fonctionnera sans persistance');
}

// =====================================
// STOCKAGE (mémoire + Firebase)
// =====================================

const games = new Map();           // Cache mémoire pour les parties actives
const playerSockets = new Map();   // socket.id -> gameId
const matchmakingQueue = [];

// =====================================
// HELPERS FIREBASE
// =====================================

async function saveGameToFirebase(game) {
    if (!firebaseEnabled || !db) return;

    try {
        await db.collection('games').doc(game.id).set({
            ...game,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Erreur sauvegarde Firebase:', error.message);
    }
}

async function loadGameFromFirebase(gameId) {
    if (!firebaseEnabled || !db) return null;

    try {
        const doc = await db.collection('games').doc(gameId).get();
        if (doc.exists) {
            return doc.data();
        }
    } catch (error) {
        console.error('Erreur chargement Firebase:', error.message);
    }
    return null;
}

async function deleteGameFromFirebase(gameId) {
    if (!firebaseEnabled || !db) return;

    try {
        await db.collection('games').doc(gameId).delete();
    } catch (error) {
        console.error('Erreur suppression Firebase:', error.message);
    }
}

// =====================================
// VALIDATION DES ACTIONS
// =====================================

/**
 * Valide une action de jeu côté serveur
 * Retourne { valid: true, newState: ... } ou { valid: false, reason: ... }
 */
function validateGameAction(game, action, socketId) {
    if (!game || !game.gameState) {
        return { valid: false, reason: 'Partie non trouvée ou pas encore démarrée' };
    }

    const gameState = game.gameState;
    const isHost = game.hostSocket === socketId;
    const playerId = isHost ? gameState.players[0].id : gameState.players[1].id;

    // Vérifier que c'est bien le tour du joueur
    if (gameState.currentPlayerId !== playerId) {
        return { valid: false, reason: 'Ce n\'est pas votre tour' };
    }

    // Vérifications spécifiques selon le type d'action
    switch (action.type) {
        case 'play_card': {
            const player = gameState.players.find(p => p.id === playerId);
            if (!player) return { valid: false, reason: 'Joueur introuvable' };

            // Vérifier que la carte existe dans la main
            const card = player.hand.find(c => c.id === action.payload.cardId);
            if (!card) return { valid: false, reason: 'Carte introuvable dans votre main' };

            // Vérifier l'énergie
            if (player.energy < card.energyCost) {
                return { valid: false, reason: 'Pas assez d\'énergie' };
            }

            // Vérifier si déjà joué une carte
            if (player.hasPlayedCard) {
                return { valid: false, reason: 'Vous avez déjà joué une carte ce tour' };
            }

            break;
        }

        case 'discard': {
            const player = gameState.players.find(p => p.id === playerId);
            if (!player) return { valid: false, reason: 'Joueur introuvable' };

            // Vérifier que la carte existe
            const card = player.hand.find(c => c.id === action.payload.cardId);
            if (!card) return { valid: false, reason: 'Carte introuvable' };

            break;
        }

        case 'end_turn': {
            // Toujours valide si c'est notre tour
            break;
        }

        default:
            // Les autres actions (select_target, etc.) sont acceptées
            break;
    }

    return { valid: true };
}

// =====================================
// SERVEUR HTTP + SOCKET.IO
// =====================================

const httpServer = createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            games: games.size,
            players: playerSockets.size,
            queue: matchmakingQueue.length,
            firebase: firebaseEnabled
        }));
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GODS Game Server v2.0 - With Firebase & Validation');
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
            status: 'selecting',
            gameState: null,
            createdAt: Date.now(),
            hostDisconnected: false,
            guestDisconnected: false
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

        // Sauvegarder dans Firebase
        saveGameToFirebase(game);

        console.log(`Match trouvé: ${player1.playerName} vs ${player2.playerName} (${gameId})`);
    }
}

io.on('connection', (socket) => {
    console.log(`Joueur connecté: ${socket.id}`);

    // =====================================
    // MATCHMAKING - Recherche automatique
    // =====================================

    socket.on('join_queue', (data) => {
        const existingIndex = matchmakingQueue.findIndex(p => p.socket.id === socket.id);
        if (existingIndex !== -1) {
            socket.emit('queue_status', { position: existingIndex + 1, total: matchmakingQueue.length });
            return;
        }

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
            createdAt: Date.now(),
            hostDisconnected: false,
            guestDisconnected: false
        };

        games.set(gameId, game);
        playerSockets.set(socket.id, gameId);
        socket.join(gameId);

        saveGameToFirebase(game);

        socket.emit('game_created', { gameId, isHost: true });
        console.log(`Partie privée créée: ${gameId} par ${data.playerName}`);
    });

    socket.on('join_private_game', (data) => {
        let game = games.get(data.gameId);

        // Si pas en mémoire, essayer de charger depuis Firebase
        if (!game && firebaseEnabled) {
            loadGameFromFirebase(data.gameId).then(firebaseGame => {
                if (firebaseGame) {
                    games.set(data.gameId, firebaseGame);
                    handleJoinPrivate(socket, data, firebaseGame);
                } else {
                    socket.emit('error', { message: 'Partie introuvable' });
                }
            });
            return;
        }

        if (!game) {
            socket.emit('error', { message: 'Partie introuvable' });
            return;
        }

        handleJoinPrivate(socket, data, game);
    });

    function handleJoinPrivate(socket, data, game) {
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

        saveGameToFirebase(game);

        console.log(`${data.playerName} a rejoint la partie privée ${data.gameId}`);
    }

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

        socket.to(gameId).emit('opponent_selected');

        // Si les deux joueurs ont sélectionné -> passer au Pierre-Feuille-Ciseaux
        if (game.hostGods && game.guestGods) {
            game.status = 'rps'; // Nouvelle phase : Rock-Paper-Scissors
            game.rpsHostChoice = null;
            game.rpsGuestChoice = null;

            io.to(gameId).emit('rps_start', {
                hostName: game.hostName,
                guestName: game.guestName
            });

            saveGameToFirebase(game);

            console.log(`Partie ${gameId} - Phase Pierre-Feuille-Ciseaux`);
        }
    });

    // =====================================
    // PIERRE-FEUILLE-CISEAUX
    // =====================================

    socket.on('rps_choice', (data) => {
        const gameId = playerSockets.get(socket.id);
        const game = games.get(gameId);
        if (!game || game.status !== 'rps') return;

        const isHost = game.hostSocket === socket.id;
        const choice = data.choice; // 'rock', 'paper', ou 'scissors'

        if (isHost) {
            game.rpsHostChoice = choice;
        } else {
            game.rpsGuestChoice = choice;
        }

        // Notifier l'adversaire que le joueur a fait son choix (sans révéler)
        socket.to(gameId).emit('rps_opponent_chose');

        // Si les deux joueurs ont choisi
        if (game.rpsHostChoice && game.rpsGuestChoice) {
            const result = getRpsResult(game.rpsHostChoice, game.rpsGuestChoice);

            // Envoyer le résultat aux deux joueurs
            io.to(gameId).emit('rps_result', {
                hostChoice: game.rpsHostChoice,
                guestChoice: game.rpsGuestChoice,
                result: result // 'host_wins', 'guest_wins', 'draw'
            });

            if (result === 'draw') {
                // Égalité - recommencer
                game.rpsHostChoice = null;
                game.rpsGuestChoice = null;
                console.log(`Partie ${gameId} - RPS égalité, on recommence`);
            } else {
                // Un gagnant ! Attendre son choix
                game.rpsWinner = result === 'host_wins' ? 'host' : 'guest';
                game.status = 'rps_deciding';
                console.log(`Partie ${gameId} - RPS gagnant: ${game.rpsWinner}`);
            }

            saveGameToFirebase(game);
        }
    });

    // Le gagnant du RPS choisit qui commence
    socket.on('rps_decide', (data) => {
        const gameId = playerSockets.get(socket.id);
        const game = games.get(gameId);
        if (!game || game.status !== 'rps_deciding') return;

        const isHost = game.hostSocket === socket.id;
        const isWinner = (isHost && game.rpsWinner === 'host') ||
            (!isHost && game.rpsWinner === 'guest');

        if (!isWinner) {
            socket.emit('error', { message: 'Seul le gagnant peut décider' });
            return;
        }

        // data.goFirst = true si le gagnant veut jouer en premier
        let firstPlayer;
        if (data.goFirst) {
            firstPlayer = game.rpsWinner; // Le gagnant joue en premier
        } else {
            firstPlayer = game.rpsWinner === 'host' ? 'guest' : 'host'; // L'autre joue en premier
        }

        game.status = 'playing';

        const gameStartPayload = {
            hostGods: game.hostGods,
            guestGods: game.guestGods,
            hostName: game.hostName,
            guestName: game.guestName,
            firstPlayer,
            rpsWinner: game.rpsWinner
        };

        // Envoyer directement aux deux sockets pour éviter les problèmes de rooms
        const hostSocket = io.sockets.sockets.get(game.hostSocket);
        const guestSocket = io.sockets.sockets.get(game.guestSocket);

        if (hostSocket) {
            hostSocket.emit('game_start', gameStartPayload);
            console.log(`game_start envoyé au host ${game.hostSocket}`);
        } else {
            console.warn(`host socket ${game.hostSocket} introuvable !`);
        }

        if (guestSocket) {
            guestSocket.emit('game_start', gameStartPayload);
            console.log(`game_start envoyé au guest ${game.guestSocket}`);
        } else {
            console.warn(`guest socket ${game.guestSocket} introuvable !`);
        }

        saveGameToFirebase(game);

        console.log(`Partie ${gameId} démarrée - Premier joueur: ${firstPlayer}`);
    });

    // Helper pour déterminer le gagnant du RPS
    function getRpsResult(hostChoice, guestChoice) {
        if (hostChoice === guestChoice) return 'draw';

        if (
            (hostChoice === 'rock' && guestChoice === 'scissors') ||
            (hostChoice === 'paper' && guestChoice === 'rock') ||
            (hostChoice === 'scissors' && guestChoice === 'paper')
        ) {
            return 'host_wins';
        }
        return 'guest_wins';
    }

    // =====================================
    // ACTIONS DE JEU (avec validation)
    // =====================================

    socket.on('game_action', (data) => {
        const gameId = playerSockets.get(socket.id);
        if (!gameId) return;

        const game = games.get(gameId);
        if (!game) return;

        // Les actions de synchronisation initiale ne nécessitent pas de validation
        // car elles sont envoyées avant que gameState soit défini
        const isInitialSyncAction = data.type === 'sync_initial_state' || data.type === 'ask_initial_state';

        if (!isInitialSyncAction) {
            // Valider l'action
            const validation = validateGameAction(game, data, socket.id);

            if (!validation.valid) {
                console.log(`Action refusée pour ${socket.id}: ${validation.reason}`);
                socket.emit('action_rejected', { reason: validation.reason });
                return;
            }
        }

        // Action valide - transmettre à l'adversaire
        // Utiliser l'envoi direct aux sockets pour éviter les problèmes de rooms
        const hostSocket = io.sockets.sockets.get(game.hostSocket);
        const guestSocket = io.sockets.sockets.get(game.guestSocket);
        const isHost = game.hostSocket === socket.id;

        // Envoyer à l'autre joueur
        const targetSocket = isHost ? guestSocket : hostSocket;
        if (targetSocket) {
            targetSocket.emit('game_action', data);
            console.log(`Action ${data.type} transmise de ${isHost ? 'host' : 'guest'} à ${isHost ? 'guest' : 'host'}`);
        } else {
            console.warn(`Target socket introuvable pour action ${data.type}`);
        }
    });

    socket.on('sync_state', (data) => {
        const gameId = playerSockets.get(socket.id);
        if (!gameId) return;

        const game = games.get(gameId);
        if (game) {
            game.gameState = data.gameState;
            socket.to(gameId).emit('sync_state', data);

            // Sauvegarder l'état périodiquement (pas à chaque sync pour éviter trop d'écritures)
            if (Math.random() < 0.1) { // 10% des syncs
                saveGameToFirebase(game);
            }
        }
    });

    // =====================================
    // RECONNEXION
    // =====================================

    socket.on('rejoin_game', async (data) => {
        let game = games.get(data.gameId);

        // Si pas en mémoire, essayer de charger depuis Firebase
        if (!game && firebaseEnabled) {
            game = await loadGameFromFirebase(data.gameId);
            if (game) {
                games.set(data.gameId, game);
                console.log(`Partie ${data.gameId} restaurée depuis Firebase`);
            }
        }

        if (!game) {
            socket.emit('error', { message: 'Partie introuvable' });
            return;
        }

        let isHost = false;
        if (game.hostName === data.playerName) {
            game.hostSocket = socket.id;
            game.hostDisconnected = false;
            isHost = true;
        } else if (game.guestName === data.playerName) {
            game.guestSocket = socket.id;
            game.guestDisconnected = false;
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

        // Si la partie est en phase RPS, renvoyer l'événement rps_start
        if (game.status === 'rps' || game.status === 'rps_deciding') {
            socket.emit('rps_start', {
                hostName: game.hostName,
                guestName: game.guestName
            });

            // Si le joueur avait déjà fait son choix, ne pas le perdre
            // Et si on est en phase deciding, informer qui a gagné
            if (game.status === 'rps_deciding' && game.rpsWinner) {
                // Renvoyer le résultat
                socket.emit('rps_result', {
                    hostChoice: game.rpsHostChoice,
                    guestChoice: game.rpsGuestChoice,
                    result: game.rpsWinner === 'host' ? 'host_wins' : 'guest_wins'
                });
            }
        }

        socket.to(data.gameId).emit('opponent_reconnected');

        saveGameToFirebase(game);

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
                const isHost = game.hostSocket === socket.id;
                if (isHost) {
                    game.hostDisconnected = true;
                    game.hostDisconnectedAt = Date.now();
                } else {
                    game.guestDisconnected = true;
                    game.guestDisconnectedAt = Date.now();
                }

                socket.to(gameId).emit('player_disconnected');

                // Sauvegarder l'état avant potentielle suppression
                saveGameToFirebase(game);

                // Supprimer après 5 minutes si toujours déconnecté
                setTimeout(() => {
                    const currentGame = games.get(gameId);
                    if (!currentGame) return;

                    const stillDisconnected = isHost ? currentGame.hostDisconnected : currentGame.guestDisconnected;

                    if (stillDisconnected && currentGame.status !== 'finished') {
                        if (currentGame.hostDisconnected && currentGame.guestDisconnected) {
                            games.delete(gameId);
                            deleteGameFromFirebase(gameId);
                            console.log(`Partie ${gameId} supprimée (les deux joueurs déconnectés)`);
                        } else {
                            games.delete(gameId);
                            deleteGameFromFirebase(gameId);
                            console.log(`Partie ${gameId} supprimée (joueur ${isHost ? 'host' : 'guest'} déconnecté trop longtemps)`);
                        }
                    }
                }, 300000); // 5 minutes
            }
        }

        console.log(`Joueur déconnecté: ${socket.id}`);
    });

    // =====================================
    // QUITTER UNE PARTIE
    // =====================================

    socket.on('leave_game', () => {
        const gameId = playerSockets.get(socket.id);
        if (gameId) {
            const game = games.get(gameId);
            if (game) {
                game.status = 'finished';
                saveGameToFirebase(game);
            }

            socket.to(gameId).emit('opponent_left');
            socket.leave(gameId);
            playerSockets.delete(socket.id);
        }
    });

    // =====================================
    // FIN DE PARTIE
    // =====================================

    socket.on('game_over', (data) => {
        const gameId = playerSockets.get(socket.id);
        if (!gameId) return;

        const game = games.get(gameId);
        if (game) {
            game.status = 'finished';
            game.winnerId = data.winnerId;
            game.finishedAt = Date.now();

            saveGameToFirebase(game);

            // Supprimer de la mémoire après un délai
            setTimeout(() => {
                games.delete(gameId);
            }, 60000); // 1 minute
        }

        socket.to(gameId).emit('game_over', data);
    });
});

// Nettoyage périodique des parties inactives
setInterval(() => {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    games.forEach((game, gameId) => {
        if (now - game.createdAt > timeout && game.status !== 'playing') {
            games.delete(gameId);
            deleteGameFromFirebase(gameId);
            console.log(`Partie ${gameId} nettoyée (inactive)`);
        }
    });
}, 60000); // Vérifier toutes les minutes

httpServer.listen(port, () => {
    console.log(`🎮 GODS Game Server v2.0 démarré sur le port ${port}`);
    console.log(`📡 En attente de connexions...`);
    console.log(`🔥 Firebase: ${firebaseEnabled ? 'Activé' : 'Désactivé'}`);
});
