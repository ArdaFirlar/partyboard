"use strict";
// === PartyBoard Shared (Ortak) Modül ===
// Tüm paketlerin kullanacağı ortak tipler, enum'lar ve yardımcı fonksiyonlar burada.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = exports.RoomStatus = void 0;
exports.generateRoomCode = generateRoomCode;
// --- Oda durumu ---
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["LOBBY"] = "lobby";
    RoomStatus["PLAYING"] = "playing";
    RoomStatus["FINISHED"] = "finished";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
// --- WebSocket olay isimleri ---
// Tüm socket.io olaylarını tek yerden yönetmek için sabitler (constants)
exports.SocketEvents = {
    // Oda olayları
    ROOM_CREATE: 'room:create',
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',
    // Oyuncu olayları
    PLAYER_JOINED: 'player:joined',
    PLAYER_LEFT: 'player:left',
    PLAYER_DISCONNECT: 'player:disconnect',
    PLAYER_PRIVATE: 'player:private',
    // Oyun olayları
    GAME_SELECT: 'game:select',
    GAME_START: 'game:start',
    GAME_STATE: 'game:state',
    GAME_END: 'game:end',
    // Kontrolcü olayları
    CONTROLLER_INPUT: 'controller:input',
    // Durum isteme (istemci açıldığında mevcut oyun durumunu almak için)
    GAME_REQUEST_STATE: 'game:requestState',
    // Oda sahibi oyun bittikten sonra lobiye dönmek istediğinde
    GAME_RETURN_LOBBY: 'game:returnToLobby',
    // Oda sahibi oyunu duraklatır / devam ettirir
    HOST_PAUSE: 'host:pause',
    HOST_RESUME: 'host:resume',
    // Oda sahibi oyun ortasında çıkıp lobiye döner
    HOST_FORCE_EXIT: 'host:forceExit',
    // Oda sahibi oyunu yeniden başlatır
    HOST_RESTART_GAME: 'host:restartGame',
    // Dil değişikliği (oda sahibi dilini değiştirince herkese yayınlanır)
    LANG_CHANGE: 'lang:change',
    // Bağlantı kopma / yeniden bağlanma
    PLAYER_RECONNECTED: 'player:reconnected',
    PLAYER_DISCONNECTED: 'player:disconnected', // Geçici kopma
    HOST_KICK_PLAYER: 'host:kickPlayer', // Host oyuncuyu eler
};
// --- Monopoly ---
__exportStar(require("./monopoly"), exports);
// --- Yardımcı fonksiyonlar ---
/**
 * 6 haneli rastgele oda kodu üretir (büyük harf + rakam)
 * Örnek: "AB3K9X"
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışıklık yaratan karakterler çıkarıldı (0/O, 1/I)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
//# sourceMappingURL=index.js.map