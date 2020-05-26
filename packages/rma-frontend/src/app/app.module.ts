import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import * as localforage from 'localforage';
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
import { LoginService } from './api/login/login.service';
import { StorageService, STORAGE_TOKEN } from './api/storage/storage.service';
import { SERVICE_NAME } from './constants/storage';
import { AppCommonModule } from './common/app-common.module';
import { TimeService } from './api/time/time.service';
import { WarrantyUiModule } from './warranty-ui/warranty-ui.module';
import { CsvJsonService } from './api/csv-json/csv-json.service';
import { ProblemUiModule } from './problem-ui/problem-ui.module';
import { JobUIModule } from './job-ui/job-ui.module';
import { ExcelSalesManagerGuard } from './common/guards/excel-sales-manager.guard';
import { ExcelSalesUserGuard } from './common/guards/excel-sales-user.guard';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    JobUIModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    SalesUiModule,
    PurchaseUiModule,
    BrowserAnimationsModule,
    AppCommonModule,
    WarrantyUiModule,
    ProblemUiModule,
  ],
  providers: [
    AppService,
    StatusBar,
    MessageService,
    TimeService,
    CsvJsonService,
    HttpErrorHandler,
    SplashScreen,
    SystemManagerGuard,
    ExcelSalesManagerGuard,
    ExcelSalesUserGuard,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    LoginService,
    {
      provide: STORAGE_TOKEN,
      useFactory: () => {
        localforage.config({ name: SERVICE_NAME });
        return localforage;
      },
    },
    StorageService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
