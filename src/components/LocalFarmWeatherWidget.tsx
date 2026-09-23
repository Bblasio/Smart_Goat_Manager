import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StatCard } from './StatCard';

interface WeatherData {
  temperatureC: number;
  temperatureF: number;
  condition: string;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmH: number;
  rainProbability: number;
  uvIndex: number;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitudeMeters: number;
  };
  lastUpdated: string;
  goatAdvisory: {
    title: string;
    description: string;
    grazingStatus: 'Optimal' | 'Caution' | 'Shelter Recommended';
    biosecurityNotice: string;
  };
}

interface LocalFarmWeatherWidgetProps {
  customLocation?: string;
  className?: string;
}

export const LocalFarmWeatherWidget: React.FC<LocalFarmWeatherWidgetProps> = ({
  customLocation,
  className = '',
}) => {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Mocked Geolocation Service simulation
  const fetchMockFarmWeather = (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    // Realistic geolocation resolution delay
    setTimeout(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const isNight = currentHour < 6 || currentHour > 19;
      
      // Calculate realistic temperatures based on farm location or time
      const baseTempC = isNight ? 16 : 23;
      const variation = (now.getMinutes() % 4) - 2;
      const finalTempC = baseTempC + variation;
      const finalTempF = Math.round((finalTempC * 9) / 5 + 32);
      const humidityVal = 48 + (now.getMinutes() % 12);

      const mockData: WeatherData = {
        temperatureC: finalTempC,
        temperatureF: finalTempF,
        condition: isNight ? 'Clear Night Sky' : 'Sunny Pasture Conditions',
        feelsLikeC: finalTempC + 1,
        humidity: humidityVal,
        windSpeedKmH: 12,
        rainProbability: 10,
        uvIndex: isNight ? 0 : 5,
        locationName: customLocation?.trim() || 'Rift Valley Pastoral District, Kenya',
        coordinates: {
          latitude: 0.2831,
          longitude: 36.0654,
          altitudeMeters: 1860,
        },
        lastUpdated: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        goatAdvisory: {
          title: 'Optimal Grazing & Rumen Comfort',
          description:
            'Mild temperatures and low moisture create ideal open browsing conditions. Rumen function is optimal; dry pasture foraging is safe with zero parasite splash risk.',
          grazingStatus: 'Optimal',
          biosecurityNotice:
            'Keep lactating does hydrated. Maintain shaded salt blocks near watering stations.',
        },
      };

      setWeatherData(mockData);
      setIsLoading(false);
      setIsRefreshing(false);
    }, 700);
  };

  useEffect(() => {
    fetchMockFarmWeather();
  }, [customLocation]);

  const displayTemp =
    weatherData
      ? unit === 'C'
        ? `${weatherData.temperatureC}°C`
        : `${weatherData.temperatureF}°F`
      : '—';

  const displayFeelsLike =
    weatherData
      ? unit === 'C'
        ? `${weatherData.feelsLikeC}°C`
        : `${Math.round((weatherData.feelsLikeC * 9) / 5 + 32)}°F`
      : '—';

  return (
    <div
      id="local-farm-weather-widget"
      className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs transition-colors ${className}`}
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Micro-Climate & Herd Welfare
              </span>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                GPS Synced
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <span>Local Farm Weather</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit Toggle °C / °F */}
          <div className="inline-flex items-center rounded-xl bg-stone-100 dark:bg-stone-800 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unit === 'C'
                  ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              °C
            </button>
            <button
              type="button"
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                unit === 'F'
                  ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            id="btn-refresh-farm-weather"
            onClick={() => fetchMockFarmWeather(true)}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors disabled:opacity-50"
            title="Refresh weather data from geolocation service"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
            Acquiring farm GPS coordinates & micro-climate sensor data...
          </p>
          <span className="text-[11px] text-stone-400">Mocked Geolocation Service Active</span>
        </div>
      ) : weatherData ? (
        <div className="pt-4 space-y-4">
          {/* Main Weather Display & Coordinates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 via-stone-50 to-emerald-50/30 dark:from-stone-800/40 dark:via-stone-800/20 dark:to-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                <Sun className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="hero-stat-number text-stone-900 dark:text-white"
                    style={{ fontSize: 'var(--text-xl, 28px)' }}
                  >
                    {displayTemp}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    Feels like {displayFeelsLike}
                  </span>
                </div>
                <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  {weatherData.condition}
                </div>
              </div>
            </div>

            {/* Geolocation Tag */}
            <div className="sm:text-right text-xs space-y-1">
              <div className="inline-flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{weatherData.locationName}</span>
              </div>
              <div className="text-[11px] font-mono text-stone-400 dark:text-stone-500 flex sm:justify-end items-center gap-2">
                <span>Lat: {weatherData.coordinates.latitude}° N</span>
                <span>•</span>
                <span>Lon: {weatherData.coordinates.longitude}° E</span>
                <span>•</span>
                <span>Alt: {weatherData.coordinates.altitudeMeters}m</span>
              </div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500">
                Updated {weatherData.lastUpdated}
              </div>
            </div>
          </div>

          {/* Core Caprine Environmental Metrics Grid */}
          <div className="stat-grid">
            <StatCard
              label="Humidity"
              value={`${weatherData.humidity}%`}
              icon={<Droplets className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
              iconBgColor="bg-teal-50 dark:bg-teal-950/50"
              subtext={<span className="text-emerald-600 dark:text-emerald-400 font-medium">Pneumonia risk: Low</span>}
            />

            <StatCard
              label="Wind"
              value={`${weatherData.windSpeedKmH} km/h`}
              icon={<Wind className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
              iconBgColor="bg-sky-50 dark:bg-sky-950/50"
              subtext="Natural ventilation ok"
            />

            <StatCard
              label="Precipitation"
              value={`${weatherData.rainProbability}%`}
              icon={<CloudRain className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              iconBgColor="bg-blue-50 dark:bg-blue-950/50"
              subtext={<span className="text-emerald-600 dark:text-emerald-400 font-medium">Dry fleece foraging</span>}
            />

            <StatCard
              label="Solar / UV"
              value={`Index ${weatherData.uvIndex}`}
              icon={<Thermometer className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              iconBgColor="bg-amber-50 dark:bg-amber-950/50"
              variant="amber"
              subtext={<span className="text-amber-600 dark:text-amber-400 font-medium">Moderate shade needed</span>}
            />
          </div>

          {/* Daily Goat Welfare & Pasture Advisory Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Daily Goat Management Advisory: {weatherData.goatAdvisory.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    {weatherData.goatAdvisory.grazingStatus}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {weatherData.goatAdvisory.description}
                </p>
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 pt-0.5">
                  💡 <strong>Farm Practice:</strong> {weatherData.goatAdvisory.biosecurityNotice}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
