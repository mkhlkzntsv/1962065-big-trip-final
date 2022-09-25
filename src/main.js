import TripTabsView from './view/trip-tabs-view.js';
import StatsView from './view/stats-view.js';
import {render, RenderPosition, remove} from './utils/render.js';
import {generatePoint} from './mock/point.js';
import TripPresenter from './presenter/trip-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import PointsModel from './model/point-model.js';
import FilterModel from './model/filter-model.js';
import {MenuItem} from './utils/const.js';

const TRIP_POINTS_COUNT = 10;

const points = Array.from({length: TRIP_POINTS_COUNT}, generatePoint);

const pointsModel = new PointsModel();
const filterModel = new FilterModel();

pointsModel.points = points;

const pageMainElement = document.querySelector('.page-body');
const tripControlsNavigationElement = document.querySelector('.trip-controls__navigation');
const tripControlsFiltersElement = document.querySelector('.trip-controls__filters');

const siteMenuComponent = new TripTabsView();
render(tripControlsNavigationElement, siteMenuComponent, RenderPosition.BEFOREEND);

const tripPresenter = new TripPresenter(pageMainElement, pointsModel, filterModel);
const filterPresenter = new FilterPresenter(tripControlsFiltersElement, filterModel, pointsModel);

let mode = 'TABLE';
let statisticsComponent = null;

const handlePointNewFormClose = () => {
  siteMenuComponent.element.querySelector(`[data-menu-item=${MenuItem.TABLE}]`).classList.remove('visually-hidden');
  siteMenuComponent.element.querySelector(`[data-menu-item=${MenuItem.STATS}]`).classList.remove('visually-hidden');
};

const handleSiteMenuClick = (menuItem) => {
  switch (menuItem) {
    case MenuItem.TABLE:
      if (mode !== 'TABLE') {
        filterPresenter.init();
        tripPresenter.init().finally(() => {
          remove(statisticsComponent);
          mode = 'TABLE';
        });
      }
      break;
    case MenuItem.STATS:
      if (mode !== 'STATS') {
        filterPresenter.destroy();
        tripPresenter.destroy();
        statisticsComponent = new StatsView(pointsModel.points);
        render(pageMainElement, statisticsComponent, RenderPosition.BEFOREEND);
        mode = 'STATS';
      }
      break;
  }
};

siteMenuComponent.setMenuClickHandler(handleSiteMenuClick);
filterPresenter.init();
tripPresenter.init();


document.querySelector('.trip-main__event-add-btn').addEventListener('click', (evt) => {
  evt.preventDefault();
  remove(statisticsComponent);
  filterPresenter.destroy();
  filterPresenter.init();
  tripPresenter.destroy();
  tripPresenter.init();
  tripPresenter.createPoint(handlePointNewFormClose);
  siteMenuComponent.element.querySelector(`[data-menu-item=${MenuItem.TABLE}]`).classList.add('visually-hidden');
  siteMenuComponent.element.querySelector(`[data-menu-item=${MenuItem.STATS}]`).classList.add('visually-hidden');
  mode = 'TABLE';
});
