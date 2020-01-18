import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppService } from './app.service';
import { SalesUiModule } from './sales-ui/sales-ui.module';
import { PurchaseUiModule } from './purchase-ui/purchase-ui.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpErrorHandler } from './common/interfaces/services/http-error-handler/http-error-handler.service';
import { MessageService } from './common/interfaces/services/message/message.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SystemManagerGuard } from './common/guards/system-manager.guard';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    SalesUiModule,
    PurchaseUiModule,
    BrowserAnimationsModule,
  ],
  providers: [
    AppService,
    StatusBar,
    MessageService,
    HttpErrorHandler,
    SplashScreen,
    SystemManagerGuard,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
