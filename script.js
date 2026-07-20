// ── CONFIG ──
const API_KEY = '85c1a27301729f7c84084832f091acda';
const BASE = 'https://api.openweathermap.org/data/2.5';

// ── TEMPERATURE UNIT STATE ──
let tempUnit = localStorage.getItem('tempUnit') || 'C';
let currentWeatherData = null;

// ── FAVORITES STATE ──
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// ── RECENT SEARCHES STATE ──
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// ── DOM REFS ──
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const celsiusBtn = document.getElementById('celsiusBtn');
const fahrenheitBtn = document.getElementById('fahrenheitBtn');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('errorBox');
const errorMsg = document.getElementById('errorMsg');
const weatherCard = document.getElementById('weatherCard');
const forecastWrap = document.getElementById('forecastWrap');
const defaultState = document.getElementById('defaultState');
const bgLayer = document.getElementById('bgLayer');
const currentTimeEl = document.getElementById('currentTime');
const tempUnit_el = document.getElementById('tempUnit');
const favoritesSection = document.getElementById('favoritesSection');
const favoritesGrid = document.getElementById('favoritesGrid');
const recentSection = document.getElementById('recentSection');
const recentGrid = document.getElementById('recentGrid');
const clearRecentBtn = document.getElementById('clearRecentBtn');
const hourlyWrap = document.getElementById('hourlyWrap');
const hourlyScroll = document.getElementById('hourlyScroll');

// ── CLOCK ──
function updateClock() {
  const now = new Date();
  currentTimeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

// ── TEMPERATURE UNIT FUNCTIONS ──
function celsiusToFahrenheit(celsius) {
  return (celsius * 9/5) + 32;
}

function fahrenheitToCelsius(fahrenheit) {
  return (fahrenheit - 32) * 5/9;
}

function convertTemp(temp, targetUnit) {
  if (targetUnit === 'F') {
    return Math.round(celsiusToFahrenheit(temp));
  }
  return Math.round(temp);
}

function setTempUnit(unit) {
  tempUnit = unit;
  localStorage.setItem('tempUnit', unit);
  
  // Update button states
  celsiusBtn.classList.toggle('active', unit === 'C');
  fahrenheitBtn.classList.toggle('active', unit === 'F');
  
  // Update temperature unit display
  tempUnit_el.textContent = unit === 'C' ? '°C' : '°F';
  
  // Re-render current weather if it exists
  if (currentWeatherData) {
    displayWeatherWithUnit(currentWeatherData);
  }
}

function displayWeatherWithUnit(d) {
  const offset = d.timezone;
  
  // Temp
  document.getElementById('tempMain').textContent = convertTemp(d.main.temp, tempUnit);
  document.getElementById('feelsLike').textContent = `${convertTemp(d.main.feels_like, tempUnit)}°${tempUnit}`;
  
  // Wind speed stays in km/h
  document.getElementById('windSpeed').textContent = `${(d.wind.speed * 3.6).toFixed(1)} km/h`;
  
  // Update forecast if visible
  const forecastCards = document.querySelectorAll('.forecast-card');
  if (forecastCards.length > 0 && currentWeatherData && currentWeatherData.forecastData) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    renderForecastWithData(currentWeatherData.forecastData, offset);
  }
  
  // Update hourly forecast if visible
  const hourlyCards = document.querySelectorAll('.hourly-card');
  if (hourlyCards.length > 0 && currentWeatherData && currentWeatherData.forecastData) {
    renderHourlyForecast(currentWeatherData.forecastData, offset);
  }
}

// ── INITIALIZE TEMP UNIT ──
setTempUnit(tempUnit);

// ── FAVORITES FUNCTIONS ──
function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function addFavorite(city, country) {
  if (!favorites.find(fav => fav.city.toLowerCase() === city.toLowerCase())) {
    favorites.push({ city, country });
    saveFavorites();
    updateFavoriteButton();
    displayFavorites();
  }
}

function removeFavorite(city) {
  favorites = favorites.filter(fav => fav.city.toLowerCase() !== city.toLowerCase());
  saveFavorites();
  updateFavoriteButton();
  displayFavorites();
}

