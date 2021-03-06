import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { WsService } from '../../services/wsService';
import { PcService } from '../../services/pcService';
import { Signal } from 'src/app/models/signal';

@Component({
  selector: 'app-webrtc',
  templateUrl: './webrtc.component.html',
  styleUrls: ['./webrtc.component.css']
})
export class WebrtcComponent
  implements OnInit
{
  constructor(
    private wsService : WsService,
    private pcService : PcService
  ) { }

  ngOnInit(): void 
  {
    this.wsService.onMsg.subscribe(t => this.onMsg(t));
    this.pcService.onIceCandidate.subscribe(e => this.onIceCandidate(e));
    // this.pcService.onIceStateChange.subscribe(e => this.onIceStateChange(e));
    this.pcService.gotRemoteStream.subscribe(e => this.gotRemoteStream(e));
  }

  ngAfterViewInit()
  {
    this.wsService.init();
  }

  @ViewChild('startButton') startButton: ElementRef;
  @ViewChild('callButton') callButton: ElementRef;
  @ViewChild('hangupButton') hangupButton: ElementRef;
  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;

  startButtonDisabled = false;
  shareButtonDisabled = false;
  callButtonDisabled = false;
  hangupButtonDisabled = true;
  private localStream: MediaStream;
  constraints =
  {
    audio: true,
    video: true
  };

  onIceCandidate(event: RTCPeerConnectionIceEvent)
  {
    if (event.candidate)
    {
      this.wsService.send('candidate', event.candidate);
      this.trace(''+ event.candidate.type);
    }
  }

  gotStream(stream: MediaStream)
  {
    this.trace('Received local stream');
    this.localVideo.nativeElement.srcObject = stream;
  }
  
  errorMsg(msg: string, error: any)
  {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML = '';
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined')
    {
        console.error(error);
    }
  }

  handleHangUp()
  {
    console.log('Remote Hanging Up');
    this.errorMsg("Remote hung up the call", undefined);
    this.pcService.close();
    this.hangupButtonDisabled= true;
    this.callButtonDisabled = false;
  }

  initPc()
  {
    this.pcService.init();
    if(!this.localStream)
    {
      this.openStream({ 
        audio: true,
        video: false 
      }).then(stream => this.pcService.addTrack(stream));
    }
    else
    {
      this.pcService.addTrack(this.localStream);
    }
  }

  onMsg(signal: Signal)
  {
    switch (signal.event)
    {
      case "create":
        if(confirm("Incoming call"))
        {
          this.initPc();
          this.pcService.createOffer()
            .then(offer => this.wsService.send('offer', offer));
            this.callButtonDisabled = true;
            this.hangupButtonDisabled = false;
            this.shareButtonDisabled = false;
        }
        break;
      case "offer":
        this.errorMsg("Remote ansewered", undefined);
        this.pcService.handleOffer(signal.data)
          .then(answer => this.wsService.send('answer', answer));
        this.callButtonDisabled = true;
        this.hangupButtonDisabled = false;
        this.shareButtonDisabled = false;
        break;
      case "answer":
        this.pcService.handleAnswer(signal.data);
        this.errorMsg("Established.", undefined);
        break;
      // when a remote peer sends an ice candidate to us
      case "candidate":
        this.pcService.handleCandidate(signal.data);
        break;
      case "hangUp":
        this.handleHangUp();
        break;
      default:
        break;
    }
  }

  upgrade() : void
  {
    this.startButtonDisabled = true;
    this.shareButtonDisabled = false;
    navigator.mediaDevices
      .getUserMedia({ 
        audio: true,
        video: true 
      }).then(stream => {
        this.localStream = stream;
        const audioTracks = stream.getAudioTracks();
        this.localStream.removeTrack(audioTracks[0]);
        this.gotStream(this.localStream);
        this.pcService.addTrack(stream);
        return this.pcService.createOffer()
      }).then(offer => this.wsService.send('offer', offer));
  }

  async openStream(constraints: MediaStreamConstraints)
  {
    if (this.callButtonDisabled)
    {
      this.upgrade();
      return;
    }
    let stream: MediaStream;
    if(constraints)
    {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    }
    else
    {
      this.startButtonDisabled = true;
      stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      this.localStream = stream;
      const audioTracks = stream.getAudioTracks();
      this.localStream.removeTrack(audioTracks[0]);
      this.gotStream(this.localStream);
    }
    this.trace('Added local stream to pc');
    return stream;
  }

  shareScreen()
  {
    this.startButtonDisabled = false;
    this.shareButtonDisabled = true;
    const mediaDevices = navigator.mediaDevices as any;
    mediaDevices.getDisplayMedia({video: true})
      .then(stream => {
        this.localStream = stream;
        this.gotStream(this.localStream);
        this.openStream({ 
          audio: true,
          video: false 
        }).then(audioStream => stream.addTrack(audioStream.getAudioTracks()));
        this.pcService.addTrack(stream);
        return this.pcService.createOffer();
      }).then(offer => this.wsService.send('offer', offer));
  }
  
  call()
  {
    this.initPc();
    this.wsService.send('create', null);
  }

  gotRemoteStream(e: RTCTrackEvent)
  {
    if (this.remoteVideo.nativeElement.srcObject !== e.streams[0]) {
      this.remoteVideo.nativeElement.srcObject = e.streams[0];
      this.trace('Received remote stream');
    }
  }

  hangup()
  {
    this.trace('Ending call');
    this.pcService.close();
    this.hangupButtonDisabled = true;
    this.callButtonDisabled = false;
  }

  trace(arg: string)
  {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ', arg);
  }
}
