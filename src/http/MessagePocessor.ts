import RoomDB from "../db/RoomDB";
import Song from "../game/Song";
import PlayerPool from "../pool/PlayerPool";
import RoomPool from "../pool/RoomPool";
import Logger from "../util/Logger";

const c = new Logger("MessageProcessor", "cyan");

export default class MessageProcessor {

    private static lastTime: number;

    public static processPrivate(message: string, sender: any) {
        let player = PlayerPool.getInstance().getPlayer(sender.id, sender.memberName)
        let helpmsg = `开字母小游戏帮助菜单\n/sgc add <歌名> [曲师] (如有空格请用引号包裹 e.g /sgc add "歌 名" "曲 师")\n/sgc del <序号> 删除一首歌曲\n/sgc sort [random|up|down] 排序乐曲，不带参数为随机\n以下为群聊使用：\n/sgc start [c?] 开始游戏(可选初始是否带一个开过的字符)\n/sgc end [confirm] 结束游戏\n/sgc next 跳过这位玩家\n/sgc reset 重置歌曲和进度，保留分数\n/sgc hardreset 完全重置，需要重新/sgc create 来开始新游戏`
        if (message.startsWith('/help')) {
            return this.sendFriendMessage(sender, helpmsg)
        }
        if (message.startsWith('/sgc')) {
            if (message.startsWith('/sgc h')) {
                return this.sendFriendMessage(sender, helpmsg)
            }
            var command = message.split(' ')
            if (command.length < 2) {
                return this.sendFriendMessage(sender, "参数不足,请使用 /sgc help 查看帮助")
            }
            var room = RoomPool.getInstance().getRoomByHost(player)
            if (room == undefined) return this.sendFriendMessage(sender, "你没有创建任何房间")
            if (Date.now() - this.lastTime < 100) return
            if (Date.now() - this.lastTime < 1000) return this.sendFriendMessage(sender, "操作过于频繁，请稍后再试")
            this.lastTime = Date.now()
            switch (command[1]) {
                case 'add':
                    if (room.getSongs().length >= 15) return this.sendFriendMessage(sender, "歌曲数量已达到上限")
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
                    console.log(command)
                    if (songName.length < 1) return this.sendFriendMessage(sender, "乐曲名不能为空")
                    console.log(songName)
                    // if (i+1 < command.length) return this.sendFriendMessage(sender, "参数错误")
                    let songAuthor = ''
                    try {
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
                        RoomDB.saveRoom(room.getDBData())
                        room.getSongs().forEach((song) => {
                            index++;
                            songs += `${index}、 ${song.name} —— ${song.artist}\n`;
                        })
                        return this.sendFriendMessage(sender, "添加成功,当前歌曲列表:\n" + songs)
                    } catch (err) {
                        console.log(err)
                    }

                    room.addSong(new Song(songName, songAuthor))
                    var index = 0;
                    var songs = '';
                    RoomDB.saveRoom(room.getDBData())
                    room.getSongs().forEach((song) => {
                        index++;
                        songs += `${index}、 ${song.name} —— ${song.artist}\n`;
                    })
                    return this.sendFriendMessage(sender, "添加成功,当前歌曲列表:\n" + songs)
                case 'd':
                case 'del':
                case 'delete':
                case 'r':
                case 'rm':
                case 'remove':
                    let songIndex = parseInt(command[2])
                    if (isNaN(songIndex)) return this.sendFriendMessage(sender, "参数错误")
                    if (songIndex < 1 || songIndex > room.getSongs().length) return this.sendFriendMessage(sender, "参数错误")
                    room.removeSong(songIndex - 1)
                    RoomDB.saveRoom(room.getDBData())
                    var index = 0;
                    var songs = '';
                    room.getSongs().forEach((song) => {
                        index++;
                        songs += `${index}、 ${song.name} —— ${song.artist}\n`;
                    })
                    return this.sendFriendMessage(sender, "删除成功,当前歌曲列表:\n" + songs)
                case 'sort':
                    room.sortSongs(command[2])
                    RoomDB.saveRoom(room.getDBData())
                    var index = 0;
                    var songs = '';
                    room.getSongs().forEach((song) => {
                        index++;
                        songs += `${index}、 ${song.name} —— ${song.artist}\n`;
                    })
                    return this.sendFriendMessage(sender, "排序完成,当前歌曲列表:\n" + songs)
                default:
                    return this.sendFriendMessage(sender, "未知命令")
            }
        }
    }