function updateFavoriteButton() {
  if (currentWeatherData) {
    const isFavorite = favorites.find(fav => fav.city.toLowerCase() === currentWeatherData.name.toLowerCase());
    favoriteBtn.classList.toggle('active', !!isFavorite);
  } else {
    favoriteBtn.classList.remove('active');
  }
}

function displayFavorites() {
  if (favorites.length === 0) {
    favoritesSection.classList.add('hidden');
    return;
  }
  
  favoritesGrid.innerHTML = '';
  favorites.forEach(fav => {
    const card = document.createElement('div');
    card.className = 'favorite-card';
    card.innerHTML = `
      <p class="favorite-city-name">${fav.city}</p>
      <p class="favorite-city-country">${fav.country}</p>
      <button class="favorite-remove" title="Remove from favorites">✕</button>
    `;
    
    card.querySelector('.favorite-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(fav.city);
    });
    
    card.addEventListener('click', () => {
      fetchWeather(fav.city);
    });
    
    favoritesGrid.appendChild(card);
  });
  
  favoritesSection.classList.remove('hidden');
}

// Display favorites on load
displayFavorites();

// ── RECENT SEARCHES FUNCTIONS ──
function saveRecentSearches() {
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

function addToRecentSearches(city, country) {
  // Remove if already exists
  recentSearches = recentSearches.filter(s => s.city.toLowerCase() !== city.toLowerCase());
  
  // Add to the beginning
  recentSearches.unshift({ city, country });
  
  // Keep only last 10 searches
  if (recentSearches.length > 10) {
    recentSearches = recentSearches.slice(0, 10);
  }
  
  saveRecentSearches();
  displayRecentSearches();
}

function clearRecentSearches() {
  recentSearches = [];
  saveRecentSearches();
  displayRecentSearches();
}

function displayRecentSearches() {
  if (recentSearches.length === 0) {
    recentSection.classList.add('hidden');
    return;
  }
  
  recentGrid.innerHTML = '';
  recentSearches.forEach(search => {
    const card = document.createElement('div');
    card.className = 'recent-card';
    card.innerHTML = `${search.city}`;
    
    card.addEventListener('click', () => {
      fetchWeather(search.city);
    });
    
    recentGrid.appendChild(card);
  });
  
  recentSection.classList.remove('hidden');
}

// Display recent searches on load
displayRecentSearches();

// ── WEATHER CONDITIONS → BG GRADIENT MAP ──
function getBgGradient(weatherId, isNight) {
  if (isNight) return 'radial-gradient(ellipse at top, rgba(30,10,60,0.6) 0%, rgba(10,10,15,0.9) 100%)';
  if (weatherId >= 200 && weatherId < 300) return 'radial-gradient(ellipse at top, rgba(40,40,80,0.5) 0%, rgba(10,10,15,0.9) 100%)'; // thunderstorm
  if (weatherId >= 300 && weatherId < 600) return 'radial-gradient(ellipse at top, rgba(30,60,100,0.5) 0%, rgba(10,10,15,0.9) 100%)'; // rain/drizzle
  if (weatherId >= 600 && weatherId < 700) return 'radial-gradient(ellipse at top, rgba(180,200,220,0.15) 0%, rgba(10,10,15,0.9) 100%)'; // snow
  if (weatherId >= 700 && weatherId < 800) return 'radial-gradient(ellipse at top, rgba(100,80,60,0.3) 0%, rgba(10,10,15,0.9) 100%)'; // mist/fog
  if (weatherId === 800) return 'radial-gradient(ellipse at top, rgba(80,50,180,0.4) 0%, rgba(10,10,15,0.9) 100%)'; // clear
  if (weatherId > 800) return 'radial-gradient(ellipse at top, rgba(50,60,100,0.4) 0%, rgba(10,10,15,0.9) 100%)'; // cloudy
  return 'radial-gradient(ellipse at top, rgba(50,30,100,0.4) 0%, rgba(10,10,15,0.9) 100%)';
}

// ── FORMAT TIME ──
function formatTime(unix, offset) {
  const d = new Date((unix + offset) * 1000);
  return d.toUTCString().slice(17, 22);
}

function formatDate(unix, offset) {
  const d = new Date((unix + offset) * 1000);
  return d.toUTCString().slice(0, 16);
}

function getDayName(unix, offset) {
  const d = new Date((unix + offset) * 1000);
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
}

// ── SHOW / HIDE HELPERS ──
function showLoading() {
  loading.classList.remove('hidden');
  weatherCard.classList.add('hidden');
  forecastWrap.classList.add('hidden');
  errorBox.classList.add('hidden');
  defaultState.classList.add('hidden');
}

function showError(msg) {
  loading.classList.add('hidden');
  errorBox.classList.remove('hidden');
  errorMsg.textContent = msg;
  defaultState.classList.remove('hidden');
}

function showWeather() {
  loading.classList.add('hidden');
  errorBox.classList.add('hidden');
  weatherCard.classList.remove('hidden');
  forecastWrap.classList.remove('hidden');
  defaultState.classList.add('hidden');

  // re-trigger animation
  weatherCard.style.animation = 'none';
  weatherCard.offsetHeight;
  weatherCard.style.animation = '';
}

// ── FETCH CURRENT WEATHER ──
async function fetchWeather(city) {
  showLoading();

  try {
    const res = await fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);

    if (!res.ok) {
      if (res.status === 404) throw new Error('City not found. Check the spelling and try again.');
      if (res.status === 401) throw new Error('Invalid API key.');
      throw new Error('Something went wrong. Try again in a moment.');
    }

    const data = await res.json();
    renderWeather(data);
    fetchForecast(city, data.timezone);

  } catch (err) {
    showError(err.message);
  }
}

