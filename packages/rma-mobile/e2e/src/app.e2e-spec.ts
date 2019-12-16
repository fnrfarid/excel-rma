import { AppPage } from './app.po';

describe('new App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should be reached', () => {
    page.navigateTo();
    expect(page).toBeDefined();
  });
});
