import TripSortView from '../view/trip-sort-view.js';
import PointListView from '../view/points-list-view.js';
import PointPresenter from './point-presenter.js';
import PointNewPresenter from './point-new-presenter.js';
import {render, RenderPosition, remove} from '../utils/render.js';
import {sortTaskByDay, sortTaskByDuration, sortTaskByPrice} from '../utils/point-sort.js';
import {filter} from '../utils/filter';
import {SortType, UpdateType, UserAction, FilterType} from '../utils/const.js';

export default class TripPresenter {
  #mainContainer = null;
  #tableContainer = null;
  #pointsModel = null;
  #filterModel = null;
  #pointListComponent = new PointListView();
  #noPointComponent = null;
  #sortComponent = null;
  #pointPresenter = new Map();
  #pointNewPresenter = null;
  #currentSortType = SortType.SORT_DAY;
  #filterType = FilterType.EVERYTHING;

  constructor(mainContainer, pointsModel, filterModel) {
    this.#mainContainer = mainContainer;
    this.#tableContainer = this.#mainContainer.querySelector('.trip-events');
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;
    this.#pointNewPresenter = new PointNewPresenter(this.#pointListComponent, this.#handleViewAction);
  }

  get points() {
    this.#filterType = this.#filterModel.filter;
    const points = this.#pointsModel.points;
    const filteredPoints = filter[this.#filterType](points);

    switch (this.#currentSortType) {
      case SortType.SORT_DAY:
        return filteredPoints.sort(sortTaskByDay);
      case SortType.SORT_TIME:
        return filteredPoints.sort(sortTaskByDuration);
      case SortType.SORT_PRICE:
        return filteredPoints.sort(sortTaskByPrice);
    }
    return filteredPoints;
  }

  init = () => {
    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);

    this.#renderTable();
  }

  destroy = () => {
    this.#clearTable( true);

    this.#pointsModel.removeObserver(this.#handleModelEvent);
    this.#filterModel.removeObserver(this.#handleModelEvent);
  }

  createPoint = (callback) => {
    this.#clearTable();
    this.#renderTable();

    this.#pointNewPresenter.init(callback);
  }

  #handleModeChange = () => {
    this.#pointNewPresenter.destroy();
    this.#pointPresenter.forEach((presenter) => presenter.resetView());
  }

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointsModel.updatePoint(updateType, update);
        break;
      case UserAction.ADD_POINT:
        this.#pointsModel.addPoint(updateType, update);
        break;
      case UserAction.DELETE_POINT:
        this.#pointsModel.deletePoint(updateType, update);
        break;
    }
  }

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenter.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearTable();
        this.#renderTable();
        break;
      case UpdateType.MAJOR:
        this.#clearTable( true);
        this.#renderTable();
        break;
    }
  }

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearTable();
    this.#renderTable();
  }

  #renderSort = () => {
    this.#sortComponent = new TripSortView(this.#currentSortType);
    this.#sortComponent.setSortTypeChangeHandler(this.#handleSortTypeChange);

    render(this.#tableContainer, this.#sortComponent, RenderPosition.AFTERBEGIN);
  }

  #renderPoint = (point) => {
    const pointPresenter = new PointPresenter(this.#pointListComponent, this.#handleViewAction, this.#handleModeChange);
    pointPresenter.init(point);
    this.#pointPresenter.set(point.id, pointPresenter);
  };

  #renderPoints = (points) => {
    points.forEach((point) => this.#renderPoint(point));
  }


  #clearTable = (resetSortType = false) => {
    this.#pointNewPresenter.destroy();
    this.#pointPresenter.forEach((presenter) => presenter.destroy());
    this.#pointPresenter.clear();

    remove(this.#sortComponent);
    remove(this.#pointListComponent);
    if (this.#noPointComponent) {
      remove(this.#noPointComponent);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.SORT_DAY;
    }
  }

  #renderTable = () => {
    render(this.#tableContainer, this.#pointListComponent, RenderPosition.BEFOREEND);
    const points = this.points;
    const pointCount = points.length;


    this.#renderSort();
    this.#renderPoints(points);
  }
}
