import { Component, OnInit } from '@angular/core';
import { IonSlides } from '@ionic/angular';
import { Location } from '@angular/common';

@Component({
  selector: 'app-warranty-tabs',
  templateUrl: './warranty-tabs.page.html',
  styleUrls: ['./warranty-tabs.page.scss'],
})
export class WarrantyTabsPage implements OnInit {
  selectedSegment: any;
  selectedSlide: any;
  sliderOptions = {
    initialSlide: 0,
    slidesPerView: 1,
    speed: 400,
  };

  constructor(private location: Location) {}

  ngOnInit() {
    this.selectedSegment = 0;
  }

  async segmentChanged(ev) {
    await this.selectedSlide.slideTo(this.selectedSegment);
  }

  slideChanged(slides: IonSlides) {
    this.selectedSlide = slides;
    slides.getActiveIndex().then(index => {
      this.selectedSegment = index;
    });
  }

  navigateBack() {
    this.location.back();
  }
}