    public static processGroup(message: string, sender: any) {
        let player = PlayerPool.getInstance().getPlayer(sender.id, sender.memberName)
        if (message.startsWith('/sgc')) {
            var command = message.split(' ')
            if (command.length < 2) {
                return this.sendGroupMessage(sender, "参数不足,请使用/sgc help查看帮助")
            }
            switch (command[1]) {
                case 'help':
                    return this.sendGroupMessage(sender, "开字母小游戏帮助菜单\n/sgc create 发起一个开字母小游戏并成为主持人\n/sgc join 加入当前群聊的开字母小游戏\n/sgc scores 查看当前游戏分数\n/sgc info 查看当前回合信息\n\n/g [字符] 猜测一个字符\n/s [id] [猜测歌名] 猜测完整歌名")
                case 'y':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是主持人，不能执行此操作")
                    return this.sendGroupMessage(sender, room.checkGuess(true))
                case 'n':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是主持人，不能执行此操作")
                    return this.sendGroupMessage(sender, room.checkGuess(false))
                case 'next':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是主持人，不能执行此操作")
                    return this.sendGroupMessage(sender, room.nextTurn())
                case 'create':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room != undefined) return this.sendGroupMessage(sender, `${room.host.name}(${room.host.id})已经发起了一场游戏！`)
                    if (command[2]) {
                        room = RoomPool.getInstance().createRoom(sender.group.id, player, Number(command[2]))
                    } else {
                        room = RoomPool.getInstance().createRoom(sender.group.id, player)
                    }
                    if (room == undefined) return this.sendGroupMessage(sender, "创建失败，请稍后再试")
                    RoomDB.saveRoom(room.getDBData())
                    return this.sendGroupMessage(sender, "创建成功,请私聊bot添加乐曲(请先添加bot账号好友)")
                case 'join':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id == player.id) return this.sendGroupMessage(sender, "你是主持人，无法加入玩家队列")
                    if (room.addPlayer(player)) {
                        RoomDB.saveRoom(room.getDBData())
                        return this.sendGroupMessage(sender, `加入成功，当前共 ${room.getPlayers().length} 名玩家`)
                    } else {
                        return this.sendGroupMessage(sender, "你已经在当前游戏中了！")
                    }
                case 'leave':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id == player.id) {
                        if (room.isStarted()) {
                            return this.sendGroupMessage(sender, "游戏已经开始，主持人无法退出，请在游戏结束后再试")
                        }
                        RoomPool.getInstance().removeRoom(room)
                        RoomDB.removeRoom(room.sessionCode)
                        return this.sendGroupMessage(sender, "主持人已退出，游戏自动重置")
                    }
                    switch (room.removePlayer(player)) {
                        case 0:
                            return this.sendGroupMessage(sender, "你不在玩家队列中")
                        case 1:
                            RoomDB.saveRoom(room.getDBData())
                            return this.sendGroupMessage(sender, "离开成功")
                        case -1:
                            RoomDB.saveRoom(room.getDBData())
                            return this.sendGroupMessage(sender, "当前回合玩家退出，重新计算下回合\n" + room.currTurn())
                        case -2:
                            RoomDB.saveRoom(room.getDBData())
                            return this.sendGroupMessage(sender, "所有玩家退出，游戏已暂停")
                        default:
                            return this.sendGroupMessage(sender, "未知错误")
                    }
                case 'score':
                case 'scores':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    let scores = room.getScores()
                    let retMsg = '当前分数：\n'
                    scores.forEach((value, key) => {
                        retMsg += key.name + ":" + value + "\n"
                    });
                    return this.sendGroupMessage(sender, retMsg)
                case 'info':
                    var room = RoomPool.getInstance().getRoom(sender.group.id);
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.isStarted() == false) return this.sendGroupMessage(sender, "游戏还没开始")
                    return this.sendGroupMessage(sender, room.currTurn(true))
                case 'start':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是主持人，不能执行此操作")
                    if (room.getSongs().length == 0) return this.sendGroupMessage(sender, "当前没有添加歌曲")
                    if (room.getPlayers().length == 0) return this.sendGroupMessage(sender, "当前没有玩家加入")
                    if (room.isStarted()) return this.sendGroupMessage(sender, "游戏已经开始了，请不要重复操作")
                    room.isStarted(true)
                    if (command[2] && command[2].length == 1) {
                        room.addMask(command[2])
                    }
                    return this.sendGroupMessage(sender, room.nextTurn())
                case 'end':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是主持人，不能执行此操作")
                    if (room.isStarted() == false) return this.sendGroupMessage(sender, "游戏还没开始")
                    if (command[2] && command[2] == 'confirm') {
                        return this.sendGroupMessage(sender, room.endGame())
                    }
                    return this.sendGroupMessage(sender, '确认要结束游戏吗 如果是请输入/sgc end confirm')
                case 'reset':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是主持人，不能执行此操作")
                    room.reset()
                    return this.sendGroupMessage(sender, "重置成功,请私聊bot添加乐曲(玩家无需重新加入，分数保留)")
                case 'hardreset':
                    var room = RoomPool.getInstance().getRoom(sender.group.id)
                    if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
                    if (room.host.id != player.id) return this.sendGroupMessage(sender, "你不是主持人，不能执行此操作")
                    RoomPool.getInstance().removeRoom(room)
                    RoomDB.removeRoom(room.sessionCode)
                    return this.sendGroupMessage(sender, "重置成功,若要重新开始请使用/sgc create创建一局新游戏")
                default:
                    return this.sendGroupMessage(sender, "未知命令")
            }
        }
        if (message.startsWith('/g')) {
            var room = RoomPool.getInstance().getRoom(sender.group.id)
            if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
            if (!room.hasPlayer(player)) return this.sendGroupMessage(sender, "你未参与当前游戏！")
            if (!room.isActivePlayer(player)) {
                room.reduceScore(player, 2);
                return this.sendGroupMessage(sender, "还没轮到你猜测！-2")
            }
            if (message.length != 4) return this.sendGroupMessage(sender, "你只能猜测一个字符")
            if (room.addMask(message[3], player)) {
                return this.sendGroupMessage(sender, room.nextTurn())
            } else {
                return this.sendGroupMessage(sender, "这个字符已经开过了！")
            }
        }
        if (message.startsWith('/s ')) {
            var room = RoomPool.getInstance().getRoom(sender.group.id)
            if (room == undefined) return this.sendGroupMessage(sender, "当前群聊没有发起开字母小游戏")
            if (!room.hasPlayer(player)) return this.sendGroupMessage(sender, "你未参与当前游戏！")
            if (!room.isActivePlayer(player)) {
                room.reduceScore(player, 2);
                return this.sendGroupMessage(sender, "还没轮到你猜测！-2")
            }
            var command = message.split(' ')
            if (command.length <= 2) {
                return this.sendGroupMessage(sender, "参数不足 /s [id] [猜测歌名]")
            }
            try {
                let id = Number(command[1])
                if (isNaN(id)) return this.sendFriendMessage(sender, "序号错误")
                if (room.getSongs().length < (id - 1)) return this.sendGroupMessage(sender, "序号错误")
                if (room.isSongGuessed(room.getSongs()[(id - 1)])) return this.sendGroupMessage(sender, "这首歌已经被猜过了")
                let songName = command[2]
                if (command.length > 3) {   //歌名有空格
                    for (let i = 3; i < command.length; i++) {
                        songName += " " + command[i]
                    }
                }
                let msg = room.guessSong(id - 1, songName, player)

                if (msg == '') {
                    return this.sendGroupMessage(sender, "当前猜测[" + id + "][" + songName + "]\n请等待主持人判定（/sgc y\\n）")
                } else {
                    return this.sendGroupMessage(sender, msg)
                }
            } catch (e) {
                return this.sendGroupMessage(sender, "序号错误")
            }

        }
        return {}

    }


    private static sendGroupMessage(sender: any, message: string) {
        let number = /[1-9][0-9]{4,}/.exec(message)
        if (number != null) {
            let uid = Number(number[0])
            if (uid > 10000) {
                let player = PlayerPool.getInstance().getPlayer(uid, 'null;placeholder')
                if (!(player.name == 'null;placeholder')) {
                    let playerMsg = `${player.name}(${player.id})`
                    let msg = message.split(playerMsg)
                    return { command: "sendGroupMessage", content: { target: sender.group.id, messageChain: [{ "type": "Plain", "text": msg[0] }, { "type": "At", "target": player.id }, { "type": "Plain", "text": msg[1] }] } }
                }
            }
        }
        return { command: "sendGroupMessage", content: { target: sender.group.id, messageChain: [{ "type": "Plain", "text": message }] } }
    }

    private static sendFriendMessage(sender: any, message: string) {
        return { command: "sendFriendMessage", content: { target: sender.id, messageChain: [{ "type": "Plain", "text": message }] } }
    }

} 