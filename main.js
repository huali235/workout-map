"use strict";

const form = document.querySelector(".form");
const inputType = document.querySelector(".form-input-type");
const inputDistance = document.querySelector(".form-input--distance");
const inputDuration = document.querySelector(".form-input--duration");
const inputCadence = document.querySelector(".form-input--cadence");
const inputElevation = document.querySelector(".form-input--elevation");

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    // Get user position
    this._getPosition();

    // Event Listeners
    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);
  }
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not access your location");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove("hidden");
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form-row").classList.toggle("form-row--hidden");
    inputCadence.closest(".form-row").classList.toggle("form-row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInput = (...input) => input.every((inp) => Number.isFinite(inp));

    const isPositive = (...input) => input.every((inp) => inp > 0);

    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === "running") {
      const cadence = +inputCadence.value;

      if (
        !validInput(duration, distance, cadence) ||
        !isPositive(duration, distance, cadence)
      )
        return alert("Please enter a valid number");

      workout = new Running(distance, duration, [lat, lng], cadence);
    }
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInput(duration, distance, elevation) ||
        !isPositive(duration, distance)
      )
        return alert("Please enter a valid number");

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    this._renderWorkout(workout);
    this._renderMarker(workout);
    this.#workouts.push(workout);
    console.log(this.#workouts);
    this._hideForm();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id=${workout.id}>
        <h2 class="workout-title">${workout.description}</h2>
        <div class="workout-details">
          <span class="workout-icon">${
            workout.type == "running" ? "🏃‍♂️" : "🚴‍♂️"
          }</span>
          <span class="workout-value">${workout.distance}</span>
          <span class="workout-unit">mi</span>
        </div>
        <div class="workout-details">
          <span class="workout-icon">⏱</span>
          <span class="workout-value">${workout.duration}</span>
          <span class="workout-unit">min</span>
        </div>`;

    if (workout.type == "running") {
      html += `
        <div class="workout-details">
          <span class="workout-icon">⚡️</span>
          <span class="workout-value">${workout.pace.toFixed(1)}</span>
          <span class="workout-unit">min/mi</span>
        </div>
        <div class="workout-details">
          <span class="workout-icon">🦶🏼</span>
          <span class="workout-value">${workout.cadence}</span>
          <span class="workout-unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type == "cycling") {
      html += `
        <div class="workout-details">
          <span class="workout-icon">⚡️</span>
          <span class="workout-value">${workout.speed.toFixed(1)}</span>
          <span class="workout-unit">mi/h</span>
        </div>
        <div class="workout-details">
          <span class="workout-icon">⛰</span>
          <span class="workout-value">${workout.elevation}</span>
          <span class="workout-unit">m</span>
        </div>
      </li>
      `;
    }

    form.insertAdjacentHTML("afterend", html);
  }

  _renderMarker(workout) {
    let marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      ).setPopupContent(`
          <div class = "popup-container">
          <h2 class = "popup-title">${workout.description}</h2>
          <ul class = "workout-details-list">
          <li class = "popup-workout">${
            workout.type == "running" ? "🏃‍♂️" : "🚴‍♂️"
          } ${workout.distance} mi</li>
          <li class = "popup-workout">⏱ ${workout.duration} min</li>
          <li class = "popup-workout">⚡️ ${
            workout.type == "running"
              ? workout.pace.toFixed(1) + " min/mi"
              : workout.speed.toFixed(1) + " mi/h"
          }</li>
          <li class = "popup-workout">${
            workout.type == "running"
              ? "🦶🏼 " + workout.cadence + " spm"
              : "⛰ " + workout.elevation + " m"
          }</li>
          </ul>
          </div>
        `);
    // .setPopupContent(
    //   `${workout.type == "running" ? "🏃‍♂️" : "🚴‍♂️"} ${workout.description}`
    // );
  }
}

class Workout {
  date = new Date();
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this._calcPace();
    this._setDescription();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this._calcSpeed();
    this._setDescription();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const app = new App();
