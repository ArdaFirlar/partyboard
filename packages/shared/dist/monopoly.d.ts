export type SquareType = 'go' | 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'community' | 'jail' | 'go-to-jail' | 'free-parking';
export type PropertyGroup = 'brown' | 'light-blue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'dark-blue' | 'railroad' | 'utility';
export interface BoardSquare {
    index: number;
    name: string;
    fullName: string;
    type: SquareType;
    price?: number;
    baseRent?: number;
    rentTable?: [number, number, number, number, number, number];
    houseCost?: number;
    mortgageValue?: number;
    group?: PropertyGroup;
    taxAmount?: number;
}
export interface MonopolyPlayer {
    id: string;
    name: string;
    avatar: string;
    color: string;
    money: number;
    position: number;
    properties: number[];
    isBankrupt: boolean;
    inJail: boolean;
    jailTurns: number;
    getOutOfJailCards: number;
}
export type MonopolyPhase = 'rolling' | 'buying' | 'finished';
export type CardType = 'chance' | 'community';
export type CardEffectKind = 'advance-to' | 'advance-to-nearest-railroad' | 'advance-to-nearest-utility' | 'go-back' | 'pay' | 'collect' | 'collect-from-each' | 'pay-to-each' | 'repairs' | 'go-to-jail' | 'get-out-of-jail-card';
export interface ChanceCard {
    id: string;
    type: CardType;
    text: string;
    effect: {
        kind: CardEffectKind;
        position?: number;
        spaces?: number;
        amount?: number;
        perHouse?: number;
        perHotel?: number;
        railroadMultiplier?: number;
    };
}
export interface TradeOffer {
    id: string;
    fromPlayerId: string;
    toPlayerId: string;
    fromProperties: number[];
    toProperties: number[];
    fromMoney: number;
    toMoney: number;
}
export interface MonopolyThemeInfo {
    id: string;
    name: string;
    currencySymbol: string;
    boardNameOverrides: Record<number, string>;
}
export interface MonopolyGameState {
    phase: MonopolyPhase;
    players: MonopolyPlayer[];
    currentPlayerIndex: number;
    currentPlayerId: string;
    dice: [number, number] | null;
    doubleCount: number;
    message: string;
    landedSquare: number | null;
    canBuy: boolean;
    board: BoardSquare[];
    improvements: Record<number, number>;
    mortgaged: number[];
    pendingTrade: TradeOffer | null;
    currentCard: ChanceCard | null;
    buildableSquares: number[];
    sellableSquares: number[];
    theme: MonopolyThemeInfo;
    winnerId?: string;
    winnerName?: string;
}
export declare const MonopolyActions: {
    readonly ROLL_DICE: "monopoly:rollDice";
    readonly BUY_PROPERTY: "monopoly:buy";
    readonly SKIP_BUY: "monopoly:skip";
    readonly BUILD_HOUSE: "monopoly:buildHouse";
    readonly SELL_HOUSE: "monopoly:sellHouse";
    readonly MORTGAGE: "monopoly:mortgage";
    readonly UNMORTGAGE: "monopoly:unmortgage";
    readonly SEND_TRADE: "monopoly:sendTrade";
    readonly ACCEPT_TRADE: "monopoly:acceptTrade";
    readonly REJECT_TRADE: "monopoly:rejectTrade";
    readonly PAY_BAIL: "monopoly:payBail";
    readonly USE_JAIL_CARD: "monopoly:useJailCard";
};
export declare const PLAYER_COLORS: string[];
export declare const GROUP_COLORS: Record<PropertyGroup, string>;
export declare const HOUSE_COSTS: Partial<Record<PropertyGroup, number>>;
//# sourceMappingURL=monopoly.d.ts.map