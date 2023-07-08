import Player from "../game/Player";
import Room from "../game/Room";
import Song from "../game/Song";
import PlayerPool from "../pool/PlayerPool";
import Logger from "../util/Logger";
import Database from "./Database";
const c = new Logger("RoomDB");

export interface RoomDBInfo {
    sessionCode: string,
    host: Player,
    songs: CacheSongInfo[],
    players: CachePlayerInfo[],
    currPos: number,
    masks: string[],
    maxPlayers: number
}

export interface CachePlayerInfo {
    name: string,
    id: number,
    score: number,
    position: number
}

export interface CacheSongInfo {
    name: string,
    artist: string,
    isGuessed: boolean,
    position: number
}

export default class RoomDB {

    public static async loadRoom(sessionCode: string): Promise<any> {
        const db = Database.getInstance();
        const RoomDB = await db.get("rooms", { sessionCode: sessionCode }) as unknown as RoomDBInfo;
        if (!RoomDB) return undefined;
        let room = new Room(RoomDB.sessionCode, RoomDB.host, RoomDB.maxPlayers);
        RoomDB.masks.forEach(mask => room.addMask(mask));
        let sortSongs = new Map<number, CacheSongInfo>();
        RoomDB.songs.forEach(song => sortSongs.set(song.position, song));
        for (let index = 0; index < sortSongs.size; index++) {
            let song = sortSongs.get(index) as CacheSongInfo;
            room.addSong(new Song(song.name, song.artist), song.isGuessed);
        }
        let sortPlayers = new Map<number, CachePlayerInfo>();
        RoomDB.players.forEach(player => sortPlayers.set(player.position, player));
        for (let index = 0; index < sortPlayers.size; index++) {
            let player = sortPlayers.get(index) as CachePlayerInfo;
            room.addPlayer(PlayerPool.getInstance().getPlayer(player.id, player.name), player.score);
        }
        room.setPos(RoomDB.currPos);

        return room
    }

    public static async saveRoom(room: RoomDBInfo) {
        console.log(room)
        const db = Database.getInstance();
        let RoomDB = await db.get("rooms", { sessionCode: room.sessionCode }) as unknown as RoomDBInfo;
        if (!RoomDB) {
            await db.set("rooms", room)
        } else {
            RoomDB.host = room.host;
            RoomDB.songs = room.songs;
            RoomDB.currPos = room.currPos;
            RoomDB.players = room.players;
            RoomDB.masks = room.masks;
            RoomDB.maxPlayers = room.maxPlayers;
            await db.update("rooms", { sessionCode: room.sessionCode }, RoomDB)
        }

    }

    public static async removeRoom(sessionCode: string) {
        const db = Database.getInstance();
        await db.delete("rooms", { sessionCode: sessionCode })
    }




}