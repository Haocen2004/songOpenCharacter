const baseArray = "abcdefghijklmnopqrstuvwxyz1234567890"

export default class TextUtil {

    public static genRandomString(length: number) {
        let result = ""
        for (let index = 0; index < length; index++) {
            result += baseArray.charAt(Math.floor(Math.random() * baseArray.length));
        }
        return result
    }

}