// ── RENDER CURRENT WEATHER ──
function renderWeather(d) {
  currentWeatherData = d;
  const offset = d.timezone;
  const isNight = d.dt > d.sys.sunset || d.dt < d.sys.sunrise;
  const weatherId = d.weather[0].id;

  // BG
  bgLayer.style.background = getBgGradient(weatherId, isNight);

  // Location
  document.getElementById('cityName').textContent = d.name;
  document.getElementById('countryName').textContent = `${d.sys.country} · ${d.coord.lat.toFixed(2)}°N, ${d.coord.lon.toFixed(2)}°E`;
  document.getElementById('dateLine').textContent = formatDate(d.dt, offset);

  // Condition badge
  document.getElementById('conditionBadge').textContent = d.weather[0].main;

  // Temp with unit conversion
  displayWeatherWithUnit(d);
  document.getElementById('conditionText').textContent = d.weather[0].description;

  // Icon
  const icon = document.getElementById('weatherIcon');
  icon.src = `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`;
  icon.alt = d.weather[0].description;

  // Stats
  document.getElementById('humidity').textContent = `${d.main.humidity}%`;
  document.getElementById('visibility').textContent = `${(d.visibility / 1000).toFixed(1)} km`;
  document.getElementById('pressure').textContent = `${d.main.pressure} hPa`;
  document.getElementById('clouds').textContent = `${d.clouds.all}%`;

  // Sunrise / Sunset
  document.getElementById('sunrise').textContent = formatTime(d.sys.sunrise, offset);
  document.getElementById('sunset').textContent = formatTime(d.sys.sunset, offset);

  // Update favorite button state
  updateFavoriteButton();
  
  // Add to recent searches
  addToRecentSearches(d.name, d.sys.country);

  showWeather();
}

// ── FETCH 5-DAY FORECAST ──
async function fetchForecast(city, timezoneOffset) {
  try {
    const res = await fetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!res.ok) return;
    const data = await res.json();
    renderForecast(data.list, timezoneOffset);
  } catch (err) {
    // forecast failing silently is fine
    console.warn('Forecast fetch failed:', err.message);
  }
}

// ── RENDER FORECAST ──
function renderForecast(list, offset) {
  // Store forecast data for unit conversion
  if (currentWeatherData) {
    currentWeatherData.forecastData = list;
  }
  renderForecastWithData(list, offset);
  renderHourlyForecast(list, offset);
}

