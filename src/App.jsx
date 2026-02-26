import { useState, useEffect } from 'react';
import './App.css';
import { Search, Building2, Clock } from 'lucide-react';

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
      <main className='bg-base-300 w-screen h-screen fixed right-0 top-0 md:p-30 p-10'>
        <nav className='fixed flex justify-center items-center w-full bg-primary p-4 top-0 right-0 shadow-2xl'>
        {weatherData && (
          <div className=" flex gap-1 fixed left-10 font-bold">
            <Building2 />
            <figcaption>{weatherData.name}</figcaption>
          </div>
        )}
        <div className=' flex justify-center items-center '>
        <form className='flex justify-center items-center gap-2' onSubmit={handleSearch}>
          <input className='input-primary border-2 p-1 rounded-xl border-text w-70' id="name" type="text" placeholder="Search city" />
          <button className='btn-dash rounded-lg' type="submit">
            <Search />
          </button>
        </form>
        </div>
        {weatherData && (
          <div className="flex gap-1 fixed right-10 font-bold">
            <div id="time">{time}</div>
            <Clock />
          </div>
        )} 
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


        </div>

        <div className="description">{weatherData ? weatherData.weather[0].description : ''}</div>
        <div className="grid grid-cols-3 gap-4">
          <div className='info-chip bg-base-100'><p>Feels like</p><span id="feels-like">{weatherData ? Math.round(weatherData.main.feels_like) : 0}</span>°C</div>
          <div className='info-chip bg-base-100'><p>Min temp</p><span id="min-temp">{weatherData ? Math.round(weatherData.main.temp_min) : 0}</span>°C</div>
          <div className='info-chip bg-base-100'><p>Max temp</p><span id="max-temp">{weatherData ? Math.round(weatherData.main.temp_max) : 0}</span>°C</div>
          <div className='info-chip bg-base-100'><p>Clouds</p><span id="clouds">{weatherData ? weatherData.clouds.all : 0}</span>%</div>
          <div className='info-chip bg-base-100'><p>Humidity</p><span id="humidity">{weatherData ? weatherData.main.humidity : 0}</span>%</div>
          <div className='info-chip bg-base-100'><p>Pressure</p><span id="pressure">{weatherData ? weatherData.main.pressure : 0}</span>hPa</div>
        </div>
        <br />
        <div id="forecast" className='flex justify-center items-center gap-2 bg-base-100 rounded-lg p-5'>
          {forecastData && forecastData.map((item, index) => (
            <div className="hourly-item bg-primary md:w-15 rounded-lg" key={index}>
              <span className="hourly-time font-bold">{new Date(item.dt * 1000).getHours()}:00</span>
              <img className="hourly-icon justify-center" src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`} alt="Hourly Weather Icon" />
              <span className="hourly-temp">{Math.round(item.main.temp)}°C</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
