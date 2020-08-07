import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app.routing.module';
import { AppComponent } from './app.component';
import { WebrtcComponent } from './components/webrtc/webrtc.component';
import { WsService } from './services/wsService';
import { PcService } from './services/pcService';

@NgModule({
  declarations: [
    AppComponent,
    WebrtcComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    WsService,
    PcService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