function renderForecastWithData(list, offset) {
  const forecastGrid = document.getElementById('forecastGrid');
  forecastGrid.innerHTML = '';

  // Get one reading per day (noon-ish), skip today
  const dailyMap = {};
  list.forEach(item => {
    const day = getDayName(item.dt, offset);
    const hour = new Date((item.dt + offset) * 1000).getUTCHours();
    if (!dailyMap[day] || Math.abs(hour - 12) < Math.abs(new Date((dailyMap[day].dt + offset) * 1000).getUTCHours() - 12)) {
      dailyMap[day] = item;
    }
  });

  const days = Object.keys(dailyMap).slice(0, 5);

  days.forEach(day => {
    const item = dailyMap[day];
    const card = document.createElement('div');
    card.className = 'forecast-card';
    
    const highTemp = convertTemp(item.main.temp_max, tempUnit);
    const lowTemp = convertTemp(item.main.temp_min, tempUnit);
    
    card.innerHTML = `
      <p class="forecast-day">${day}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}"/>
      <p class="forecast-temp-high">${highTemp}°</p>
      <p class="forecast-temp-low">${lowTemp}°</p>
    `;
    forecastGrid.appendChild(card);
  });

  forecastWrap.classList.remove('hidden');
}

// ── RENDER HOURLY FORECAST ──
function renderHourlyForecast(list, offset) {
  hourlyScroll.innerHTML = '';
  
  // Get next 24 hours, limit to 25 items
  const now = Math.floor(Date.now() / 1000);
  const next24Hours = list.filter(item => item.dt >= now).slice(0, 25);
  
  if (next24Hours.length === 0) {
    hourlyWrap.classList.add('hidden');
    return;
  }
  
  next24Hours.forEach(item => {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    
    const d = new Date((item.dt + offset) * 1000);
    const time = d.toUTCString().slice(17, 22);
    const temp = convertTemp(item.main.temp, tempUnit);
    const rainChance = item.pop ? Math.round(item.pop * 100) : 0;
    
    card.innerHTML = `
      <p class="hourly-time">${time}</p>
      <img class="hourly-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}"/>
      <p class="hourly-temp">${temp}°</p>
      ${rainChance > 0 ? `<p class="hourly-rain">${rainChance}% rain</p>` : ''}
    `;
    
    hourlyScroll.appendChild(card);
  });
  
  hourlyWrap.classList.remove('hidden');
}

// ── FETCH WEATHER BY COORDINATES ──
async function fetchWeatherByCoords(lat, lon) {
  showLoading();
  
  try {
    const res = await fetch(`${BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    
    if (!res.ok) {
      throw new Error('Unable to fetch weather for this location.');
    }
    
    const data = await res.json();
    renderWeather(data);
    fetchForecast(data.name, data.timezone);
    
  } catch (err) {
    showError(err.message);
  }
}

// ── GEOLOCATION HANDLER ──
function useMyLocation() {
  locationBtn.classList.add('loading');
  locationBtn.disabled = true;
  
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    locationBtn.classList.remove('loading');
    locationBtn.disabled = false;
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
      locationBtn.classList.remove('loading');
      locationBtn.disabled = false;
    },
    (error) => {
      let message = 'Unable to access your location.';
      if (error.code === error.PERMISSION_DENIED) {
        message = 'Location permission denied. Please enable location access in your browser settings.';
      }
      showError(message);
      locationBtn.classList.remove('loading');
      locationBtn.disabled = false;
    },
    { timeout: 10000 }
  );
}

locationBtn.addEventListener('click', useMyLocation);
function triggerSearch() {
  const city = searchInput.value.trim();
  if (!city) return;
  fetchWeather(city);
}

searchBtn.addEventListener('click', triggerSearch);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') triggerSearch();
});

// ── QUICK CITY BUTTONS ──
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    searchInput.value = btn.dataset.city;
    fetchWeather(btn.dataset.city);
  });
});

// ── TEMPERATURE UNIT TOGGLE ──
celsiusBtn.addEventListener('click', () => setTempUnit('C'));
fahrenheitBtn.addEventListener('click', () => setTempUnit('F'));

// ── FAVORITE BUTTON ──
favoriteBtn.addEventListener('click', () => {
  if (!currentWeatherData) return;
  
  const isFavorite = favorites.find(fav => fav.city.toLowerCase() === currentWeatherData.name.toLowerCase());
  
  if (isFavorite) {
    removeFavorite(currentWeatherData.name);
  } else {
    addFavorite(currentWeatherData.name, currentWeatherData.sys.country);
  }
});

// ── CLEAR RECENT SEARCHES ──
clearRecentBtn.addEventListener('click', clearRecentSearches);
