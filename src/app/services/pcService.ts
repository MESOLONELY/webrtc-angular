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
            "urls" : 
            [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
                "stun:stun.ekiga.net",
                "stun:stun.ideasip.com",
                "stun:stun.rixtelecom.se",
                "stun:stun.schlund.de",
                "stun:stun.stunprotocol.org:3478",
                "stun:stun.voiparound.com",
                "stun:stun.voipbuster.com",
                "stun:stun.voipstunt.com",
                "stun:stun.voxgratia.org"
            ]
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