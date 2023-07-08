import express from 'express';
import Config from '../util/Config';
import Logger from '../util/Logger';
import { Express } from 'express-serve-static-core';
import MessageProcessor from './MessagePocessor';
const c = new Logger("HTTP", "cyan");

export default class HttpServer {
    private readonly server: Express;
    private static instance: HttpServer;

    private constructor() {
        this.server = express();

        this.server.use((req, res, next) => {
            c.log(`[${req.method}][${Date.now()}] ${req.originalUrl}`)
            next()
        });

        this.server.use(express.json());

        this.server.use('/', async function (res, req) {
            let body = res.body;
            if (body.type == "GroupMessage" || body.type == "FriendMessage") {
                let msg = ''
                body.messageChain.forEach((element: { type: string; text?: string; }) => {
                    if (element.type == "Plain") {
                        msg += element.text
                    }
                });
                c.log(msg)
                if (body.type == "FriendMessage") {
                    req.json(MessageProcessor.processPrivate(msg, body.sender))
                } else {
                    req.json(MessageProcessor.processGroup(msg, body.sender))
                }
                return
            } else if (body.type == "NewFriendRequestEvent") {
                c.log(body)
                c.log('accpet friend' + body.fromId)
                req.json({
                    command: "resp_newFriendRequestEvent", content: {
                        eventId: body.eventId,
                        fromId: body.fromId,
                        groupId: body.groupId,
                        operate: 0,
                        message: ""
                    }
                });
            } else if (body.type == "BotInvitedJoinGroupRequestEvent") {
                c.log(body)
                c.log('join group' + body.groupId)
                req.json({
                    command: "resp_botInvitedJoinGroupRequestEvent", content: {
                        eventId: body.eventId,
                        fromId: body.fromId,
                        groupId: body.groupId,
                        operate: 0,
                        message: ""
                    }
                });
            } else {
                c.log(body)
                req.json({})
            }
        })

    }

    public start(): void {
        this.server.listen(Config.HTTP.HTTP_PORT, Config.HTTP.HTTP_HOST, () => {
            c.log(`Listening on ${Config.HTTP.HTTP_HOST}:${Config.HTTP.HTTP_PORT}`);
        });
    }

    public static getInstance(): HttpServer {
        if (!HttpServer.instance) {
            HttpServer.instance = new HttpServer();
        }
        return HttpServer.instance;
    }
}