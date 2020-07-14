import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WebrtcComponent } from './webrtc/webrtc.component'

const routes : Routes = [
    { path : 'connect', component : WebrtcComponent }
]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule
{

}