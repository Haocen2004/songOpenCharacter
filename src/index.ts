import HttpServer from "./http/HttpServer";
import Logger from "./util/Logger";
const c = new Logger("Song Open Character");
c.log(`Initializing Song Open Character snapshot 23w28a`);
c.log(`Idea from https://www.bilibili.com/video/BV17k4y1P7Sq`);


HttpServer.getInstance().start()