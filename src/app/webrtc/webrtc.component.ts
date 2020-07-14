import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-webrtc',
  templateUrl: './webrtc.component.html',
  styleUrls: ['./webrtc.component.css']
})
export class WebrtcComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.conn = new WebSocket('ws://localhost:8080/socket');
    this.conn.addEventListener('open', e => this.trace(e));
    this.conn.addEventListener('message', msg => this.onMsg(msg));
  }

  @ViewChild('startButton') startButton: ElementRef;
  @ViewChild('callButton') callButton: ElementRef;
  @ViewChild('hangupButton') hangupButton: ElementRef;
  @ViewChild('localVideo') localVideo: ElementRef;
  @ViewChild('remoteVideo') remoteVideo: ElementRef;

  startButtonDisabled = false;
  callButtonDisabled = true;
  hangupButtonDisabled = true;

  startTime;
  conn;
  peerConnection;
  servers =
  {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };
  constraints =
  {
    audio: true,
    video: true
  };

  gotStream(stream) {
    this.trace('Received local stream');
    this.localVideo.nativeElement.srcObject = stream;
    this.callButtonDisabled = false;
  }
  
  errorMsg(msg, error)
  {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined')
    {
        console.error(error);
    }
  }

  send(message)
  {
    this.conn.send(JSON.stringify(message));
  }

  async handleOffer(offer)
  {
    this.callButtonDisabled = true;
    this.hangupButtonDisabled = false;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peerConnection.createAnswer();
    this.send({
        event : "answer",
        data : answer
    });
    await this.peerConnection.setLocalDescription(answer);
  }

  handleAnswer(answer)
  {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("connection established successfully!!");
  }

  handleCandidate(candidate)
  {
    this.peerConnection.addIceCandidate(candidate);
  }

  handleHangUp()
  {
    console.log('Remote Hanging Up');
    this.errorMsg("Remote hung up the call", undefined);
    this.hangupButtonDisabled= true;
  }

  onMsg(msg)
  {
    console.log('Got message', msg.data);
    const { event, data } = JSON.parse(msg.data);
    switch (event)
    {
        case "offer":
            this.handleOffer(data);
            break;
        case "answer":
            this.handleAnswer(data);
            break;
        // when a remote peer sends an ice candidate to us
        case "candidate":
            this.handleCandidate(data);
            break;
        case "hangUp":
            this.handleHangUp();
            break;
        default:
            break;
    }
  }

  async start()
  {
    this.trace('Requesting local stream');
    this.startButtonDisabled = true;
    this.peerConnection = new RTCPeerConnection(this.servers);
    
    const stream = await navigator.mediaDevices.getUserMedia(this.constraints);

    this.peerConnection.addEventListener('icecandidate', event =>
    {
      if (event.candidate) {
        this.send({
            event : "candidate",
            data : event.candidate
        });
      }
    });
    this.peerConnection.addEventListener('track', this.gotRemoteStream);
    stream.getTracks().forEach(track =>
    {
      this.peerConnection.addTrack(track, stream);
    });
    this.trace('Added local stream to pc');
    this.gotStream(stream);
  }
  
  async call() {
    this.callButtonDisabled = true;
    this.hangupButtonDisabled = false;
    this.trace('Starting call');
    this.startTime = window.performance.now();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.send({
      event : "offer",
      data : offer
    });
  }

  gotRemoteStream(e) {
    if (this.remoteVideo.nativeElement.srcObject !== e.streams[0]) {
      this.remoteVideo.nativeElement.srcObject = e.streams[0];
      this.trace('Received remote stream');
    }
  }

  hangup() {
    this.trace('Ending call');
    this.peerConnection.close();
    this.hangupButtonDisabled = true;
    this.callButtonDisabled = false;
  }

  trace(arg) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ', arg);
  }
}
