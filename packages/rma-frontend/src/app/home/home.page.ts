import { Component, OnInit } from '@angular/core';
import { ACCESS_TOKEN, ACCESS_TOKEN_EXPIRY } from '../constants/storage';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  loggedIn: boolean;
  picture: string;
  expires: string;
  state: string;
  accessToken: string;

  constructor() {
    this.loggedIn = localStorage.getItem(ACCESS_TOKEN) ? true : false;
  }

  ngOnInit() {
    this.setUserSession();
  }

  setUserSession() {
    this.accessToken = localStorage.getItem(ACCESS_TOKEN);
    this.expires = localStorage.getItem(ACCESS_TOKEN_EXPIRY);
  }
}
