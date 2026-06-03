/***

Thanks to & modified from
1. https://gist.githubusercontent.com/Hyseen/b06e911a41036ebc36acf04ddebe7b9a/raw/nf_check.js
2. https://github.com/AtlantisGawrGura/Quantumult-X-Scripts/blob/main/media.js
3. https://github.com/CoiaPrant/MediaUnlock_Test/blob/main/check.sh
4. https://github.com/Netflixxp/chatGPT/blob/main/chat.sh

For Quantumult-X 598+ ONLY!!

2026-06-03

- 支持 ChatGPT 检测
- 新增 Gemini 检测
- 新增 Claude 检测
- 整理异步流程，避免重复 $done()

**/

const BASE_URL = 'https://www.netflix.com/title/'
const BASE_URL_YTB = 'https://www.youtube.com/premium'
const BASE_URL_DISNEY = 'https://www.disneyplus.com'
const BASE_URL_DAZN = 'https://startup.core.indazn.com/misl/v5/Startup'
const BASE_URL_PARAMOUNT = 'https://www.paramountplus.com/'
const BASE_URL_DISCOVERY_TOKEN = 'https://us1-prod-direct.discoveryplus.com/token?deviceId=d1a4a5d25212400d1e6985984604d740&realm=go&shortlived=true'
const BASE_URL_DISCOVERY = 'https://us1-prod-direct.discoveryplus.com/users/me'
const BASE_URL_GPT = 'https://chat.openai.com/'
const REGION_URL_GPT = 'https://chat.openai.com/cdn-cgi/trace'
const BASE_URL_GEMINI = 'https://gemini.google.com/app'
const BASE_URL_CLAUDE = 'https://claude.ai/login'
const REGION_URL_CLAUDE = 'https://claude.ai/cdn-cgi/trace'
const REGION_URL_CF = 'https://www.cloudflare.com/cdn-cgi/trace'

const FILM_ID = 81280792
const POLICY_NAME = 'Netflix'
const ARROW = ' ➟ '

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'

const STATUS_COMING = 2
const STATUS_AVAILABLE = 1
const STATUS_NOT_AVAILABLE = 0
const STATUS_TIMEOUT = -1
const STATUS_ERROR = -2

const opts = {
  policy: $environment.params,
}

const optsNoRedirect = {
  policy: $environment.params,
  redirection: false,
}

const result = {
  title: '    📺  流媒体服务查询',
  YouTube: '<b>YouTube Premium: </b>检测失败，请重试 ❗️',
  Netflix: '<b>Netflix: </b>检测失败，请重试 ❗️',
  Dazn: '<b>Dazn: </b>检测失败，请重试 ❗️',
  Disney: '<b>Disneyᐩ: </b>检测失败，请重试 ❗️',
  Paramount: '<b>Paramountᐩ: </b>检测失败，请重试 ❗️',
  Discovery: '<b>Discoveryᐩ: </b>检测失败，请重试 ❗️',
  ChatGPT: '<b>ChatGPT: </b>检测失败，请重试 ❗️',
  Gemini: '<b>Gemini: </b>检测失败，请重试 ❗️',
  Claude: '<b>Claude: </b>检测失败，请重试 ❗️',
}

const message = {
  action: 'get_policy_state',
  content: $environment.params,
}

const CHATGPT_SUPPORT_COUNTRY_CODES = [
  'T1', 'XX', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ',
  'BS', 'BD', 'BB', 'BE', 'BZ', 'BJ', 'BT', 'BA', 'BW', 'BR', 'BG', 'BF',
  'CV', 'CA', 'CL', 'CO', 'KM', 'CR', 'HR', 'CY', 'DK', 'DJ', 'DM', 'DO',
  'EC', 'SV', 'EE', 'FJ', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR',
  'GD', 'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN', 'ID', 'IQ',
  'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KW', 'KG', 'LV',
  'LB', 'LS', 'LR', 'LI', 'LT', 'LU', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT',
  'MH', 'MR', 'MU', 'MX', 'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NR',
  'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO', 'OM', 'PK', 'PW', 'PA',
  'PG', 'PE', 'PH', 'PL', 'PT', 'QA', 'RO', 'RW', 'KN', 'LC', 'VC', 'WS',
  'SM', 'ST', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'ZA', 'ES',
  'LK', 'SR', 'SE', 'CH', 'TH', 'TG', 'TO', 'TT', 'TN', 'TR', 'TV', 'UG',
  'AE', 'US', 'UY', 'VU', 'ZM', 'BO', 'BN', 'CG', 'CZ', 'VA', 'FM', 'MD',
  'PS', 'KR', 'TW', 'TZ', 'TL', 'GB',
]

