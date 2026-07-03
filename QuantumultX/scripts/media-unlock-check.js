/***

[task_local]
event-interaction https://raw.githubusercontent.com/.../streaming-ui-check.js, tag=流媒体解锁检测, img-url=play.tv.fill.system

@Description: 流媒体 & AI 服务解锁检测 (Netflix, YouTube, Spotify, ChatGPT, Claude, Gemini, Bahamut, Prime Video, TikTok)
@Update: 2026-07-04

逻辑 1:1 翻译自 clash-verge-rev Rust 源码

***/

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const ARROW = ' ➟ '
const TIMEOUT = 5000

const opts = { policy: $environment.params }
const optsNoRedirect = { policy: $environment.params, redirection: false }

// ─── 结果容器 ───
const result = {
  Netflix:     '',
  YouTube:     '',
  Spotify:     '',
  ChatGPTiOS:  '',
  ChatGPTWeb:  '',
  Claude:      '',
  Gemini:      '',
  Bahamut:     '',
  PrimeVideo:  '',
  TikTok:      '',
}

// ═══════════════════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════════════════

function countryCodeToFlag(code) {
  if (!code) return ''
  code = String(code).toUpperCase()
  if (code === 'UK') code = 'GB'
  if (!/^[A-Z]{2}$/.test(code)) return ''
  return String.fromCodePoint(code.charCodeAt(0) - 65 + 0x1F1E6)
       + String.fromCodePoint(code.charCodeAt(1) - 65 + 0x1F1E6)
}

function regionTag(code) {
  code = String(code || '').toUpperCase()
  const flag = countryCodeToFlag(code)
  return flag ? '⟦' + flag + code + '⟧' : (code ? '⟦' + code + '⟧' : '')
}

function statusCode(resp) {
  return resp.statusCode || resp.status || 0
}

