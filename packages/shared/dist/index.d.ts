export interface Player {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
}
export interface Room {
    code: string;
    players: Player[];
    hostId: string;
    gameId: string | null;
    status: RoomStatus;
    maxPlayers: number;
    createdAt: number;
    lastActivity: number;
}
export declare enum RoomStatus {
    LOBBY = "lobby",// Lobide bekleniyor
    PLAYING = "playing",// Oyun devam ediyor
    FINISHED = "finished"
}
export interface GameManifest {
    id: string;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    version: string;
    icon: string;
}
export type RPSChoice = 'rock' | 'paper' | 'scissors';
export interface RPSRoundResult {
    player1Id: string;
    player1Choice: RPSChoice;
    player2Id: string;
    player2Choice: RPSChoice;
    winnerId: string | null;
}
export interface RPSGameState {
    phase: 'waiting' | 'choosing' | 'reveal' | 'finished';
    round: number;
    bestOf: number;
    scores: Record<string, number>;
    players: {
        id: string;
        name: string;
        avatar: string;
    }[];
    currentRound?: RPSRoundResult;
    choices: Record<string, boolean>;
    winnerId?: string;
}
export declare const SocketEvents: {
    readonly ROOM_CREATE: "room:create";
    readonly ROOM_JOIN: "room:join";
    readonly ROOM_LEAVE: "room:leave";
    readonly PLAYER_JOINED: "player:joined";
    readonly PLAYER_LEFT: "player:left";
    readonly PLAYER_DISCONNECT: "player:disconnect";
    readonly PLAYER_PRIVATE: "player:private";
    readonly GAME_SELECT: "game:select";
    readonly GAME_START: "game:start";
    readonly GAME_STATE: "game:state";
    readonly GAME_END: "game:end";
    readonly CONTROLLER_INPUT: "controller:input";
    readonly GAME_REQUEST_STATE: "game:requestState";
    readonly GAME_RETURN_LOBBY: "game:returnToLobby";
    readonly HOST_PAUSE: "host:pause";
    readonly HOST_RESUME: "host:resume";
    readonly HOST_FORCE_EXIT: "host:forceExit";
    readonly HOST_RESTART_GAME: "host:restartGame";
    readonly LANG_CHANGE: "lang:change";
    readonly PLAYER_RECONNECTED: "player:reconnected";
    readonly PLAYER_DISCONNECTED: "player:disconnected";
    readonly HOST_KICK_PLAYER: "host:kickPlayer";
};
export * from './monopoly';
export interface MonopolyStats {
    totalTurns: number;
    playerStats: MonopolyPlayerStat[];
    mostVisitedSquare: {
        name: string;
        count: number;
    };
    totalDoubles: number;
    totalJailVisits: number;
}
export interface MonopolyPlayerStat {
    id: string;
    name: string;
    avatar: string;
    color: string;
    finalMoney: number;
    propertiesOwned: number;
    rentCollected: number;
    rentPaid: number;
    timesInJail: number;
    doublesRolled: number;
    isBankrupt: boolean;
    rank: number;
}
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatar: string;
    wins: number;
    gamesPlayed: number;
    winRate: number;
    gameId?: string;
}
/**
 * 6 haneli rastgele oda kodu üretir (büyük harf + rakam)
 * Örnek: "AB3K9X"
 */
export declare function generateRoomCode(): string;
//# sourceMappingURL=index.d.ts.map