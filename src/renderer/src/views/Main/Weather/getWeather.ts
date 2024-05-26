import axios from 'axios'
import { myLocalStorage } from '@renderer/utils/storage'

const KEY = '8a53f11138844850a3a6d329cbfac984'
async function getLocation(city: string) {
  const { data } = await axios.get(
    `https://geoapi.qweather.com/v2/city/lookup?location=${city}&key=${KEY}`
  )
  return data.location[0]
}

async function fetchWeather(city: string) {
  const location = await getLocation(city)
  const { data } = await axios.get(
    `https://devapi.qweather.com/v7/weather/7d?location=${location.id}&key=${KEY}`
  )
  return data
}

export default async function getWeather(city: string) {
  city = await window.electron.ipcRenderer.invoke('pinyin', city)
  let weather = myLocalStorage.getStorage(city)
  if (
    !weather ||
    new Date(weather.daily[0].fxDate).toLocaleDateString() !== new Date().toLocaleDateString()
  ) {
    weather = await fetchWeather(city)
    myLocalStorage.setStorage(city, weather)
  }
  return weather
}