;(async () => {
  try {
    const disneyPromise = testDisneyPlus()

    const tasks = [
      disneyPromise.then(disney => applyDisneyResult(disney)),
      testNetflix(FILM_ID),
      testYouTubePremium(),
      testDazn(),
      testParamount(),
      testDiscovery(),
      testChatGPT(),
      testGemini(),
      testClaude(),
    ]

    await Promise.all(tasks.map(p => p.catch(error => console.log('Task Error: ' + error))))

    const output = await getPolicyOutput()
    $done({ title: result.title, htmlMessage: buildHtmlMessage(output) })
  } catch (error) {
    console.log('Main Error: ' + error)
    $done({ title: result.title, htmlMessage: buildErrorMessage(String(error || '检测异常')) })
  }
})()

function buildHtmlMessage(output) {
  const items = [
    result.Dazn,
    result.Discovery,
    result.Paramount,
    result.Disney,
    result.ChatGPT,
    result.Gemini,
    result.Claude,
    result.Netflix,
    result.YouTube,
  ]

  let content = '--------------------------------------</br>' + items.join('</br></br>')
  content += '</br>--------------------------------------</br>'
  content += '<font color=#CD5C5C><b>节点</b> ➟ ' + output + '</font>'

  return '<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">' + content + '</p>'
}

function buildErrorMessage(errorText) {
  const output = $environment.params || ''
  return '<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">' +
    '----------------------</br></br>' +
    '🚥 ' + errorText +
    '</br></br>----------------------</br>' +
    output +
    '</p>'
}

function getPolicyOutput() {
  return new Promise(resolve => {
    $configuration.sendMessage(message).then(response => {
      if (response && response.error) {
        console.log(response.error)
        resolve($environment.params)
        return
      }

      if (response && response.ret && response.ret[message.content]) {
        const output = JSON.stringify(response.ret[message.content])
          .replace(/\"|\[|\]/g, '')
          .replace(/\,/g, ' ➟ ')
        resolve(output || $environment.params)
        return
      }

      resolve($environment.params)
    }, () => {
      resolve($environment.params)
    })
  })
}

function applyDisneyResult(disney) {
  const region = disney && disney.region ? disney.region : ''
  const status = disney && typeof disney.status !== 'undefined' ? disney.status : STATUS_ERROR

  console.log('testDisneyPlus: region=' + region + ', status=' + status)

  if (status === STATUS_COMING) {
    result.Disney = '<b>Disneyᐩ:</b> 即将登陆' + (region ? ARROW + regionText(region) : '') + ' ⚠️'
  } else if (status === STATUS_AVAILABLE) {
    result.Disney = '<b>Disneyᐩ:</b> 支持' + (region ? ARROW + regionText(region) : '') + ' 🎉'
  } else if (status === STATUS_NOT_AVAILABLE) {
    result.Disney = '<b>Disneyᐩ:</b> 未支持 🚫'
  } else if (status === STATUS_TIMEOUT) {
    result.Disney = '<b>Disneyᐩ:</b> 检测超时 🚦'
  } else {
    result.Disney = '<b>Disneyᐩ:</b> 检测失败 ❗️'
  }
}

function regionText(region) {
  region = String(region || '').toUpperCase()
  const flag = countryCodeToFlag(region)
  return flag ? '⟦' + flag + '⟧' : (region ? '⟦' + region + '⟧' : '')
}

function countryCodeToFlag(region) {
  region = String(region || '').toUpperCase()

  if (region === 'UK') region = 'GB'
  if (!/^[A-Z]{2}$/.test(region)) return ''

  const first = region.charCodeAt(0) - 65 + 0x1F1E6
  const second = region.charCodeAt(1) - 65 + 0x1F1E6

  return String.fromCodePoint(first) + String.fromCodePoint(second)
}

function statusCodeOf(response) {
  return response.statusCode || response.status || 0
}

function timeout(delay = 5000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('Timeout'), delay)
  })
}

