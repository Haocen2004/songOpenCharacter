export default class Song {
    private lowerCaseName: string;
    private scores: number;

    constructor(public name: string, public artist: string) {
        this.name = name;
        this.lowerCaseName = name.toLowerCase();
        this.artist = artist;
        this.scores = name.toLowerCase().replace(' ', '').length
    }


    public getMaskedName(masks: string[]): string {
        let result = '';
        this.lowerCaseName.split("").forEach((char, _index) => {
            if (char == ' ') {
                result += ' ';
            } else if (masks.includes(char.toLocaleLowerCase())) {
                result += char
            } else {
                result += '*'
            }
        });
        return result;
    }

    public getMaskedScore(masks: string[]): number {
        let score = 0;
        this.lowerCaseName.split("").forEach((char, _index) => {
            if (masks.includes(char.toLocaleLowerCase())) {
                score++
            }
        });
        return score;
    }

    public isFullGuess(masks: string[]): boolean {
        return this.getMaskedScore(masks) === this.scores

    }


}