function fetchWithTimeout(option) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject('Timeout'), option.timeout || TIMEOUT)
    $task.fetch(option).then(resp => {
      clearTimeout(timer)
      resolve(resp)
    }, err => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

/** 解析 Cloudflare cdn-cgi/trace 中的 loc=XX */
function getTraceRegion(traceUrl) {
  return fetchWithTimeout({
    url: traceUrl,
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    const m = (resp.body || '').match(/loc=([A-Z]{2})/i)
    return m ? m[1].toUpperCase() : ''
  }).catch(() => '')
}

function line(label, status) {
  return '<b>' + label + ': </b>' + status
}

// ═══════════════════════════════════════════════════
//  Netflix  (3-phase: CDN → Title × 2 → Region)
// ═══════════════════════════════════════════════════

function testNetflix() {
  return testNetflixCDN().then(cdn => {
    if (cdn.ok) {
      result.Netflix = line('Netflix', '完整支持' + ARROW + regionTag(cdn.region) + ' 🎉')
      return
    }
    if (cdn.banned) {
      result.Netflix = line('Netflix', 'IP 被封禁 🚫')
      return
    }
    return testNetflixTitles()
  }).catch(() => {
    if (!result.Netflix) result.Netflix = line('Netflix', '检测失败 ❗️')
  })
}

function testNetflixCDN() {
  return fetchWithTimeout({
    url: 'https://api.fast.com/netflix/speedtest/v2?https=true&token=YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm&urlCount=5',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    if (statusCode(resp) === 403) return { banned: true }
    try {
      const data = JSON.parse(resp.body)
      if (data.targets && data.targets.length > 0 && data.targets[0].location) {
        return { ok: true, region: data.targets[0].location.country || '' }
      }
    } catch (e) { /* ignore */ }
    return {}
  }).catch(() => ({}))
}

function testNetflixTitles() {
  const fetch1 = fetchWithTimeout({
    url: 'https://www.netflix.com/title/81280792',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(r => statusCode(r)).catch(() => 0)

  const fetch2 = fetchWithTimeout({
    url: 'https://www.netflix.com/title/70143836',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(r => statusCode(r)).catch(() => 0)

  return Promise.all([fetch1, fetch2]).then(codes => {
    const s1 = codes[0], s2 = codes[1]

    if (s1 === 403 || s2 === 403) {
      result.Netflix = line('Netflix', '未支持 🚫')
      return
    }

    if (s1 === 404 && s2 === 404) {
      result.Netflix = line('Netflix', '仅自制剧集 ⚠️')
      return
    }

    if (s1 === 200 || s1 === 301 || s2 === 200 || s2 === 301) {
      return testNetflixRegion()
    }

    result.Netflix = line('Netflix', '检测失败 ❗️')
  })
}

function testNetflixRegion() {
  return fetchWithTimeout({
    url: 'https://www.netflix.com/title/80018499',
    opts: optsNoRedirect,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    let region = 'US'
    const headers = resp.headers || {}
    const loc = headers['Location'] || headers['location'] || ''
    if (loc) {
      const parts = loc.split('/')
      if (parts.length >= 4) {
        region = (parts[3].split('-')[0] || 'US').toUpperCase()
      }
    }
    result.Netflix = line('Netflix', '完整支持' + ARROW + regionTag(region) + ' 🎉')
  }).catch(() => {
    result.Netflix = line('Netflix', '支持 (区域未知) 🎉')
  })
}

// ═══════════════════════════════════════════════════
//  YouTube Premium  (4 regex patterns)
// ═══════════════════════════════════════════════════

function testYouTubePremium() {
  return fetchWithTimeout({
    url: 'https://www.youtube.com/premium?hl=en',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    const code = statusCode(resp)
    const body = resp.body || ''
    const bodyLower = body.toLowerCase()

    // 区域提取 (4 种 regex，按优先级)
    let region = ''
    const patterns = [
      /id=['"]country-code['"][^>]*>\s*([A-Za-z]{2,3})\s*</,
      /"GL"\s*:\s*"([A-Za-z]{2})"/,
      /"countryCode"\s*:\s*"([A-Za-z]{2})"/,
      /"country_code"\s*:\s*"([A-Za-z]{2})"/,
    ]
    for (let i = 0; i < patterns.length; i++) {
      const m = body.match(patterns[i])
      if (m && m[1]) { region = m[1].toUpperCase(); break }
    }

    // 状态判断
    if (bodyLower.indexOf('youtube premium is not available in your country') !== -1
     || bodyLower.indexOf('premium is not available in your country') !== -1
     || bodyLower.indexOf('premium is not available in your region') !== -1) {
      result.YouTube = line('YouTube Premium', '未支持 🚫')
      return
    }

    if (code >= 200 && code < 300
     && (bodyLower.indexOf('youtube premium') !== -1
      || bodyLower.indexOf('ad-free') !== -1
      || bodyLower.indexOf('"browseid":"spunlimited"') !== -1)) {
      result.YouTube = line('YouTube Premium', '支持' + ARROW + regionTag(region) + ' 🎉')
      return
    }

    result.YouTube = line('YouTube Premium', '检测失败 ❗️')
  }).catch(() => {
    result.YouTube = line('YouTube Premium', '检测超时 🚦')
  })
}

// ═══════════════════════════════════════════════════
//  Spotify  (country-selector API, no redirect)
// ═══════════════════════════════════════════════════

function testSpotify() {
  return fetchWithTimeout({
    url: 'https://www.spotify.com/api/content/v1/country-selector?platform=web&format=json',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    const code = statusCode(resp)
    const body = resp.body || ''
    const bodyLower = body.toLowerCase()

    if (code === 403 || code === 451) {
      result.Spotify = line('Spotify', '未支持 🚫')
      return
    }
    if (code < 200 || code >= 300) {
      result.Spotify = line('Spotify', '检测失败 ❗️')
      return
    }
    if (bodyLower.indexOf('not available in your country') !== -1) {
      result.Spotify = line('Spotify', '未支持 🚫')
      return
    }

    // 区域提取：从 body 中解析 countryCode
    let region = ''
    const m = body.match(/"countryCode"\s*:\s*"([A-Z]+)"/i)
    if (m && m[1]) region = m[1].toUpperCase()

    result.Spotify = line('Spotify', '支持' + ARROW + regionTag(region) + ' 🎉')
  }).catch(() => {
    result.Spotify = line('Spotify', '检测超时 🚦')
  })
}

// ═══════════════════════════════════════════════════
//  ChatGPT  (2 items: iOS + Web)
// ═══════════════════════════════════════════════════

function testChatGPT() {
  return getTraceRegion('https://chat.openai.com/cdn-cgi/trace').then(region => {
    const regionStr = region ? ARROW + regionTag(region) : ''

    const iosPromise = fetchWithTimeout({
      url: 'https://ios.chat.openai.com/',
      opts: opts,
      timeout: TIMEOUT,
      headers: { 'User-Agent': UA },
    }).then(resp => {
      const body = (resp.body || '').toLowerCase()
      if (body.indexOf('you may be connected to a disallowed isp') !== -1) {
        result.ChatGPTiOS = line('ChatGPT iOS', 'ISP 受限 ⚠️' + regionStr)
      } else if (body.indexOf('request is not allowed. please try again later.') !== -1) {
        result.ChatGPTiOS = line('ChatGPT iOS', '支持' + regionStr + ' 🎉')
      } else if (body.indexOf('sorry, you have been blocked') !== -1) {
        result.ChatGPTiOS = line('ChatGPT iOS', '已封锁 🚫')
      } else {
        result.ChatGPTiOS = line('ChatGPT iOS', '检测失败 ❗️')
      }
    }).catch(() => {
      result.ChatGPTiOS = line('ChatGPT iOS', '检测超时 🚦')
    })

    const webPromise = fetchWithTimeout({
      url: 'https://api.openai.com/compliance/cookie_requirements',
      opts: opts,
      timeout: TIMEOUT,
      headers: { 'User-Agent': UA },
    }).then(resp => {
      const body = (resp.body || '').toLowerCase()
      if (body.indexOf('unsupported_country') !== -1) {
        result.ChatGPTWeb = line('ChatGPT Web', '未支持 🚫' + regionStr)
      } else {
        result.ChatGPTWeb = line('ChatGPT Web', '支持' + regionStr + ' 🎉')
      }
    }).catch(() => {
      result.ChatGPTWeb = line('ChatGPT Web', '检测超时 🚦')
    })

    return Promise.all([iosPromise, webPromise])
  })
}

// ═══════════════════════════════════════════════════
//  Claude  (trace + blocked list)
// ═══════════════════════════════════════════════════

const CLAUDE_BLOCKED = ['AF', 'BY', 'CN', 'CU', 'HK', 'IR', 'KP', 'MO', 'RU', 'SY']

function testClaude() {
  return getTraceRegion('https://claude.ai/cdn-cgi/trace').then(region => {
    if (!region) {
      result.Claude = line('Claude', '检测失败 ❗️')
    } else if (CLAUDE_BLOCKED.indexOf(region) !== -1) {
      result.Claude = line('Claude', '未支持 🚫')
    } else {
      result.Claude = line('Claude', '支持' + ARROW + regionTag(region) + ' 🎉')
    }
  })
}

// ═══════════════════════════════════════════════════
//  Gemini  (body marker ,2,1,200," + alpha-3 code)
// ═══════════════════════════════════════════════════

const GEMINI_BLOCKED = ['CHN', 'RUS', 'BLR', 'CUB', 'IRN', 'PRK', 'SYR', 'HKG', 'MAC']

function testGemini() {
  return fetchWithTimeout({
    url: 'https://gemini.google.com',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    const body = resp.body || ''
    const marker = ',2,1,200,"'
    const idx = body.indexOf(marker)

    if (idx !== -1) {
      const code = body.substring(idx + marker.length, idx + marker.length + 3)
      if (/^[A-Z]{3}$/.test(code)) {
        if (GEMINI_BLOCKED.indexOf(code) !== -1) {
          result.Gemini = line('Gemini', '未支持 🚫')
        } else {
          result.Gemini = line('Gemini', '支持' + ARROW + regionTag(code) + ' 🎉')
        }
        return
      }
    }
    result.Gemini = line('Gemini', '检测失败 ❗️')
  }).catch(() => {
    result.Gemini = line('Gemini', '检测超时 🚦')
  })
}

// ═══════════════════════════════════════════════════
//  Bahamut 動畫瘋  (deviceid → token → region)
// ═══════════════════════════════════════════════════

function testBahamut() {
  return fetchWithTimeout({
    url: 'https://ani.gamer.com.tw/ajax/getdeviceid.php',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    const body = resp.body || ''
    const m = body.match(/"deviceid"\s*:\s*"([^"]+)"/)
    const deviceId = m ? m[1] : ''

    if (!deviceId) {
      result.Bahamut = line('Bahamut 動畫瘋', '检测失败 ❗️')
      return
    }

    return fetchWithTimeout({
      url: 'https://ani.gamer.com.tw/ajax/token.php?adID=89422&sn=37783&device=' + deviceId,
      opts: opts,
      timeout: TIMEOUT,
      headers: { 'User-Agent': UA },
    }).then(tokenResp => {
      const tokenBody = tokenResp.body || ''

      if (tokenBody.indexOf('animeSn') === -1) {
        result.Bahamut = line('Bahamut 動畫瘋', '未支持 🚫')
        return
      }

      // Step 3: 获取区域
      return fetchWithTimeout({
        url: 'https://ani.gamer.com.tw/',
        opts: opts,
        timeout: TIMEOUT,
        headers: { 'User-Agent': UA },
      }).then(mainResp => {
        const mainBody = mainResp.body || ''
        const geoMatch = mainBody.match(/data-geo="([^"]+)"/)
        const region = geoMatch ? geoMatch[1].toUpperCase() : ''

        result.Bahamut = line('Bahamut 動畫瘋', '支持' + ARROW + regionTag(region) + ' 🎉')
      }).catch(() => {
        result.Bahamut = line('Bahamut 動畫瘋', '支持 (区域未知) 🎉')
      })
    })
  }).catch(() => {
    result.Bahamut = line('Bahamut 動畫瘋', '检测超时 🚦')
  })
}

// ═══════════════════════════════════════════════════
//  Prime Video  (currentTerritory)
// ═══════════════════════════════════════════════════

function testPrimeVideo() {
  return fetchWithTimeout({
    url: 'https://www.primevideo.com',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    const body = resp.body || ''

    if (body.indexOf('isServiceRestricted') !== -1) {
      result.PrimeVideo = line('Prime Video', '未支持 🚫')
      return
    }

    const m = body.match(/"currentTerritory"\s*:\s*"([^"]+)"/)
    if (m && m[1]) {
      const region = m[1].toUpperCase()
      result.PrimeVideo = line('Prime Video', '支持' + ARROW + regionTag(region) + ' 🎉')
    } else {
      result.PrimeVideo = line('Prime Video', '检测失败 ❗️')
    }
  }).catch(() => {
    result.PrimeVideo = line('Prime Video', '检测超时 🚦')
  })
}

// ═══════════════════════════════════════════════════
//  TikTok  (trace + fallback to main page)
// ═══════════════════════════════════════════════════

function testTikTok() {
  let tiktokStatus = 'Failed'
  let tiktokRegion = ''

  return fetchWithTimeout({
    url: 'https://www.tiktok.com/cdn-cgi/trace',
    opts: opts,
    timeout: TIMEOUT,
    headers: { 'User-Agent': UA },
  }).then(resp => {
    const code = statusCode(resp)
    const body = resp.body || ''
    const parsed = parseTikTokResponse(code, body)
    tiktokStatus = parsed.status
    tiktokRegion = parsed.region

    // 从 trace 中也提取 loc
    if (!tiktokRegion) {
      const locMatch = body.match(/loc=([A-Z]{2})/i)
      if (locMatch) tiktokRegion = locMatch[1].toUpperCase()
    }
  }).catch(() => {
    // trace 失败，后续 fallback
  }).then(() => {
    if (tiktokRegion && tiktokStatus !== 'Failed') {
      applyTikTokResult(tiktokStatus, tiktokRegion)
      return
    }

    // Fallback: 主页面
    return fetchWithTimeout({
      url: 'https://www.tiktok.com/',
      opts: opts,
      timeout: TIMEOUT,
      headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
    }).then(resp => {
      const code = statusCode(resp)
      const body = resp.body || ''
      const parsed = parseTikTokResponse(code, body)

      if (tiktokStatus !== 'No') tiktokStatus = parsed.status
      if (!tiktokRegion) tiktokRegion = parsed.region

      applyTikTokResult(tiktokStatus, tiktokRegion)
    }).catch(() => {
      applyTikTokResult(tiktokStatus, tiktokRegion)
    })
  })
}

function parseTikTokResponse(code, body) {
  let status = 'Failed'
  let region = ''

  if (code === 403 || code === 451) {
    status = 'No'
  } else if (code >= 200 && code < 300) {
    const bodyLower = body.toLowerCase()
    if (bodyLower.indexOf('access denied') !== -1
     || bodyLower.indexOf('not available in your region') !== -1
     || bodyLower.indexOf('tiktok is not available') !== -1) {
      status = 'No'
    } else {
      status = 'Yes'
    }
  }

  const m = body.match(/"region"\s*:\s*"([a-zA-Z-]+)"/)
  if (m && m[1]) {
    region = m[1].split('-')[0].toUpperCase()
  }

  return { status, region }
}

function applyTikTokResult(status, region) {
  if (status === 'Yes') {
    result.TikTok = line('TikTok', '支持' + ARROW + regionTag(region) + ' 🎉')
  } else if (status === 'No') {
    result.TikTok = line('TikTok', '未支持 🚫')
  } else {
    result.TikTok = line('TikTok', '检测失败 ❗️')
  }
}

// ═══════════════════════════════════════════════════
//  主入口 & HTML 输出
// ═══════════════════════════════════════════════════

;(async () => {
  try {
    // 初始化所有结果为默认值
    Object.keys(result).forEach(k => {
      if (!result[k]) result[k] = line(k, '检测失败 ❗️')
    })

    await Promise.all([
      testNetflix(),
      testYouTubePremium(),
      testSpotify(),
      testChatGPT(),
      testClaude(),
      testGemini(),
      testBahamut(),
      testPrimeVideo(),
      testTikTok(),
    ].map(p => p.catch(e => console.log('Task error: ' + e))))

    const output = await getPolicyOutput()
    $done({ title: '    📺  流媒体 & AI 解锁检测', htmlMessage: buildHtml(output) })
  } catch (e) {
    console.log('Main error: ' + e)
    $done({
      title: '    📺  流媒体 & AI 解锁检测',
      htmlMessage: errorHtml(String(e || '检测异常')),
    })
  }
})()

function buildHtml(policyOutput) {
  const items = [
    result.Netflix,
    result.YouTube,
    result.Spotify,
    result.PrimeVideo,
    result.Bahamut,
    result.TikTok,
    result.ChatGPTiOS,
    result.ChatGPTWeb,
    result.Claude,
    result.Gemini,
  ]

  let html = '<div style="text-align: center; font-family: -apple-system; font-size: 15px; line-height: 1.6;">'
  html += '<hr style="margin: 8px 0; border: 0; border-top: 1px solid #ddd;"/>'
  html += items.join('<br/>')
  html += '<hr style="margin: 8px 0; border: 0; border-top: 1px solid #ddd;"/>'
  html += '<font color="#6959CD"><b>节点</b> ➟ ' + policyOutput + '</font>'
  html += '</div>'
  return html
}

function errorHtml(msg) {
  return '<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: bold;">🚥 ' + msg + '</p>'
}

function getPolicyOutput() {
  return new Promise(resolve => {
    const message = { action: 'get_policy_state', content: $environment.params }
    $configuration.sendMessage(message).then(response => {
      if (response && response.error) {
        resolve($environment.params)
        return
      }
      if (response && response.ret && response.ret[message.content]) {
        const output = JSON.stringify(response.ret[message.content])
          .replace(/\\"|[\[\]]/g, '')
          .replace(/,/g, ' ➟ ')
        resolve(output || $environment.params)
        return
      }
      resolve($environment.params)
    }, () => resolve($environment.params))
  })
}
