import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ACCESS_TOKEN,
  ACCESS_TOKEN_EXPIRY,
  EXPIRES_IN,
  STATE,
  LOGGED_IN,
  SCOPE,
} from '../constants/storage';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.page.html',
  styleUrls: ['./callback.page.scss'],
})
export class CallbackPage implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const home = 'home';
    this.route.fragment.subscribe((fragment: string) => {
      const state = localStorage.getItem(STATE);
      localStorage.removeItem(STATE);

      const query = new URLSearchParams(fragment);
      const respState = query.get(STATE);
      if (state === respState) {
        localStorage.setItem(ACCESS_TOKEN, query.get(ACCESS_TOKEN));
        const now = Math.floor(Date.now() / 1000);
        localStorage.setItem(
          ACCESS_TOKEN_EXPIRY,
          (now + Number(query.get(EXPIRES_IN))).toString(),
        );
        localStorage.setItem(SCOPE, query.get(SCOPE));
        localStorage.setItem(LOGGED_IN, 'true');
        this.router.navigateByUrl(home);
        return;
      }
    });
  }
}
