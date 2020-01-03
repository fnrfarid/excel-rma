import { Component, OnInit } from '@angular/core';
import { IonSlides } from '@ionic/angular';

@Component({
  selector: 'app-view-sales-invoice',
  templateUrl: './view-sales-invoice.page.html',
  styleUrls: ['./view-sales-invoice.page.scss'],
})
export class ViewSalesInvoicePage implements OnInit {
  selectedSegment: any;
  selectedSlide: any;
  sliderOptions = {
    initialSlide: 0,
    slidesPerView: 1,
    speed: 400,
  };

  constructor() {}

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
}
