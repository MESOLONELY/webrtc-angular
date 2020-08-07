import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class PcService
{
    private pc: RTCPeerConnection;
    public onIceCandidate: Subject<RTCPeerConnectionIceEvent> = new Subject<RTCPeerConnectionIceEvent>();
    // public onIceStateChange: Subject<any> = new Subject<any>();
    public gotRemoteStream: Subject<RTCTrackEvent> = new Subject<RTCTrackEvent>();

    constructor(){}

    configuration =
    {
        "iceServers" : [{
            "urls" : "stun:stun2.1.google.com:19302"
        }]
    };

    public async handleOffer(offer)
    {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    public handleAnswer(answer) : void
    {
        this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }

    public handleCandidate(candidate) : void
    {
        this.pc.addIceCandidate(candidate);
    }

    public init() : void
    {
        this.pc = new RTCPeerConnection(this.configuration);
        this.pc.addEventListener('icecandidate',
            e => this.onIceCandidate.next(e)
        );
        // this.pc.addEventListener('iceconnectionstatechange',
        //     e => this.onIceStateChange.next(e)
        // );
        this.pc.addEventListener('track', 
            e => this.gotRemoteStream.next(e)
        );
    }

    public addTrack(stream : MediaStream) : void
    {
        stream.getTracks().forEach(track =>
        {
            this.pc.addTrack(track, stream);
        });
    }

    public async createOffer()
    {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return offer;
    }

    public close()
    {
        this.pc.close();
    }
}