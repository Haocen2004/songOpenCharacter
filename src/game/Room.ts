import Player from "./Player";
import Song from "./Song";

export default class Room {

    private songs: Map<Song, boolean> = new Map<Song, boolean>();
    private songsList: Song[] = [];
    private players: Player[] = [];
    private currPos: number = -1;
    private scores: Map<Player, number> = new Map<Player, number>();
    private masks: string[] = [];
    private tempGuessId: number = -1;
    private tempGuess: string = '';
    private tempGuessPlayer: Player = new Player('', -1)

    constructor(public sessionCode: string, public host: Player, public maxPlayers: number) {
        this.host = host;
        this.sessionCode = sessionCode;
        this.maxPlayers = maxPlayers;
    }


    public addSong(song: Song): boolean {
        if (this.songs.has(song)) return false;
        this.songsList.push(song);
        this.songs.set(song, false);
        return true;
    }

    public removeSong(id: number): boolean {
        if (id >= this.songsList.length) return false;
        this.songs.delete(this.songsList[id]);
        this.songsList.splice(id, 1);
        return true;
    }

    public clearSongs(): void {
        this.songs = new Map<Song, boolean>();
        this.songsList = [];
    }

    public getSongs(): Song[] {
        return this.songsList;
    }

    public addPlayer(player: Player): boolean {
        if (this.players.includes(player)) return false;
        if (this.players.length >= this.maxPlayers) return false;
        this.players.push(player);
        this.scores.set(player, 0);
        return true;
    }

    public removePlayer(player: Player): boolean {
        if (!this.players.includes(player)) return false;
        this.players.splice(this.players.indexOf(player), 1);
        this.scores.delete(player);
        return true;
    }

    public hasPlayer(player: Player): boolean {
        return this.players.includes(player);
    }

    public getScores(): Map<Player, number> {
        return this.scores;
    }

    public addMask(mask: string): boolean {
        mask = mask.toLocaleLowerCase();
        if (this.masks.includes(mask)) return false;
        this.masks.push(mask);
        return true;
    }

    private clearMasks(): void {
        this.masks = [];
    }

    public reset(): void {
        this.clearSongs();
        this.clearMasks();
    }

    public resetScores(): void {
        this.scores.forEach((_value, key) => {
            this.scores.set(key, 0);
        });
    }

    public getMaskedSongs(): string[] {
        let maskedSongs: string[] = [];
        this.songs.forEach((isGuessed, song) => {
            var maskedSong = ''
            if (isGuessed) {
                maskedSong = song.name + ' - ' + song.artist;
            } else {
                maskedSong = song.getMaskedName(this.masks)
            }
            maskedSongs.push(maskedSong);
        });

        return maskedSongs;
    }

    public guessSong(guessId: number, guess: string, player: Player) {

        this.tempGuessId = guessId;
        this.tempGuess = guess;
        this.tempGuessPlayer = player;

    }

    public getTempGuess(): [number, string, Player] {
        return [this.tempGuessId, this.tempGuess, this.tempGuessPlayer];
    }

    public checkGuess(result: boolean) {
        if (result) {
            this.songs.set(this.songsList[this.tempGuessId], true);
            this.scores.set(this.tempGuessPlayer, this.scores.get(this.tempGuessPlayer) as number + 1);
        }
        this.tempGuessId = -1;
        this.tempGuess = '';
        this.tempGuessPlayer = new Player('', -1);
        return this.nextTurn();
    }

    public nextTurn() {
        let message = '';
        this.currPos++;
        if (this.currPos >= this.players.length) {
            this.currPos = 0;
        }
        let currPlayer = this.players[this.currPos];
        message = `下一位玩家：${currPlayer.name}(${currPlayer.id})\n`;
        message += `当前翻开字符：${this.masks}\n`;
        for (const index in this.songsList) {
            let guessed = this.songs.get(this.songsList[index]);
            if (guessed) {
                message += `${index}、 ${this.songsList[index].name} —— ${this.songsList[index].artist}\n`;
            } else {
                message += `${index}、 ${this.songsList[index].getMaskedName(this.masks)}\n`;
            }
        }
        return message;
    }


}