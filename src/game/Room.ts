import RoomDB, { CachePlayerInfo, CacheSongInfo, RoomDBInfo } from "../db/RoomDB";
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
    private guessedSongCount: number = 0;
    private isStart: boolean = false;
    private numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    private characters = 'abcdefghijklmnopqrstuvwxyz'.split('')
    private rounds = 0;
    private songsRound: Map<Song, number> = new Map<Song, number>()

    constructor(public sessionCode: string, public host: Player, public maxPlayers: number) {
        this.host = host;
        this.sessionCode = sessionCode;
        this.maxPlayers = maxPlayers;
        RoomDB.saveRoom(this.getDBData())
    }

    public isStarted(isStart: boolean | undefined = undefined): boolean {
        if (isStart != undefined) this.isStart = isStart;
        return this.isStart;
    }


    public addSong(song: Song, isGuessed: boolean = false, guessedRound: number = 0): boolean {
        if (this.songs.has(song)) return false;
        this.songsList.push(song);
        this.songs.set(song, isGuessed);
        this.songsRound.set(song, guessedRound)
        if (isGuessed) this.guessedSongCount++;
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

    public addPlayer(player: Player, score = 0): boolean {
        if (this.players.includes(player)) return false;
        if (this.players.length >= this.maxPlayers) return false;
        this.players.push(player);
        this.scores.set(player, score);
        return true;
    }

    public removePlayer(player: Player): number {
        if (!this.players.includes(player)) return 0;
        if (this.currPos != -1 && this.players[this.currPos].equal(player)) {
            if (this.currPos == this.players.length) {
                this.currPos = 0;
            }

            this.players = this.players.splice(this.players.indexOf(player), 1);
            this.scores.delete(player);
            if (this.players.length == 0) return -2;
            return -1;
        }
        this.players.splice(this.players.indexOf(player), 1);
        this.scores.delete(player);
        return 1;
    }

    public hasPlayer(player: Player): boolean {
        let result = false;
        this.players.forEach((p) => {
            if (p.equal(player)) result = true;
        });
        return result;
    }

    public isActivePlayer(player: Player): boolean {
        return this.players[this.currPos].equal(player);
    }

    public setPos(pos: number) {
        this.currPos = pos;
    }


    public getScores(): Map<Player, number> {
        return this.scores;
    }

    public addMask(mask: string, player: Player | undefined = undefined): boolean {
        mask = mask.toLocaleLowerCase();
        if (this.masks.includes(mask)) return false;
        let score = 0;
        if (player != undefined) {
            this.songs.forEach((isGuessed, song) => {
                if (!isGuessed) {
                    score += song.getMaskedScore(this.masks)
                }
            });
        }
        this.masks.push(mask);
        if (player != undefined) {
            let failCount = 0
            this.songs.forEach((isGuessed, song) => {
                if (!isGuessed) {
                    score = score - song.getMaskedScore(this.masks)
                    if (song.isFullGuess(this.masks)) {
                        this.songsRound.set(song, this.rounds)
                        song.setPrefix('[开]')
                        failCount++
                        this.guessedSongCount++;
                        this.songs.set(song, true);
                    }
                }
            });
            if (score < 0) {
                let addScore = 0
                score = score / -1
                if (this.characters.includes(mask)) {
                    addScore = 1
                } else if (this.numbers.includes(parseInt(mask))) {
                    addScore = 3
                } else {
                    addScore = 10
                }
                this.scores.set(player, this.scores.get(player) as number + addScore - (failCount * 10))
            }
        }
        return true;
    }

    private clearMasks(): void {
        this.masks = [];
    }

    public reset(): void {
        this.clearSongs();
        this.clearMasks();
        this.isStart = false;
        this.guessedSongCount = 0;
        RoomDB.saveRoom(this.getDBData());
    }

    public resetScores(): void {
        this.scores.forEach((_value, key) => {
            this.scores.set(key, 0);
        });
        RoomDB.saveRoom(this.getDBData());
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
        let song = this.songsList[guessId];
        if (song.name.toLocaleLowerCase() == guess.toLocaleLowerCase()) {
            return this.checkGuess(true);
        }
        return '';
    }

    public getTempGuess(): [number, string, Player] {
        return [this.tempGuessId, this.tempGuess, this.tempGuessPlayer];
    }

    public checkGuess(result: boolean) {
        if (this.tempGuessId == -1) return "当前没有需要判定的猜测！"
        if (result) {
            this.guessedSongCount++;
            this.songs.set(this.songsList[this.tempGuessId], true);
            this.songsRound.set(this.songsList[this.tempGuessId], this.rounds)
            this.songsList[this.tempGuessId].setPrefix('[猜]')
            let bounceScore = this.songsList[this.tempGuessId].getMaskedScore(this.masks);
            this.scores.set(this.tempGuessPlayer, this.scores.get(this.tempGuessPlayer) as number + 5 + bounceScore);
        }
        this.tempGuessId = -1;
        this.tempGuess = '';
        this.tempGuessPlayer = new Player('', -1);
        return this.nextTurn();
    }

    public nextTurn() {
        this.currPos++;
        this.rounds++;
        if (this.currPos >= this.players.length) {
            this.currPos = 0;
        }
        if (this.guessedSongCount >= this.songsList.length) {

            let retMsg = '游戏结束：\n当前分数：\n'
            this.scores.forEach((value, key) => {
                retMsg += key.name + ":" + value + "\n"
            });
            retMsg += '歌曲列表：\n'
            for (const index in this.songsList) {
                retMsg += `${Number(index) + 1}、 ${this.songsList[index].name} —— ${this.songsList[index].artist}\n`;
            }
            return retMsg;
        }
        return this.currTurn();

    }

    public sortSongs(rule: string | undefined) {
        if (rule == 'random' || rule == 'r' || rule == undefined) {
            this.songsList.sort(() => {
                return Math.random() - 0.5;
            });
            return;
        }
        if (rule == 'up') {
            this.songsList.sort((a, b) => {
                return a.name.length - b.name.length
            });
            return;
        }
        if (rule == 'down') {
            this.songsList.sort((a, b) => {
                return b.name.length - a.name.length
            });
            return;
        }
    }

    public getPlayers(): Player[] {
        return this.players;
    }

    public currTurn(showFullSongs = false): string {

        RoomDB.saveRoom(this.getDBData());
        let message = '';
        let currPlayer = this.players[this.currPos];
        message = `下一位玩家：${currPlayer.name}(${currPlayer.id})\n`;
        message += `当前翻开字符：${this.masks}\n`;
        for (const index in this.songsList) {
            let song = this.songsList[index]
            let guessed = this.songs.get(song);
            if (guessed) {
                let guessedRound = this.songsRound.get(song) as number
                if (!(!isNaN(guessedRound) && guessedRound != 0 && this.rounds - guessedRound > 2 && !showFullSongs)) {
                    message += `${Number(index) + 1}、 ${this.songsList[index].name} —— ${this.songsList[index].artist}\n`;
                }
            } else {
                message += `${Number(index) + 1}、 ${this.songsList[index].getMaskedName(this.masks)}\n`;
            }
        }
        return message;
    }

    public getDBData(): RoomDBInfo {
        let songs: CacheSongInfo[] = [];
        this.songsList.forEach((song, index) => {
            songs.push({
                name: song.name,
                artist: song.artist,
                isGuessed: this.songs.get(song) as boolean,
                guessedRound: this.songsRound.get(song) as number,
                position: index
            } as CacheSongInfo);
        });
        let players: CachePlayerInfo[] = [];
        this.players.forEach((player, index) => {
            players.push({
                name: player.name,
                id: player.id,
                score: this.scores.get(player) as number,
                position: index
            } as CachePlayerInfo);
        });

        let roomDBInfo: RoomDBInfo = {
            sessionCode: this.sessionCode,
            host: this.host,
            maxPlayers: this.maxPlayers,
            currPos: this.currPos,
            masks: this.masks,
            songs: songs,
            players: players
        }
        return roomDBInfo;
    }

    public endGame(): string {
        this.isStart = false;
        let retMsg = '游戏结束：\n当前分数：\n'
        this.scores.forEach((value, key) => {
            retMsg += key.name + ":" + value + "\n"
        });
        retMsg += '歌曲列表：\n'
        for (const index in this.songsList) {
            retMsg += `${Number(index) + 1}、 ${this.songsList[index].name} —— ${this.songsList[index].artist}\n`;
        }
        return retMsg;
    }

    public reduceScore(player: Player, score: number): void {
        this.scores.set(player, this.scores.get(player) as number - score);
    }

    public isSongGuessed(song: Song): boolean {
        return this.songs.get(song) as boolean
    }



}