import { takeEvery, call, put, cancel, all } from "redux-saga/effects";
import API from "../api";
import * as actions from "../actions";

/*
  1. The weather service requires us to make a search by lat/lng to find its
  weather ID.
  2. We then use that weather ID to get the weather.

  This process is pretty well defined here with a saga.

  call invokes a method
  put dispatches an action
  takeEvery watches actions and executes a function

  Also -- the `*` in function is important; turns it into a "generator"

*/

const delay = ms => new Promise(res => setTimeout(res, ms));

function* watchWeatherIdReceived(action) {
  const { id } = action;
  const { error, data } = yield call(API.findWeatherbyId, id);
  if (error) {
    yield put({ type: actions.API_ERROR, code: error.code });
    yield cancel();
    return;
  }
  yield put({ type: actions.WEATHER_DATA_RECEIVED, data });
}

function* watchFetchWeather(action) {
  const { latitude, longitude } = action;
  const { error, data } = yield call(
    API.findLocationByLatLng,
    latitude,
    longitude
  );
  if (error) {
    console.log({ error });
    yield put({ type: actions.API_ERROR, code: error.code });
    yield cancel();
    return;
  }
  const location = data[0] ? data[0].woeid : false;
  if (!location) {
    yield put({ type: actions.API_ERROR });
    yield cancel();
    return;
  }
  yield put({ type: actions.WEATHER_ID_RECEIVED, id: location });
}

function* watchFetchDroneData() {
  const { error, data } = yield call(API.findDroneLocation);
  if (error) {
    yield put({ type: actions.API_ERROR, code: error.code });
    yield cancel();
    return;
  }
  yield put({ type: actions.DRONE_DATA_RECEIVED, data });
}

function* watchDroneDataReceived(action) {
  const { latitude, longitude } = action.data.data[0];
  const { error, data } = yield call(
    API.findLocationByLatLng,
    latitude,
    longitude
  );
  if (error) {
    console.log({ error });
    yield put({ type: actions.API_ERROR, code: error.code });
    yield cancel();
    return;
  }
  const location = data[0] ? data[0].woeid : false;
  if (!location) {
    yield put({ type: actions.API_ERROR });
    yield cancel();
    return;
  }
  yield put({ type: actions.WEATHER_ID_RECEIVED, id: location });
}

function* watchWeatherDataReceived() {
  yield delay(3500);
  yield put({ type: actions.FETCH_DRONE_DATA });
}

function* watchAppLoad() {
  yield all([
    takeEvery(actions.FETCH_DRONE_DATA, watchFetchDroneData),
    takeEvery(actions.DRONE_DATA_RECEIVED, watchDroneDataReceived),
    takeEvery(actions.FETCH_WEATHER, watchFetchWeather),
    takeEvery(actions.WEATHER_ID_RECEIVED, watchWeatherIdReceived),
    takeEvery(actions.WEATHER_DATA_RECEIVED, watchWeatherDataReceived)
  ]);
}

export default [watchAppLoad];
