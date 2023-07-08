import Player from "../game/Player";
import Song from "../game/Song";
import RoomPool from "../pool/RoomPool";
import Logger from "../util/Logger";

const c = new Logger("MessageProcessor", "cyan");

export default class MessageProcessor {

    public static processPrivate(message: string, sender: any) {
        if (message.startsWith('/help')) {
            return this.sendFriendMessage(sender, `/sgc 开字母小游戏\n/sgc add [歌名] [曲师] (如有空格请用引号包裹e.g /sgc add "N3V3R G3T OV3R" C-Show)\n/g [字符] 猜测一个字符\n/s [id] [猜测歌名] 猜测完整歌名`)
        }
        if (message.startsWith('/sgc')) {
            var command = message.split(' ')
            if (command.length < 2) {
                return this.sendFriendMessage(sender, "参数不足")
            }
            var room = RoomPool.getInstance().getRoomByHost(sender)
            if (room == undefined) return this.sendFriendMessage(sender, "你没有创建房间")
            switch (command[1]) {
                case 'add':
                    let songName = command[2]
                    let i = 2
                    if (songName.startsWith('"')) {
                        songName = songName.substring(1)
                        if (!songName.endsWith('"')) {
                            for (i = 3; i < command.length; i++) {
                                songName += " " + command[i]
                                if (command[i].endsWith('"')) {
                                    songName = songName.substring(0, songName.length - 1)
                                    break
                                }
                            }
                        } else {
                            songName = songName.substring(0, songName.length - 1)
                        }
                    }
                    console.log(songName)
                    console.log(command)
                    let songAuthor = command[i + 1]
                    console.log(songAuthor)
                    if (songAuthor.startsWith('"')) {
                        songAuthor = songAuthor.substring(1)
                        if (!songAuthor.endsWith('"')) {
                            for (i = i + 2; i < command.length; i++) {
                                songAuthor += " " + command[i]
                                if (command[i].endsWith('"')) {
                                    songAuthor = songAuthor.substring(0, songAuthor.length - 1)
                                    break
                                }
                            }
                        } else {
                            songAuthor = songAuthor.substring(0, songAuthor.length - 1)
                        }
                    }
                    room.addSong(new Song(songName, songAuthor))
                    var index = 0;
                    var songs = '';
                    room.getSongs().forEach((song) => {
                        index++;
                        songs += `${index}、 ${song.name} —— ${song.artist}\n`;
                    })
                    return this.sendFriendMessage(sender, "添加成功,当前歌曲:\n" + songs)
                case 'del':
                    let songIndex = parseInt(command[2])
                    if (isNaN(songIndex)) return this.sendFriendMessage(sender, "参数错误")
                    if (songIndex < 1 || songIndex > room.getSongs().length) return this.sendFriendMessage(sender, "参数错误")
                    room.removeSong(songIndex - 1)
                    var index = 0;
                    var songs = '';
                    room.getSongs().forEach((song) => {
                        index++;
                        songs += `${index}、 ${song.name} —— ${song.artist}\n`;
                    })
                    return this.sendFriendMessage(sender, "删除成功,当前歌曲:\n" + songs)
                default:
                    return this.sendFriendMessage(sender, "未知命令")
            }
        }
    }

    public static processGroup(message: string, sender: any) {
        let player = new Player(sender.memberName, sender.id)
        if (message.startsWith('/help')) {
            return this.sendGroupMessage(sender, "/sgc 开字母小游戏\n/sgc create 发起一个开字母小游戏\n/sgc join 加入当前群聊的开字母小游戏\n/sgc scores 查看当前游戏分数\n/g [字符] 猜测一个字符\n/s [id] [猜测歌名] 猜测完整歌名")
        }
        if (message.startsWith('/sgc')) {
            var command = message.split(' ')
            if (command.length < 2) {
                return this.sendGroupMessage(sender, "参数不足")
            }
            switch (command[1]) {
                case 'y':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是房主")
                    return this.sendGroupMessage(sender, room.checkGuess(true))
                case 'n':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是房主")
                    return this.sendGroupMessage(sender, room.checkGuess(false))
                case 'create':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room != undefined) return this.sendGroupMessage(sender, "当前群聊已经有一个游戏了")
                    if (command[2]) {
                        RoomPool.getInstance().createRoom(sender.group.id, player, Number(command[2]))
                    }
                    RoomPool.getInstance().createRoom(sender.group.id, player)
                    return this.sendGroupMessage(sender, "创建成功,请私聊bot添加乐曲(请先添加bot账号好友)")
                case 'join':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有游戏")
                    if (room.host.id == player.id) return this.sendGroupMessage(sender, "你是房主")
                    if (room.addPlayer(player)) {
                        return this.sendGroupMessage(sender, "加入成功")
                    } else {
                        return this.sendGroupMessage(sender, "你已经加入了")
                    }
                case 'scores':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有游戏")
                    let scores = room.getScores()
                    let retMsg = '当前分数：\n'
                    scores.forEach((value, key) => {
                        retMsg += key.name + ":" + value + "\n"
                    });
                    return this.sendGroupMessage(sender, retMsg)
                case 'start':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是房主")
                    if (room.getSongs().length == 0) return this.sendGroupMessage(sender, "当前没有歌曲")
                    return this.sendGroupMessage(sender, room.nextTurn())
                default:
                    return this.sendGroupMessage(sender, "未知命令")
            }
        }
        if (message.startsWith('/g')) {
            var room = RoomPool.getInstance().getRoom(sender.group.id)
            if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有游戏")
            if (message.length != 3) return this.sendGroupMessage(sender, "你只能猜测一个字符")
            room.addMask(message[2])
            let retMsg = ''
            room.getMaskedSongs().forEach((value) => {
                retMsg += value + "\n"
            });
            return this.sendGroupMessage(sender, retMsg)
        }
        if (message.startsWith('/s')) {
            var command = message.split(' ')
            if (command.length < 2) {
                return this.sendGroupMessage(sender, "参数不足 /s [id] [猜测歌名]")
            }
            let id = Number(command[1])
            let songName = command[2]
            if (command.length > 3) {   //歌名有空格
                for (let i = 3; i < command.length; i++) {
                    songName += " " + command[i]
                }
            }
            var room = RoomPool.getInstance().getRoom(sender.group.id)
            if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有游戏")
            if (!room.hasPlayer(player)) return this.sendGroupMessage(sender, "你未参与当前游戏！")
            room.guessSong(id, songName, player)
            return this.sendGroupMessage(sender, "当前猜测[" + id + "][" + songName + "]\n请等待主持人判定（/sgc y\\n）")
        }
        return {}

    }


    private static sendGroupMessage(sender: any, message: string) {
        return { command: "sendGroupMessage", content: { target: sender.group.id, messageChain: [{ "type": "Plain", "text": message }] } }
    }

    private static sendFriendMessage(sender: any, message: string) {
        return { command: "sendFriendMessage", content: { target: sender.id, messageChain: [{ "type": "Plain", "text": message }] } }
    }

} 