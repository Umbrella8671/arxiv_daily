/**
 * Media Unlock Checker for Quantumult X
 * Migrated completely from clash-verge-rev logic
 * Structure mirrors the original qx.js exactly.
 */

const BASE_URL_YTB = 'https://www.youtube.com/premium?hl=en'
const BASE_URL_DISNEY = 'https://www.disneyplus.com'
const FILM_ID_1 = 81280792
const FILM_ID_2 = 70143836
const FILM_ID_3 = 80018499
const NETFLIX_CDN_URL = 'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=5'
const BILIBILI_MAINLAND_URL = 'https://api.bilibili.com/pgc/player/web/playurl?avid=82846771&qn=0&type=&otype=json&ep_id=307247&fourk=1&fnver=0&fnval=16&module=bangumi'
const BILIBILI_HKMOtw_URL = 'https://api.bilibili.com/pgc/player/web/playurl?avid=18281381&cid=29892777&qn=0&type=&otype=json&ep_id=183799&fourk=1&fnver=0&fnval=16&module=bangumi'
const BASE_URL_PRIME = 'https://www.primevideo.com'
const BASE_URL_SPOTIFY = 'https://www.spotify.com/api/content/v1/country-selector?platform=web&format=json'
const BASE_URL_TIKTOK_TRACE = 'https://www.tiktok.com/cdn-cgi/trace'
const BASE_URL_BAHAMUT_DEVICE = 'https://ani.gamer.com.tw/ajax/getdeviceid.php'
const BASE_URL_CHATGPT_TRACE = 'https://chat.openai.com/cdn-cgi/trace'
const BASE_URL_CHATGPT_WEB = 'https://api.openai.com/compliance/cookie_requirements'
const BASE_URL_CHATGPT_IOS = 'https://ios.chat.openai.com/'
const BASE_URL_GEMINI = 'https://gemini.google.com'
const BASE_URL_CLAUDE_TRACE = 'https://claude.ai/cdn-cgi/trace'

const ARROW = ' ➟ '
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const opts = {
  policy: $environment.params,
}

const optsNoRedirect = {
  policy: $environment.params,
  redirection: false,
}

const result = {
  title: '    📺  流媒体服务查询',
  Netflix: '<b>Netflix: </b>检测失败，请重试 ❗️',
  YouTube: '<b>YouTube Premium: </b>检测失败，请重试 ❗️',
  Disney: '<b>Disneyᐩ: </b>检测失败，请重试 ❗️',
  PrimeVideo: '<b>Prime Video: </b>检测失败，请重试 ❗️',
  Spotify: '<b>Spotify: </b>检测失败，请重试 ❗️',
  TikTok: '<b>TikTok: </b>检测失败，请重试 ❗️',
  BilibiliMainland: '<b>哔哩哔哩大陆: </b>检测失败，请重试 ❗️',
  BilibiliHKMOTW: '<b>哔哩哔哩港澳台: </b>检测失败，请重试 ❗️',
  Bahamut: '<b>Bahamut Anime: </b>检测失败，请重试 ❗️',
  ChatGPT: '<b>ChatGPT: </b>检测失败，请重试 ❗️',
  Gemini: '<b>Gemini: </b>检测失败，请重试 ❗️',
  Claude: '<b>Claude: </b>检测失败，请重试 ❗️',
}

