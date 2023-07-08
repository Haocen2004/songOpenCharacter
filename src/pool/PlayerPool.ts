import Player from "../game/Player";

export default class PlayerPool {

    private static instance: PlayerPool;
    public readonly players: Map<number, Player> = new Map()


    public getPlayer(id: number, name: string): Player {
        let player = this.players.get(id);
        if (player == undefined) {
            player = new Player(name, id);
            if (name != 'null;placeholder') {
                this.players.set(id, player);
            }
        }
        return player;
    }


    public static getInstance(): PlayerPool {
        if (!PlayerPool.instance) {
            PlayerPool.instance = new PlayerPool();
        }
        return PlayerPool.instance;
    }

}