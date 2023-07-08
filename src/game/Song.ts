export default class Song {
    private lowerCaseName: string;

    constructor(public name: string, public artist: string) {
        this.name = name;
        this.lowerCaseName = name.toLowerCase();
        this.artist = artist;
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


}