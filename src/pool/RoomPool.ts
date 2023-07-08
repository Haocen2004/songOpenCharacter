import Player from '../game/Player';
import Room from '../game/Room';
import Logger from '../util/Logger';
const c = new Logger("RoomPool", "cyan");


export default class RoomPool {
    private static instance: RoomPool;
    public readonly sessions: Map<string, Room> = new Map()

    public createRoom(sessionCode: string, host: Player, maxPlayers = 10): boolean {
        if (this.sessions.has(sessionCode)) return false;
        this.sessions.set(sessionCode, new Room(sessionCode, host, maxPlayers));
        return true;
    }

    public removeRoom(room: Room): boolean {
        if (!this.sessions.has(room.sessionCode)) return false;
        this.sessions.delete(room.sessionCode);
        return true;
    }

    public getRoom(sessionCode: string): Room | undefined {
        return this.sessions.get(sessionCode);
    }

    public getRoomByHost(host: Player): Room | undefined {
        for (const room of this.sessions.values()) {
            if (room.host.equal(host)) return room;
        }
        return undefined;
    }


    public static getInstance(): RoomPool {
        if (!RoomPool.instance) {
            RoomPool.instance = new RoomPool();
        }
        return RoomPool.instance;
    }
}