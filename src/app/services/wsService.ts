import { Injectable } from '@angular/core';
import { Signal } from '../models/signal';
import { Subject } from 'rxjs';

@Injectable()
export class WsService
{
    private ws: WebSocket;

    public onMsg: Subject<Signal> = new Subject<Signal>();

    constructor(){}

    public init() : void
    {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        this.ws = new WebSocket(protocol + '://localhost:5000/socket');
        this.ws.addEventListener('open', e => this.trace(e));
        this.ws.addEventListener('message', 
            msg => this.onMsg.next(JSON.parse(msg.data) as Signal)
        );
    }

    public send(event : string, data: any) : void
    {
        const signal = new Signal();
        signal.event = event;
        signal.data = data;
        this.ws.send(JSON.stringify(signal));
    }  

    private trace(arg) : void
    {
        var now = (window.performance.now() / 1000).toFixed(3);
        console.log(now + ': ', arg);
    }
}