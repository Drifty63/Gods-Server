const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Écoute sur toutes les interfaces réseau
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Stockage des parties en cours
const games = new Map();
const playerSockets = new Map();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Joueur connecté: ${socket.id}`);

        // Créer une nouvelle partie
        socket.on('create_game', (data) => {
            const gameId = generateGameId();
            const game = {
                id: gameId,
                host: socket.id,
                hostName: data.playerName,
                guest: null,
                guestName: null,
                status: 'waiting', // waiting, selecting, playing, finished
                hostGods: null,
                guestGods: null,
                gameState: null,
            };
            games.set(gameId, game);
            playerSockets.set(socket.id, gameId);
            socket.join(gameId);

            socket.emit('game_created', { gameId, isHost: true });
            console.log(`Partie créée: ${gameId} par ${data.playerName}`);
        });

        // Rejoindre une partie existante
        socket.on('join_game', (data) => {
            const game = games.get(data.gameId);
            if (!game) {
                socket.emit('error', { message: 'Partie introuvable' });
                return;
            }
            if (game.guest) {
                socket.emit('error', { message: 'Partie déjà pleine' });
                return;
            }

            game.guest = socket.id;
            game.guestName = data.playerName;
            game.status = 'selecting';
            playerSockets.set(socket.id, data.gameId);
            socket.join(data.gameId);

            // Informer les deux joueurs
            io.to(data.gameId).emit('player_joined', {
                hostName: game.hostName,
                guestName: game.guestName,
                status: 'selecting'
            });
            console.log(`${data.playerName} a rejoint la partie ${data.gameId}`);
        });


        // Reconnexion à une partie après refresh
        socket.on('rejoin_game', (data) => {
            const game = games.get(data.gameId);
            if (!game) {
                socket.emit('error', { message: 'Partie introuvable pour reconnexion' });
                return;
            }

            // Vérifier si c'est bien un des joueurs (on se base sur le nom pour l'instant, faute de token)
            // Idéalement on utiliserait un token de session généré par le serveur
            let isHost = false;

            if (game.hostName === data.playerName) {
                // C'est l'hôte qui revient
                game.host = socket.id; // Mettre à jour avec le nouveau socket ID
                isHost = true;
            } else if (game.guestName === data.playerName) {
                // C'est l'invité qui revient
                game.guest = socket.id;
                isHost = false;
            } else {
                socket.emit('error', { message: 'Non autorisé à rejoindre cette partie' });
                return;
            }

            playerSockets.set(socket.id, data.gameId);
            socket.join(data.gameId);

            // Annuler le timeout de déconnexion si présent
            if (game.disconnectTimeout) {
                clearTimeout(game.disconnectTimeout);
                game.disconnectTimeout = null;
            }

            console.log(`Joueur ${data.playerName} reconnecté à la partie ${data.gameId}`);

            // Confirmer la reconnexion
            socket.emit('rejoined', {
                gameId: data.gameId,
                isHost,
                status: game.status
            });
        });

        // Sélection des dieux
        socket.on('select_gods', (data) => {
            const gameId = playerSockets.get(socket.id);
            const game = games.get(gameId);
            if (!game) return;

            const isHost = socket.id === game.host;
            if (isHost) {
                game.hostGods = data.gods;
            } else {
                game.guestGods = data.gods;
            }

            // Informer l'autre joueur
            socket.to(gameId).emit('opponent_selected', { ready: true });

            // Si les deux ont sélectionné, démarrer la partie
            if (game.hostGods && game.guestGods) {
                game.status = 'playing';
                io.to(gameId).emit('game_start', {
                    hostGods: game.hostGods,
                    guestGods: game.guestGods,
                    hostName: game.hostName,
                    guestName: game.guestName,
                    firstPlayer: Math.random() < 0.5 ? 'host' : 'guest'
                });
            }
        });

        // Synchroniser l'état du jeu
        socket.on('game_action', (data) => {
            const gameId = playerSockets.get(socket.id);
            if (!gameId) return;

            // Transmettre l'action à l'autre joueur
            socket.to(gameId).emit('game_action', data);
        });

        // Synchroniser l'état complet du jeu
        socket.on('sync_state', (data) => {
            const gameId = playerSockets.get(socket.id);
            if (!gameId) return;

            const game = games.get(gameId);
            if (game) {
                game.gameState = data.gameState;
                socket.to(gameId).emit('sync_state', data);
            }
        });

        // Déconnexion
        socket.on('disconnect', () => {
            const gameId = playerSockets.get(socket.id);
            if (gameId) {
                const game = games.get(gameId);
                if (game) {
                    // Ne pas supprimer la partie immédiatement
                    // Permet la reconnexion après un changement de page

                    // Marquer le joueur comme temporairement déconnecté
                    // mais ne pas informer l'adversaire immédiatement
                    // (il pourrait revenir dans quelques secondes)

                    // Si la partie est finie, on peut la supprimer
                    if (game.status === 'finished') {
                        games.delete(gameId);
                    } else {
                        // Programmer une suppression différée (30 secondes)
                        // annulée si le joueur se reconnecte
                        if (!game.disconnectTimeout) {
                            game.disconnectTimeout = setTimeout(() => {
                                // Vérifier si le joueur est toujours déconnecté
                                const currentGame = games.get(gameId);
                                if (currentGame) {
                                    // Informer l'adversaire restant
                                    io.to(gameId).emit('player_disconnected', {
                                        playerId: socket.id,
                                        isHost: socket.id === currentGame.host
                                    });
                                    games.delete(gameId);
                                }
                            }, 30000); // 30 secondes de grâce
                        }
                    }
                }
                playerSockets.delete(socket.id);
            }
            console.log(`Joueur déconnecté: ${socket.id}`);
        });

        // Lister les parties disponibles
        socket.on('list_games', () => {
            const availableGames = [];
            games.forEach((game, id) => {
                if (game.status === 'waiting') {
                    availableGames.push({
                        id,
                        hostName: game.hostName,
                        status: game.status
                    });
                }
            });
            socket.emit('games_list', availableGames);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Server prêt sur http://localhost:${port}`);
        console.log(`> Pour jouer en LAN, utilisez votre IP locale sur le port ${port}`);
    });
});

function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