const message = {
  action: 'get_policy_state',
  content: $environment.params,
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

function getTraceRegion(traceUrl) {
  return new Promise(resolve => {
    $task.fetch({
      url: traceUrl,
      opts: optsNoRedirect,
      timeout: 3000,
      headers: { 'User-Agent': UA },
    }).then(response => {
      const body = response.body || ''
      const match = body.match(/loc=([A-Z]{2})/i)
      resolve(match ? match[1].toUpperCase() : '')
    }, () => resolve(''))
  })
}

function getPolicyOutput() {
  return new Promise(resolve => {
    $configuration.sendMessage(message).then(response => {
      if (response && response.error) {
        resolve($environment.params)
        return
      }
      if (response && response.ret && response.ret[message.content]) {
        const output = JSON.stringify(response.ret[message.content])
          .replace(/\"|\\[|\\]/g, '')
          .replace(/\,/g, ' ➟ ')
        resolve(output || $environment.params)
        return
      }
      resolve($environment.params)
    }, () => resolve($environment.params))
  })
}

function buildHtmlMessage(output) {
  const items = [
    result.Netflix,
    result.YouTube,
    result.Disney,
    result.PrimeVideo,
    result.Spotify,
    result.TikTok,
    result.BilibiliMainland,
    result.BilibiliHKMOTW,
    result.Bahamut,
    result.ChatGPT,
    result.Gemini,
    result.Claude,
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

// ── Netflix ───────────────────────────────────────────────────────────────────
// Logic from clash-verge-rev: first try Fast.com CDN API, then title-based fallback
function testNetflix() {
  return new Promise(resolve => {
    $task.fetch({
      url: NETFLIX_CDN_URL,
      opts: optsNoRedirect,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(cdnRes => {
      if (statusCodeOf(cdnRes) === 403) {
        result.Netflix = '<b>Netflix: </b>未支持 (IP Banned) 🚫'
        return resolve()
      }
      try {
        const data = JSON.parse(cdnRes.body || '')
        if (data && data.targets && data.targets.length > 0) {
          const country = data.targets[0].location && data.targets[0].location.country
          if (country) {
            result.Netflix = '<b>Netflix: </b>完整支持' + ARROW + regionText(country) + ' 🎉'
            return resolve()
          }
        }
      } catch (e) {}

      // Fallback: title-based detection
      $task.fetch({
        url: 'https://www.netflix.com/title/' + FILM_ID_1,
        opts: optsNoRedirect,
        timeout: 5000,
        headers: { 'User-Agent': UA },
      }).then(r1 => {
        $task.fetch({
          url: 'https://www.netflix.com/title/' + FILM_ID_2,
          opts: optsNoRedirect,
          timeout: 5000,
          headers: { 'User-Agent': UA },
        }).then(r2 => {
          const s1 = statusCodeOf(r1)
          const s2 = statusCodeOf(r2)
          if (s1 === 404 && s2 === 404) {
            result.Netflix = '<b>Netflix: </b>仅支持自制剧 ⚠️'
            return resolve()
          }
          if (s1 === 403 || s2 === 403) {
            result.Netflix = '<b>Netflix: </b>未支持 🚫'
            return resolve()
          }
          if (s1 === 200 || s1 === 301 || s2 === 200 || s2 === 301) {
            $task.fetch({
              url: 'https://www.netflix.com/title/' + FILM_ID_3,
              opts: optsNoRedirect,
              timeout: 5000,
              headers: { 'User-Agent': UA },
            }).then(r3 => {
              let region = 'US'
              const loc = (r3.headers && (r3.headers['Location'] || r3.headers['location'])) || ''
              if (loc) {
                const parts = loc.split('/')
                if (parts.length >= 4) region = parts[3].split('-')[0] || 'US'
              }
              result.Netflix = '<b>Netflix: </b>完整支持' + ARROW + regionText(region) + ' 🎉'
              resolve()
            }, () => {
              result.Netflix = '<b>Netflix: </b>完整支持' + ARROW + regionText('US') + ' 🎉'
              resolve()
            })
          } else {
            result.Netflix = '<b>Netflix: </b>检测失败 ❗️'
            resolve()
          }
        }, () => { result.Netflix = '<b>Netflix: </b>检测超时 🚦'; resolve() })
      }, () => { result.Netflix = '<b>Netflix: </b>检测超时 🚦'; resolve() })
    }, () => { result.Netflix = '<b>Netflix: </b>检测超时 🚦'; resolve() })
  })
}

// ── YouTube Premium ───────────────────────────────────────────────────────────
// Logic from clash-verge-rev youtube.rs
function testYouTube() {
  return new Promise(resolve => {
    $task.fetch({
      url: BASE_URL_YTB,
      opts: opts,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      const code = statusCodeOf(res)
      const body = res.body || ''
      const bodyLower = body.toLowerCase()
      const m = body.match(/"GL"\s*:\s*"([A-Za-z]{2})"/) || body.match(/"countryCode"\s*:\s*"([A-Za-z]{2})"/)
      const region = m ? m[1].toUpperCase() : 'US'

      if (bodyLower.indexOf('premium is not available in your country') !== -1 ||
          bodyLower.indexOf('premium is not available in your region') !== -1) {
        result.YouTube = '<b>YouTube Premium: </b>未支持 🚫'
      } else if (code >= 200 && code < 300 &&
                 (bodyLower.indexOf('youtube premium') !== -1 || bodyLower.indexOf('ad-free') !== -1)) {
        result.YouTube = '<b>YouTube Premium: </b>支持' + ARROW + regionText(region) + ' 🎉'
      } else {
        result.YouTube = '<b>YouTube Premium: </b>检测失败 ❗️'
      }
      resolve()
    }, () => { result.YouTube = '<b>YouTube Premium: </b>检测超时 🚦'; resolve() })
  })
}

// ── Disney+ ───────────────────────────────────────────────────────────────────
// Logic from clash-verge-rev disney_plus.rs (Device -> Token -> GraphQL)
function testDisney() {
  return new Promise(resolve => {
    const authHeader = 'Bearer ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84'

    $task.fetch({
      url: 'https://disney.api.edge.bamgrid.com/devices',
      method: 'POST',
      opts: opts,
      timeout: 6000,
      headers: { 'authorization': authHeader, 'content-type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ deviceFamily: 'browser', applicationRuntime: 'chrome', deviceProfile: 'windows', attributes: {} }),
    }).then(devRes => {
      if (statusCodeOf(devRes) === 403) {
        result.Disney = '<b>Disneyᐩ: </b>未支持 🚫'
        return resolve()
      }
      const assertionMatch = (devRes.body || '').match(/"assertion"\s*:\s*"([^"]+)"/)
      if (!assertionMatch) {
        result.Disney = '<b>Disneyᐩ: </b>检测失败 ❗️'
        return resolve()
      }

      $task.fetch({
        url: 'https://disney.api.edge.bamgrid.com/token',
        method: 'POST',
        opts: opts,
        timeout: 6000,
        headers: { 'authorization': authHeader, 'content-type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: 'grant_type=urn:ietf:params:oauth:grant-type:token-exchange&latitude=0&longitude=0&platform=browser&subject_token=' + assertionMatch[1] + '&subject_token_type=urn:bamtech:params:oauth:token-type:device',
      }).then(tokenRes => {
        const tBody = tokenRes.body || ''
        if (tBody.indexOf('forbidden-location') !== -1) {
          result.Disney = '<b>Disneyᐩ: </b>未支持 🚫'
          return resolve()
        }
        const rtMatch = tBody.match(/"refresh_token"\s*:\s*"([^"]+)"/)
        if (!rtMatch) {
          result.Disney = '<b>Disneyᐩ: </b>检测失败 ❗️'
          return resolve()
        }

        $task.fetch({
          url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
          method: 'POST',
          opts: opts,
          timeout: 6000,
          headers: { 'authorization': authHeader, 'content-type': 'application/json', 'User-Agent': UA },
          body: JSON.stringify({
            query: 'mutation refreshToken($input: RefreshTokenInput!) { refreshToken(refreshToken: $input) { activeSession { sessionId } } }',
            variables: { input: { refreshToken: rtMatch[1] } },
          }),
        }).then(gqlRes => {
          const gBody = gqlRes.body || ''
          const regMatch = gBody.match(/"countryCode"\s*:\s*"([^"]+)"/)
          const inSupported = gBody.indexOf('"inSupportedLocation":true') !== -1 ||
                              gBody.indexOf('"inSupportedLocation": true') !== -1
          if (!regMatch) {
            result.Disney = '<b>Disneyᐩ: </b>未支持 🚫'
            return resolve()
          }
          const region = regMatch[1]
          if (region === 'JP' || inSupported) {
            result.Disney = '<b>Disneyᐩ: </b>支持' + ARROW + regionText(region) + ' 🎉'
          } else {
            result.Disney = '<b>Disneyᐩ: </b>即将上线' + ARROW + regionText(region) + ' ⚠️'
          }
          resolve()
        }, () => { result.Disney = '<b>Disneyᐩ: </b>检测超时 🚦'; resolve() })
      }, () => { result.Disney = '<b>Disneyᐩ: </b>检测超时 🚦'; resolve() })
    }, () => { result.Disney = '<b>Disneyᐩ: </b>检测超时 🚦'; resolve() })
  })
}

// ── Prime Video ───────────────────────────────────────────────────────────────
// Logic from clash-verge-rev prime_video.rs
function testPrimeVideo() {
  return new Promise(resolve => {
    $task.fetch({
      url: BASE_URL_PRIME,
      opts: opts,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      const body = res.body || ''
      if (body.indexOf('isServiceRestricted') !== -1) {
        result.PrimeVideo = '<b>Prime Video: </b>未支持 🚫'
      } else {
        const m = body.match(/"currentTerritory":"([^"]+)"/)
        if (m && m[1]) {
          result.PrimeVideo = '<b>Prime Video: </b>支持' + ARROW + regionText(m[1]) + ' 🎉'
        } else {
          result.PrimeVideo = '<b>Prime Video: </b>未支持 🚫'
        }
      }
      resolve()
    }, () => { result.PrimeVideo = '<b>Prime Video: </b>检测超时 🚦'; resolve() })
  })
}

// ── Spotify ───────────────────────────────────────────────────────────────────
// Logic from clash-verge-rev spotify.rs
function testSpotify() {
  return new Promise(resolve => {
    $task.fetch({
      url: BASE_URL_SPOTIFY,
      opts: opts,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      const code = statusCodeOf(res)
      const body = res.body || ''
      if (code === 403 || code === 451 || body.toLowerCase().indexOf('not available in your country') !== -1) {
        result.Spotify = '<b>Spotify: </b>未支持 🚫'
      } else if (code >= 200 && code < 300) {
        const m = body.match(/"countryCode":"([^"]+)"/)
        result.Spotify = '<b>Spotify: </b>支持' + (m ? ARROW + regionText(m[1]) : '') + ' 🎉'
      } else {
        result.Spotify = '<b>Spotify: </b>检测失败 ❗️'
      }
      resolve()
    }, () => { result.Spotify = '<b>Spotify: </b>检测超时 🚦'; resolve() })
  })
}

// ── TikTok ────────────────────────────────────────────────────────────────────
// Logic from clash-verge-rev tiktok.rs
function testTikTok() {
  return new Promise(resolve => {
    $task.fetch({
      url: BASE_URL_TIKTOK_TRACE,
      opts: opts,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      const code = statusCodeOf(res)
      if (code === 403 || code === 451) {
        result.TikTok = '<b>TikTok: </b>未支持 🚫'
        return resolve()
      }
      const body = res.body || ''
      const m = body.match(/loc=([A-Za-z]+)/)
      if (m && m[1]) {
        result.TikTok = '<b>TikTok: </b>支持' + ARROW + regionText(m[1]) + ' 🎉'
        return resolve()
      }
      // fallback to homepage
      $task.fetch({
        url: 'https://www.tiktok.com/',
        opts: opts,
        timeout: 5000,
        headers: { 'User-Agent': UA },
      }).then(htmlRes => {
        const htmlBody = htmlRes.body || ''
        if (htmlBody.toLowerCase().indexOf('access denied') !== -1 ||
            htmlBody.toLowerCase().indexOf('not available in your region') !== -1) {
          result.TikTok = '<b>TikTok: </b>未支持 🚫'
          return resolve()
        }
        const rm = htmlBody.match(/"region"\s*:\s*"([a-zA-Z-]+)"/)
        if (rm && rm[1]) {
          result.TikTok = '<b>TikTok: </b>支持' + ARROW + regionText(rm[1]) + ' 🎉'
        } else {
          result.TikTok = '<b>TikTok: </b>检测失败 ❗️'
        }
        resolve()
      }, () => { result.TikTok = '<b>TikTok: </b>检测超时 🚦'; resolve() })
    }, () => { result.TikTok = '<b>TikTok: </b>检测超时 🚦'; resolve() })
  })
}

// ── Bilibili Mainland ─────────────────────────────────────────────────────────
// Logic from clash-verge-rev bilibili.rs
function testBilibiliMainland() {
  return new Promise(resolve => {
    $task.fetch({
      url: BILIBILI_MAINLAND_URL,
      opts: opts,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      try {
        const data = JSON.parse(res.body || '')
        if (data.code === 0) result.BilibiliMainland = '<b>哔哩哔哩大陆: </b>支持 🎉'
        else if (data.code === -10403) result.BilibiliMainland = '<b>哔哩哔哩大陆: </b>未支持 🚫'
        else result.BilibiliMainland = '<b>哔哩哔哩大陆: </b>检测失败 ❗️'
      } catch (e) { result.BilibiliMainland = '<b>哔哩哔哩大陆: </b>检测失败 ❗️' }
      resolve()
    }, () => { result.BilibiliMainland = '<b>哔哩哔哩大陆: </b>检测超时 🚦'; resolve() })
  })
}

// ── Bilibili HK/MO/TW ────────────────────────────────────────────────────────
// Logic from clash-verge-rev bilibili.rs
function testBilibiliHKMOTW() {
  return new Promise(resolve => {
    $task.fetch({
      url: BILIBILI_HKMOtw_URL,
      opts: opts,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      try {
        const data = JSON.parse(res.body || '')
        if (data.code === 0) result.BilibiliHKMOTW = '<b>哔哩哔哩港澳台: </b>支持 🎉'
        else if (data.code === -10403) result.BilibiliHKMOTW = '<b>哔哩哔哩港澳台: </b>未支持 🚫'
        else result.BilibiliHKMOTW = '<b>哔哩哔哩港澳台: </b>检测失败 ❗️'
      } catch (e) { result.BilibiliHKMOTW = '<b>哔哩哔哩港澳台: </b>检测失败 ❗️' }
      resolve()
    }, () => { result.BilibiliHKMOTW = '<b>哔哩哔哩港澳台: </b>检测超时 🚦'; resolve() })
  })
}

// ── Bahamut Anime ─────────────────────────────────────────────────────────────
// Logic from clash-verge-rev bahamut.rs
function testBahamut() {
  return new Promise(resolve => {
    $task.fetch({
      url: BASE_URL_BAHAMUT_DEVICE,
      opts: opts,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(devRes => {
      const devMatch = (devRes.body || '').match(/"deviceid"\s*:\s*"([^"]+)"/)
      if (!devMatch) {
        result.Bahamut = '<b>Bahamut Anime: </b>未支持 🚫'
        return resolve()
      }
      let cookieStr = ''
      if (devRes.headers && devRes.headers['Set-Cookie']) {
        cookieStr = Array.isArray(devRes.headers['Set-Cookie'])
          ? devRes.headers['Set-Cookie'].join('; ')
          : devRes.headers['Set-Cookie']
      }

      $task.fetch({
        url: 'https://ani.gamer.com.tw/ajax/token.php?adID=89422&sn=37783&device=' + devMatch[1],
        opts: opts,
        timeout: 5000,
        headers: { 'User-Agent': UA, 'Cookie': cookieStr },
      }).then(tokenRes => {
        if ((tokenRes.body || '').indexOf('animeSn') === -1) {
          result.Bahamut = '<b>Bahamut Anime: </b>未支持 🚫'
          return resolve()
        }

        $task.fetch({
          url: 'https://ani.gamer.com.tw/',
          opts: opts,
          timeout: 5000,
          headers: { 'User-Agent': UA, 'Cookie': cookieStr },
        }).then(htmlRes => {
          const regMatch = (htmlRes.body || '').match(/data-geo="([^"]+)"/)
          const region = regMatch ? regMatch[1] : 'TW'
          result.Bahamut = '<b>Bahamut Anime: </b>支持' + ARROW + regionText(region) + ' 🎉'
          resolve()
        }, () => { result.Bahamut = '<b>Bahamut Anime: </b>检测超时 🚦'; resolve() })
      }, () => { result.Bahamut = '<b>Bahamut Anime: </b>检测超时 🚦'; resolve() })
    }, () => { result.Bahamut = '<b>Bahamut Anime: </b>检测超时 🚦'; resolve() })
  })
}

// ── ChatGPT ───────────────────────────────────────────────────────────────────
// Logic from clash-verge-rev chatgpt.rs (3-endpoint check)
function testChatGPT() {
  return new Promise(resolve => {
    // Step 1: region via trace
    $task.fetch({
      url: BASE_URL_CHATGPT_TRACE,
      opts: optsNoRedirect,
      timeout: 5000,
      headers: { 'User-Agent': UA },
    }).then(traceRes => {
      const traceBody = traceRes.body || ''
      const traceMatch = traceBody.match(/loc=([A-Z]{2})/i)
      const region = traceMatch ? traceMatch[1].toUpperCase() : ''

      // Step 2: web check
      $task.fetch({
        url: BASE_URL_CHATGPT_WEB,
        opts: optsNoRedirect,
        timeout: 5000,
        headers: { 'User-Agent': UA },
      }).then(webRes => {
        const webAvailable = (webRes.body || '').toLowerCase().indexOf('unsupported_country') === -1

        // Step 3: iOS check
        $task.fetch({
          url: BASE_URL_CHATGPT_IOS,
          opts: optsNoRedirect,
          timeout: 5000,
          headers: { 'User-Agent': UA },
        }).then(iosRes => {
          const iosBody = (iosRes.body || '').toLowerCase()
          const iosOk = iosBody.indexOf('request is not allowed. please try again later.') !== -1

          if (webAvailable) {
            result.ChatGPT = '<b>ChatGPT: </b>支持网页' + (iosOk ? '/App ' : ' ') +
              (region ? ARROW + regionText(region) : '') + ' 🎉'
          } else if (iosOk) {
            result.ChatGPT = '<b>ChatGPT: </b>仅支持App ' + (region ? ARROW + regionText(region) : '') + ' 🎉'
          } else {
            result.ChatGPT = '<b>ChatGPT: </b>未支持 🚫'
          }
          resolve()
        }, () => {
          // iOS failed, fall back to web-only result
          if (webAvailable) {
            result.ChatGPT = '<b>ChatGPT: </b>支持网页 ' + (region ? ARROW + regionText(region) : '') + ' 🎉'
          } else {
            result.ChatGPT = '<b>ChatGPT: </b>未支持 🚫'
          }
          resolve()
        })
      }, () => { result.ChatGPT = '<b>ChatGPT: </b>检测超时 🚦'; resolve() })
    }, () => { result.ChatGPT = '<b>ChatGPT: </b>检测超时 🚦'; resolve() })
  })
}

// ── Gemini ────────────────────────────────────────────────────────────────────
// Logic from clash-verge-rev gemini.rs
// Extracts 3-letter country code from page source via marker ",2,1,200,\""
function testGemini() {
  return new Promise(resolve => {
    $task.fetch({
      url: BASE_URL_GEMINI,
      opts: optsNoRedirect,
      timeout: 6000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      const BLOCKED = ['CHN', 'RUS', 'BLR', 'CUB', 'IRN', 'PRK', 'SYR', 'HKG', 'MAC']
      const match = (res.body || '').match(/,2,1,200,"([A-Z]{3})"/)
      if (match && match[1]) {
        if (BLOCKED.indexOf(match[1]) !== -1) {
          result.Gemini = '<b>Gemini: </b>未支持 🚫'
        } else {
          result.Gemini = '<b>Gemini: </b>支持 ' + ARROW + '⟦' + match[1] + '⟧ 🎉'
        }
      } else {
        result.Gemini = '<b>Gemini: </b>检测失败 ❗️'
      }
      resolve()
    }, () => { result.Gemini = '<b>Gemini: </b>检测超时 🚦'; resolve() })
  })
}

// ── Claude ────────────────────────────────────────────────────────────────────
// Logic from clash-verge-rev claude.rs
// Checks loc= from cdn-cgi/trace against a blocklist
function testClaude() {
  return new Promise(resolve => {
    $task.fetch({
      url: BASE_URL_CLAUDE_TRACE,
      opts: optsNoRedirect,
      timeout: 6000,
      headers: { 'User-Agent': UA },
    }).then(res => {
      const BLOCKED = ['AF', 'BY', 'CN', 'CU', 'HK', 'IR', 'KP', 'MO', 'RU', 'SY']
      const m = (res.body || '').match(/loc=([A-Z]{2})/i)
      const region = m ? m[1].toUpperCase() : ''
      if (!region) {
        result.Claude = '<b>Claude: </b>检测失败 ❗️'
      } else if (BLOCKED.indexOf(region) !== -1) {
        result.Claude = '<b>Claude: </b>未支持 🚫'
      } else {
        result.Claude = '<b>Claude: </b>支持 ' + ARROW + regionText(region) + ' 🎉'
      }
      resolve()
    }, () => { result.Claude = '<b>Claude: </b>检测超时 🚦'; resolve() })
  })
}

// ── Main entry — mirrors qx.js structure exactly ──────────────────────────────
;(async () => {
  try {
    const tasks = [
      testNetflix(),
      testYouTube(),
      testDisney(),
      testPrimeVideo(),
      testSpotify(),
      testTikTok(),
      testBilibiliMainland(),
      testBilibiliHKMOTW(),
      testBahamut(),
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
