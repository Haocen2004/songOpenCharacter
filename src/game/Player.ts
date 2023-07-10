export default class Player {

    constructor(public name: string, public id: number) {
        this.name = name;
        this.id = id;
    }

    public equal(player: Player): boolean {
        return this.id == player.id;
    }

}