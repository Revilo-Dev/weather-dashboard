import { useState, useEffect } from 'react';
import './App.css';
import { Search } from 'lucide-react';

function App() {
  const [city, setCity] = useState('London');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(false);
  const [time, setTime] = useState('');

  const id = '7ecc0bbc5c63437f6168a57409c931b3';
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?units=metric&appid=${id}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=${id}`;

  useEffect(() => {
    const lastSearchedCity = localStorage.getItem('lastSearchedCity');
    if (lastSearchedCity) {
      setCity(lastSearchedCity);
    }

  }, []);

  useEffect(() => {
    if (city) {
      searchWeatherData(city);
      searchForecastData(city);
    }
  }, [city]);

  useEffect(() => {
    let timeUpdateInterval;
    if (weatherData && weatherData.timezone) {
      timeUpdateInterval = setInterval(() => {
        updateCurrentTime(weatherData.timezone);
      }, 1000);
    }
    return () => clearInterval(timeUpdateInterval);
  }, [weatherData]);

  const updateCurrentTime = (timezoneOffsetSeconds) => {
    const now = new Date();
    const utcMilliseconds = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    const targetMilliseconds = utcMilliseconds + timezoneOffsetSeconds * 1000;
    const targetDate = new Date(targetMilliseconds);
    let hours = targetDate.getHours();
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    setTime(`${hours}:${minutes} ${ampm}`);
  };

  const searchWeatherData = (cityValue) => {
    fetch(`${currentWeatherUrl}&q=${cityValue}`)
      .then(response => response.json())
      .then(data => {
        if (data.cod == 200) {
          setWeatherData(data);
          setError(false);
          animateBackground(data);
        } else {
          setError(true);
          setWeatherData(null);
          animateBackground(null);
        }
      })
      .catch(error => {
        console.error("Error fetching current weather data:", error);
        setError(true);
        setWeatherData(null);
        animateBackground(null);
      });
  };

  const searchForecastData = (cityValue) => {
    fetch(`${forecastUrl}&q=${cityValue}`)
      .then(response => response.json())
      .then(data => {
        if (data.cod == '200' && data.list) {
          setForecastData(data.list.slice(0, 8));
        } else {
          setForecastData(null);
        }
      })
      .catch(error => {
        console.error("Error fetching forecast data:", error);
        setForecastData(null);
      });
  };

  const animateBackground = (data) => {
    if (!data) {
      document.body.style.backgroundImage = 'linear-gradient(var(--rain))';
      return;
    }
    const weatherMain = data.weather[0].main.toLowerCase();
    const sunriseTimestampUTC = data.sys.sunrise * 1000;
    const sunsetTimestampUTC = data.sys.sunset * 1000;
    const currentTimeUTC = Date.now();
    const timezoneOffsetMilliseconds = data.timezone * 1000;

    const nowLocal = new Date(currentTimeUTC + timezoneOffsetMilliseconds);
    const sunriseLocal = new Date(sunriseTimestampUTC + timezoneOffsetMilliseconds);
    const sunsetLocal = new Date(sunsetTimestampUTC + timezoneOffsetMilliseconds);

    let backgroundVariable = '--day'; // Default to day
    const isDaytime = nowLocal >= sunriseLocal && nowLocal < sunsetLocal;

    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
        backgroundVariable = isDaytime ? '--rain' : '--night-rain';
    } else if (weatherMain.includes('thunderstorm')) {
        backgroundVariable = isDaytime ? '--storm' : '--night-storm';
    } else if (weatherMain.includes('clouds')) {
        backgroundVariable = isDaytime ? '--cloudy' : '--night-clouds';
    } else if (weatherMain.includes('clear')) {
        const sunriseStart = new Date(sunriseLocal);
        const sunriseEnd = new Date(sunriseLocal.getTime() + 30 * 60 * 1000);
        const sunsetStart = new Date(sunsetLocal.getTime() - 30 * 60 * 1000);
        const sunsetEnd = new Date(sunsetLocal);

        if (nowLocal >= sunriseStart && nowLocal < sunriseEnd) {
            backgroundVariable = '--rise';
        } else if (nowLocal >= sunsetStart && nowLocal < sunsetEnd) {
            backgroundVariable = '--set';
        } else {
            backgroundVariable = isDaytime ? '--day' : '--night';
        }
    } else if (weatherMain.includes('mist') || weatherMain.includes('fog') || weatherMain.includes('haze')) {
        backgroundVariable = isDaytime ? '--fog' : '--night-fog';
    } else if (nowLocal >= sunriseLocal && nowLocal < sunriseLocal + (30 * 60 * 1000)) {
        backgroundVariable = '--rise';
    } else if (nowLocal >= sunsetLocal - (30 * 60 * 1000) && nowLocal < sunsetLocal) {
        backgroundVariable = '--set';
    } else {
        backgroundVariable = isDaytime ? '--day' : '--night';
    }

    document.body.style.backgroundImage = `linear-gradient(var(${backgroundVariable}))`;
    document.body.style.transition = 'background-image 1.5s ease-in-out';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const value = e.target.elements.name.value.trim();
    if (value) {
      setCity(value);
      localStorage.setItem('lastSearchedCity', value);
    }
  };

  return (
    <div className={`weather-app ${error ? 'error' : ''}`}>
      <main>
        <nav className='fixed flex justify-between items-center'>

        <div className=' flex justify-center items-center '>
        <form className='flex justify-center items-center gap-2' onSubmit={handleSearch}>
          <input className='input' id="name" type="text" placeholder="Search city" />
          <button className='btn' type="submit">
            <Search />
          </button>
        </form>
        </div>

          
        </nav>
        <br />
        <br />
        <div className='flex justify-center items-center gap-2'>

        {weatherData && (
          <div className="">
            <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`} alt="Weather Icon" />
            <span>{Math.round(weatherData.main.temp)}</span>°C
          </div>
        )}
        {weatherData && (
          <div className="gap-20 flex justify-start">
            <figcaption>{weatherData.name}</figcaption>
            <div id="time">{time}</div>
          </div>
        )}
        </div>

        <div className="description">{weatherData ? weatherData.weather[0].description : ''}</div>
        <div className="grid grid-cols-3 gap-4">
          <div className='info-chip'><label>Feels like</label><span id="feels-like">{weatherData ? Math.round(weatherData.main.feels_like) : 0}</span>°C</div>
          <div className='info-chip'><label>Min temp</label><span id="min-temp">{weatherData ? Math.round(weatherData.main.temp_min) : 0}</span>°C</div>
          <div className='info-chip'><label>Max temp</label><span id="max-temp">{weatherData ? Math.round(weatherData.main.temp_max) : 0}</span>°C</div>
          <div className='info-chip'><label>Clouds</label><span id="clouds">{weatherData ? weatherData.clouds.all : 0}</span>%</div>
          <div className='info-chip'><label>Humidity</label><span id="humidity">{weatherData ? weatherData.main.humidity : 0}</span>%</div>
          <div className='info-chip'><label>Pressure</label><span id="pressure">{weatherData ? weatherData.main.pressure : 0}</span>hPa</div>
        </div>
        <div id="forecast">
          {forecastData && forecastData.map((item, index) => (
            <div className="hourly-item" key={index}>
              <span className="hourly-time">{new Date(item.dt * 1000).getHours()}:00</span>
              <img className="hourly-icon" src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`} alt="Hourly Weather Icon" />
              <span className="hourly-temp">{Math.round(item.main.temp)}°C</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
