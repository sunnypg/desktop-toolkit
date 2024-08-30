<template>
  <div class="weather">
    <el-card style="height: calc(100vh - 80px)">
      <h3>7日天气</h3>
      <div>所在城市：{{ cityName }}</div>
      <div>
        今日天气： {{ weather?.daily[0]?.textDay }}
        <i :class="['weather-icon', `qi-${weather?.daily[0]?.iconDay}`]"></i>
      </div>
      <div>更新时间：{{ formatUTC(weather?.updateTime) }}</div>
      <div ref="weatherRef" style="width: calc(100vw - 120px); height: calc(100vh - 200px)"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { formatUTC } from '@renderer/utils/dateFormat'
import getWeather from './getWeather'

const weatherRef = ref()
const weather = ref()

let myChart
onMounted(() => {
  myChart = echarts.init(weatherRef.value)
  setEChartOptions()
})

const extractField = (field, array) => {
  return array.map((item) => item[field])
}

const cityName = ref('广州')

const setEChartOptions = async () => {
  weather.value = await getWeather(cityName.value)
  //日期
  const dayOp = extractField('fxDate', weather.value.daily).map((item) => {
    const date = item.split('-')
    date.shift()
    return date.join('-')
  })
  const tempMaxOp = extractField('tempMax', weather.value.daily) //最高温度
  const tempMinOp = extractField('tempMin', weather.value.daily) //最低温度
  const textDayOp = extractField('textDay', weather.value.daily) //白天天气
  const textNightOp = extractField('textNight', weather.value.daily) //夜间天气
  const iconDayOp = extractField('iconDay', weather.value.daily) //白天天气图标
  const iconNightOp = extractField('iconNight', weather.value.daily) //夜间天气图标
  const dayWeatherOp = textDayOp.map((textDay, index) => `${textDay}-${iconDayOp[index]}`) //白天天气和图标
  const nightWeatherOp = textNightOp.map((textNight, index) => `${textNight}-${iconNightOp[index]}`) //夜间天气和图标
  const windDirDayOp = extractField('windDirDay', weather.value.daily) //风向
  const windScaleDayOp = extractField('windScaleDay', weather.value.daily) //风力等级

  const option = {
    // 网格
    grid: {
      show: true,
      backgroundColor: 'transparent',
      opacity: 0.3,
      borderWidth: '0',
      top: '40%',
      bottom: '25%',
      left: '5%',
      right: '5%'
    },
    // 提示框
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        lineStyle: {
          color: 'transparent'
        }
      }
    },
    // 图例组件
    legend: {
      show: false
    },
    // x轴
    xAxis: [
      // 日期
      {
        type: 'category',
        boundaryGap: false,
        position: 'top',
        offset: 120, //偏移量，根据高度百分比偏移
        zlevel: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: ['{a|{value}}'].join('\n'),
          rich: {
            a: {
              fontSize: 12
            }
          }
        },
        nameTextStyle: {},
        data: dayOp
      },
      // 白天天气图标
      {
        type: 'category',
        boundaryGap: false,
        position: 'top',
        offset: 30, //偏移量，根据高度百分比偏移
        zlevel: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: function (value, index) {
            return '{' + index + '| }\n{b|' + value.split('-')[0] + '}'
          },
          rich: {
            0: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${dayWeatherOp[0].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            1: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${dayWeatherOp[1].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            2: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${dayWeatherOp[2].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            3: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${dayWeatherOp[3].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            4: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${dayWeatherOp[4].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            5: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${dayWeatherOp[5].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            6: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${dayWeatherOp[6].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            b: {
              fontSize: 12,
              lineHeight: 30,
              height: 20
            }
          }
        },
        nameTextStyle: {
          fontWeight: 'bold',
          fontSize: 19
        },
        data: dayWeatherOp
      },
      // 最高气温
      {
        type: 'category',
        boundaryGap: false,
        position: 'top',
        offset: 0, //偏移量，根据高度百分比偏移
        zlevel: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: ['{a|{value}}℃'].join('\n'),
          rich: {
            a: {
              fontSize: 12
            }
          }
        },
        nameTextStyle: {},
        data: tempMaxOp
      },
      // 最低气温
      {
        type: 'category',
        boundaryGap: false,
        position: 'top',
        offset: -100, //偏移量，根据高度百分比偏移
        zlevel: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: ['{a|{value}}℃'].join('\n'),
          rich: {
            a: {
              fontSize: 12
            }
          }
        },
        nameTextStyle: {},
        data: tempMinOp
      },
      // 夜间天气图标
      {
        type: 'category',
        boundaryGap: false,
        position: 'top',
        offset: -170, //偏移量，根据高度百分比偏移
        zlevel: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: function (value, index) {
            return '{' + index + '| }\n{b|' + value.split('-')[0] + '}'
          },
          rich: {
            0: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${nightWeatherOp[0].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            1: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${nightWeatherOp[1].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            2: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${nightWeatherOp[2].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            3: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${nightWeatherOp[3].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            4: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${nightWeatherOp[4].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            5: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${nightWeatherOp[5].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            6: {
              backgroundColor: {
                image: new URL(
                  `../../../assets/icons/${nightWeatherOp[6].split('-')[1]}.svg`,
                  import.meta.url
                ).pathname
              },
              height: 24,
              width: 24
            },
            b: {
              fontSize: 12,
              lineHeight: 30,
              height: 20
            }
          }
        },
        nameTextStyle: {
          fontWeight: 'bold',
          fontSize: 19
        },
        data: nightWeatherOp
      },
      // 风向
      {
        type: 'category',
        boundaryGap: false,
        position: 'top',
        offset: -200, //偏移量，根据高度百分比偏移
        zlevel: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: ['{a|{value}}'].join('\n'),
          rich: {
            a: {
              fontSize: 12
            }
          }
        },
        nameTextStyle: {},
        data: windDirDayOp
      },
      // 风力
      {
        type: 'category',
        boundaryGap: false,
        position: 'top',
        offset: -240, //偏移量，根据高度百分比偏移
        zlevel: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          interval: 0,
          formatter: ['{a|{value}}级'].join('\n'),
          rich: {
            a: {
              fontSize: 12
            }
          }
        },
        nameTextStyle: {},
        data: windScaleDayOp
      }
    ],
    // y轴
    yAxis: {
      type: 'value',
      show: false,
      axisLabel: {
        formatter: '{value} °C',
        color: 'white'
      }
    },
    // 折线
    series: [
      // 最高气温
      {
        name: '最高气温',
        type: 'line',
        data: tempMaxOp,
        symbol: 'none',
        symbolSize: 1,
        showSymbol: true,
        smooth: true,
        itemStyle: {
          color: '#FFA033'
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c} °C'
        },
        lineStyle: {
          width: 3,
          color: '#FFA033'
        },
        areaStyle: {
          opacity: 1,
          color: 'transparent'
        }
      },
      // 最低气温
      {
        name: '最低气温',
        type: 'line',
        data: tempMinOp,
        symbol: 'none',
        symbolSize: 1,
        showSymbol: true,
        smooth: true,
        itemStyle: {
          color: '#5CADFF'
        },
        label: {
          show: true,
          position: 'bottom',
          formatter: '{c} °C'
        },
        lineStyle: {
          width: 3,
          color: '#5CADFF'
        },
        areaStyle: {
          opacity: 1,
          color: 'transparent'
        }
      }
    ]
  }

  myChart.setOption(option)
}
</script>

<style lang="less" scoped>
.weather-icon {
  font-family: 'qweather-icons';
  font-size: 20px;
}
</style>