function getTraceRegion(traceUrl) {
  return new Promise(resolve => {
    const option = {
      url: traceUrl || REGION_URL_CF,
      opts: optsNoRedirect,
      timeout: 2800,
      headers: {
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(response => {
      const body = response.body || ''
      const match = body.match(/loc=([A-Z]{2})/i)
      resolve(match ? match[1].toUpperCase() : '')
    }, () => {
      resolve('')
    })
  })
}

async function testDisneyPlus() {
  try {
    let { region } = await Promise.race([testDisneyHomePage(), timeout(7000)])
    const { countryCode, inSupportedLocation, accessToken } = await Promise.race([
      getDisneyLocationInfo(),
      timeout(7000),
    ])

    region = countryCode || region

    console.log('Disney region: ' + region + ', inSupportedLocation: ' + inSupportedLocation)

    if (inSupportedLocation === false || inSupportedLocation === 'false') {
      return { region, status: STATUS_COMING }
    }

    if (accessToken) {
      return { region, status: STATUS_AVAILABLE }
    }

    return { region, status: STATUS_AVAILABLE }
  } catch (error) {
    console.log('Disney error: ' + error)

    if (error === 'Not Available') return { status: STATUS_NOT_AVAILABLE }
    if (error === 'Timeout') return { status: STATUS_TIMEOUT }

    return { status: STATUS_ERROR }
  }
}

function testDisneyHomePage() {
  return new Promise((resolve, reject) => {
    const option = {
      url: BASE_URL_DISNEY + '/',
      opts,
      headers: {
        'Accept-Language': 'en',
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(response => {
      const data = response.body || ''
      console.log('DisneyPlus homepage: ' + statusCodeOf(response))

      if (statusCodeOf(response) !== 200 || data.indexOf('not available in your region') !== -1) {
        reject('Not Available')
        return
      }

      const match = data.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/)

      if (!match) {
        resolve({ region: '', cnbl: '' })
        return
      }

      resolve({ region: match[1], cnbl: match[2] })
    }, () => {
      reject('Error')
    })
  })
}

function getDisneyLocationInfo() {
  return new Promise((resolve, reject) => {
    const option = {
      url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
      method: 'POST',
      opts,
      headers: {
        'Accept-Language': 'en',
        Authorization: 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      body: JSON.stringify({
        query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
        variables: {
          input: {
            applicationRuntime: 'chrome',
            attributes: {
              browserName: 'chrome',
              browserVersion: '94.0.4606',
              manufacturer: 'apple',
              model: null,
              operatingSystem: 'macintosh',
              operatingSystemVersion: '10.15.7',
              osDeviceIds: [],
            },
            deviceFamily: 'browser',
            deviceLanguage: 'en',
            deviceProfile: 'macosx',
          },
        },
      }),
    }

    $task.fetch(option).then(response => {
      const data = response.body || ''
      console.log('Disney location info: ' + statusCodeOf(response))

      if (statusCodeOf(response) !== 200) {
        console.log('getDisneyLocationInfo: ' + data)
        reject('Not Available')
        return
      }

      try {
        const sdk = JSON.parse(data).extensions.sdk

        resolve({
          accessToken: sdk.token.accessToken,
          inSupportedLocation: sdk.session.inSupportedLocation,
          countryCode: sdk.session.location.countryCode,
        })
      } catch (error) {
        reject('Error')
      }
    }, () => {
      reject('Error')
    })
  })
}

function testNetflix(filmId) {
  return new Promise(resolve => {
    const option = {
      url: BASE_URL + filmId,
      opts,
      timeout: 5200,
      headers: {
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(response => {
      const code = statusCodeOf(response)

      console.log('Netflix: ' + code)

      if (code === 404) {
        result.Netflix = '<b>Netflix: </b>支持自制剧集 ⚠️'
        resolve('Netflix Original Only')
        return
      }

      if (code === 403) {
        result.Netflix = '<b>Netflix: </b>未支持 🚫'
        resolve('Netflix Not Available')
        return
      }

      if (code === 200) {
        const headers = response.headers || {}
        let url = headers['X-Originating-URL'] || headers['x-originating-url'] || ''
        let region = ''

        if (url.indexOf('/') !== -1) {
          region = url.split('/')[3] || ''
          region = region.split('-')[0]
        }

        if (!region || region === 'title') region = 'US'

        result.Netflix = '<b>Netflix: </b>完整支持' + ARROW + regionText(region) + ' 🎉'
        resolve('Netflix Available')
        return
      }

      result.Netflix = '<b>Netflix: </b>检测失败 ❗️'
      resolve('Netflix Error')
    }, () => {
      result.Netflix = '<b>Netflix: </b>检测超时 🚦'
      resolve('Netflix Timeout')
    })
  })
}

function testYouTubePremium() {
  return new Promise(resolve => {
    const option = {
      url: BASE_URL_YTB,
      opts,
      timeout: 2800,
      headers: {
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(response => {
      const code = statusCodeOf(response)
      const data = response.body || ''

      console.log('YouTube Premium: ' + code)

      if (code !== 200) {
        result.YouTube = '<b>YouTube Premium: </b>检测失败 ❗️'
        resolve('YouTube Error')
        return
      }

      if (data.indexOf('Premium is not available in your country') !== -1) {
        result.YouTube = '<b>YouTube Premium: </b>未支持 🚫'
        resolve('YouTube Not Available')
        return
      }

      let region = ''
      const ret = /"GL":"(.*?)"/gm.exec(data)

      if (ret && ret.length === 2) {
        region = ret[1]
      } else if (data.indexOf('www.google.cn') !== -1) {
        region = 'CN'
      } else {
        region = 'US'
      }

      result.YouTube = '<b>YouTube Premium: </b>支持 ' + ARROW + regionText(region) + ' 🎉'
      resolve('YouTube Available')
    }, () => {
      result.YouTube = '<b>YouTube Premium: </b>检测超时 🚦'
      resolve('YouTube Timeout')
    })
  })
}

function testDazn() {
  return new Promise(resolve => {
    const body = JSON.stringify({
      LandingPageKey: 'generic',
      Platform: 'web',
      PlatformAttributes: {},
      Manufacturer: '',
      PromoCode: '',
      Version: '2',
    })

    const option = {
      url: BASE_URL_DAZN,
      method: 'POST',
      opts,
      timeout: 2800,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
        'Content-Type': 'application/json',
      },
      body,
    }

    $task.fetch(option).then(response => {
      const code = statusCodeOf(response)
      const data = response.body || ''

      console.log('Dazn: ' + code)

      if (code !== 200) {
        result.Dazn = '<b>Dazn: </b>检测失败 ❗️'
        resolve('Dazn Error')
        return
      }

      const ret = /"GeolocatedCountry":"(.*?)"/gm.exec(data)

      if (ret && ret.length === 2) {
        const region = ret[1]
        result.Dazn = '<b>Dazn: </b>支持 ' + ARROW + regionText(region) + ' 🎉'
      } else {
        result.Dazn = '<b>Dazn: </b>未支持 🚫'
      }

      resolve('Dazn Done')
    }, () => {
      result.Dazn = '<b>Dazn: </b>检测超时 🚦'
      resolve('Dazn Timeout')
    })
  })
}

function testParamount() {
  return new Promise(resolve => {
    const option = {
      url: BASE_URL_PARAMOUNT,
      opts: optsNoRedirect,
      timeout: 2800,
      headers: {
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(response => {
      const code = statusCodeOf(response)

      console.log('Paramountᐩ: ' + code)

      if (code === 200) {
        result.Paramount = '<b>Paramountᐩ: </b>支持 🎉'
      } else if (code === 302) {
        result.Paramount = '<b>Paramountᐩ: </b>未支持 🚫'
      } else {
        result.Paramount = '<b>Paramountᐩ: </b>检测失败 ❗️'
      }

      resolve('Paramount Done')
    }, () => {
      result.Paramount = '<b>Paramountᐩ: </b>检测超时 🚦'
      resolve('Paramount Timeout')
    })
  })
}

function testDiscovery() {
  return new Promise(resolve => {
    const option = {
      url: BASE_URL_DISCOVERY_TOKEN,
      opts: optsNoRedirect,
      timeout: 2800,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
      },
      verify: false,
    }

    $task.fetch(option).then(response => {
      const code = statusCodeOf(response)

      console.log('Discovery GetToken: ' + code)

      if (code !== 200) {
        result.Discovery = '<b>Discoveryᐩ: </b>检测失败 ❗️'
        resolve('Discovery Token Error')
        return
      }

      let token = ''

      try {
        token = JSON.parse(response.body).data.attributes.token
      } catch (error) {
        result.Discovery = '<b>Discoveryᐩ: </b>检测失败 ❗️'
        resolve('Discovery Token Parse Error')
        return
      }

      const cookie = `_gcl_au=1.1.858579665.1632206782; _rdt_uuid=1632206782474.6a9ad4f2-8ef7-4a49-9d60-e071bce45e88; _scid=d154b864-8b7e-4f46-90e0-8b56cff67d05; _pin_unauth=dWlkPU1qWTRNR1ZoTlRBdE1tSXdNaTAwTW1Nd0xUbGxORFV0WWpZMU0yVXdPV1l6WldFeQ; _sctr=1|1632153600000; aam_fw=aam%3D9354365%3Baam%3D9040990; aam_uuid=24382050115125439381416006538140778858; st=${token}; gi_ls=0; _uetvid=a25161a01aa711ec92d47775379d5e4d; AMCV_BC501253513148ED0A490D45%40AdobeOrg=-1124106680%7CMCIDTS%7C18894%7CMCMID%7C24223296309793747161435877577673078228%7CMCAAMLH-1633011393%7C9%7CMCAAMB-1633011393%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1632413793s%7CNONE%7CvVersion%7C5.2.0; ass=19ef15da-95d6-4b1d-8fa2-e9e099c9cc38.1632408400.1632406594`

      const optionUser = {
        url: BASE_URL_DISCOVERY,
        opts: optsNoRedirect,
        timeout: 2800,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36',
          Cookie: cookie,
        },
        ciphers: 'DEFAULT@SECLEVEL=1',
        verify: false,
      }

      $task.fetch(optionUser).then(userResponse => {
        console.log('Discovery Check: ' + statusCodeOf(userResponse))

        try {
          const data = JSON.parse(userResponse.body)
          const location = data.data.attributes.currentLocationTerritory

          if (String(location).toLowerCase() === 'us') {
            result.Discovery = '<b>Discoveryᐩ: </b>支持 🎉'
          } else {
            result.Discovery = '<b>Discoveryᐩ: </b>未支持 🚫'
          }
        } catch (error) {
          result.Discovery = '<b>Discoveryᐩ: </b>检测失败 ❗️'
        }

        resolve('Discovery Done')
      }, () => {
        result.Discovery = '<b>Discoveryᐩ: </b>检测超时 🚦'
        resolve('Discovery Check Timeout')
      })
    }, () => {
      result.Discovery = '<b>Discoveryᐩ: </b>检测超时 🚦'
      resolve('Discovery Token Timeout')
    })
  })
}

function testChatGPT() {
  return new Promise(resolve => {
    const option = {
      url: BASE_URL_GPT,
      opts: optsNoRedirect,
      timeout: 2800,
      headers: {
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(response => {
      const resp = JSON.stringify(response)

      console.log('ChatGPT Main Test: ' + statusCodeOf(response))

      if (resp.indexOf('text/plain') !== -1) {
        result.ChatGPT = '<b>ChatGPT: </b>未支持 🚫'
        resolve('ChatGPT Not Available')
        return
      }

      const optionTrace = {
        url: REGION_URL_GPT,
        opts: optsNoRedirect,
        timeout: 2800,
        headers: {
          'User-Agent': UA,
        },
      }

      $task.fetch(optionTrace).then(traceResponse => {
        console.log('ChatGPT Region Test: ' + statusCodeOf(traceResponse))

        const body = traceResponse.body || ''
        const match = body.match(/loc=([^\n]+)/)
        const region = match ? match[1].trim().toUpperCase() : ''

        console.log('ChatGPT Region: ' + region)

        if (CHATGPT_SUPPORT_COUNTRY_CODES.indexOf(region) !== -1) {
          result.ChatGPT = '<b>ChatGPT: </b>支持 ' + ARROW + regionText(region) + ' 🎉'
        } else {
          result.ChatGPT = '<b>ChatGPT: </b>未支持 🚫'
        }

        resolve('ChatGPT Done')
      }, () => {
        result.ChatGPT = '<b>ChatGPT: </b>检测失败 ❗️'
        resolve('ChatGPT Region Error')
      })
    }, () => {
      result.ChatGPT = '<b>ChatGPT: </b>检测超时 🚦'
      resolve('ChatGPT Timeout')
    })
  })
}

function testGemini() {
  return new Promise(resolve => {
    const option = {
      url: BASE_URL_GEMINI,
      opts: optsNoRedirect,
      timeout: 5000,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(async response => {
      const code = statusCodeOf(response)
      const data = response.body || ''

      console.log('Gemini: ' + code)

      const blocked = /Gemini isn'?t currently supported|not available in your country|isn'?t available in your country|not supported in your country|unsupported country|not available in your location|isn'?t available in your location/i.test(data)

      if (code === 403 || code === 451 || blocked) {
        result.Gemini = '<b>Gemini: </b>未支持 🚫'
        resolve('Gemini Not Available')
        return
      }

      if (code >= 200 && code < 400) {
        const region = await getTraceRegion(REGION_URL_CF)
        result.Gemini = '<b>Gemini: </b>支持 ' + (region ? ARROW + regionText(region) + ' ' : '') + '🎉'
        resolve('Gemini Available')
        return
      }

      result.Gemini = '<b>Gemini: </b>检测失败 ❗️'
      resolve('Gemini Error')
    }, () => {
      result.Gemini = '<b>Gemini: </b>检测超时 🚦'
      resolve('Gemini Timeout')
    })
  })
}

function testClaude() {
  return new Promise(resolve => {
    const option = {
      url: BASE_URL_CLAUDE,
      opts: optsNoRedirect,
      timeout: 5000,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': UA,
      },
    }

    $task.fetch(option).then(async response => {
      const code = statusCodeOf(response)
      const data = response.body || ''
      const headers = JSON.stringify(response.headers || {})

      console.log('Claude: ' + code)

      const blocked = /unsupported_country|not available in your country|not available in your region|country is not supported|region is not supported/i.test(data + headers)

      if (code === 403 || code === 451 || blocked) {
        result.Claude = '<b>Claude: </b>未支持 🚫'
        resolve('Claude Not Available')
        return
      }

      if (code >= 200 && code < 400) {
        let region = await getTraceRegion(REGION_URL_CLAUDE)

        if (!region) {
          region = await getTraceRegion(REGION_URL_CF)
        }

        result.Claude = '<b>Claude: </b>支持 ' + (region ? ARROW + regionText(region) + ' ' : '') + '🎉'
        resolve('Claude Available')
        return
      }

      result.Claude = '<b>Claude: </b>检测失败 ❗️'
      resolve('Claude Error')
    }, () => {
      result.Claude = '<b>Claude: </b>检测超时 🚦'
      resolve('Claude Timeout')
    })
  })
}
