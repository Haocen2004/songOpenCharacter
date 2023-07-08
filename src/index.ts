import Database from "./db/Database";
import RoomDB from "./db/RoomDB";
import Room from "./game/Room";
import HttpServer from "./http/HttpServer";
import RoomPool from "./pool/RoomPool";
import Logger from "./util/Logger";
const c = new Logger("Song Open Character");
c.log(`Initializing Song Open Character snapshot 23w28a`);
c.log(`Idea from https://www.bilibili.com/video/BV15s4y1c7Lw`);


HttpServer.getInstance().start()
Database.getInstance().getAll('rooms').then((value) => {
    if (value!!.length < 1) {
        c.log('no cache any room,skip')
    } else {
        for (const data of value!!) {
            RoomDB.loadRoom(data.sessionCode).then((room) => {
                RoomPool.getInstance().sessions.set(room!!.sessionCode, room as Room);
            });
        }
    }
});