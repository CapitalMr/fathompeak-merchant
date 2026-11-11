/* 商家后台。账本在 merchant-data.js，这里只排页面。 */
const D = globalThis.MerchantData
const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const app = document.getElementById('app')
let authed = sessionStorage.getItem('mc-auth') === '1'
let ledgerSpan = 'month'
let picked = D.TODAY_YMD
let kind = 'all'
let lastPage = ''
let fleetOpen = false
let fleetEdit = ''
let fleetConfirm = ''
let fleetMsg = ''
let fleetFocus = ''
let fleetDraft = null

function loadFleet() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('mc-fleet') || '')
    if (saved && saved.extra && saved.gone && saved.patch) {
      if (!saved.seq) saved.seq = 7
      return saved
    }
  } catch (error) {
    /* 忽略损坏的本机会话 */
  }
  return { seq: 7, extra: [], gone: [], patch: {} }
}

let fleet = loadFleet()

function saveFleetStore() {
  sessionStorage.setItem('mc-fleet', JSON.stringify(fleet))
}

function blankFleet() {
  return {
    place: '',
    hall: '',
    model: '',
    kind: '对话',
    gpu: 'r5090',
    n: '8',
    since: D.TODAY_YMD,
  }
}

function nextMachineCode() {
  const used = {}
  D.day(D.TODAY_YMD).nodes.forEach(function (node) {
    used[node.code] = true
  })
  fleet.extra.forEach(function (node) {
    used[node.code] = true
  })
  let n = 1
  let code = ''
  do {
    code = 'HSZ-' + String(n).padStart(2, '0')
    n += 1
  } while (used[code])
  return code
}

function buildExtra(draft, id, code) {
  const gpu = D.GPUS[draft.gpu]
  const count = Number(draft.n)
  return {
    id: id,
    code: code,
    place: draft.place,
    hall: draft.hall,
    since: draft.since,
    model: draft.model,
    kind: draft.kind,
    blurb: draft.kind === '视频' ? '视频生成。' : '对话推理。',
    pending: true,
    gpuText: count + '× ' + gpu.name,
    cards: [
      {
        n: count,
        id: draft.gpu,
        name: gpu.name,
        short: gpu.short,
        vendor: gpu.vendor,
        tdp: gpu.tdp,
      },
    ],
    netC: 0,
    tokOut: 0,
    kwhC: 0,
    util: 0,
  }
}

function applyFleetPatch(node) {
  const patch = fleet.patch[node.id]
  if (!patch) return node
  return Object.assign({}, node, patch)
}

function managedNodes(todayNodes) {
  const base = todayNodes
    .filter(function (node) {
      return fleet.gone.indexOf(node.id) === -1
    })
    .map(applyFleetPatch)
  return base.concat(fleet.extra.map(applyFleetPatch))
}

function fleetRecord(id) {
  const extra = fleet.extra.find(function (node) {
    return node.id === id
  })
  if (extra) return extra
  const today = D.day(D.TODAY_YMD).nodes.find(function (node) {
    return node.id === id
  })
  return today ? applyFleetPatch(today) : null
}

function draftFromNode(node) {
  const card = node.cards[0]
  return {
    place: node.place,
    hall: node.hall,
    model: node.model,
    kind: node.kind,
    gpu: card.id,
    n: String(card.n),
    since: node.since,
  }
}

function readFleetForm(form) {
  function value(name) {
    const field = form.elements[name]
    return field ? String(field.value).trim() : ''
  }
  return {
    place: value('place'),
    hall: value('hall'),
    model: value('model'),
    kind: value('kind') || '对话',
    gpu: value('gpu'),
    n: value('n'),
    since: value('since'),
  }
}

function captureFleetForm() {
  const form = document.querySelector('[data-fleet-form]')
  if (form) fleetDraft = readFleetForm(form)
}

function saveFleetForm(form) {
  const draft = readFleetForm(form)
  fleetDraft = draft
  const count = Number(draft.n)
  if (!draft.place) {
    fleetMsg = '请填写机位'
    render()
    return
  }
  if (!draft.hall) {
    fleetMsg = '请填写位置'
    render()
    return
  }
  if (!draft.model) {
    fleetMsg = '请填写部署模型'
    render()
    return
  }
  if (!draft.since) {
    fleetMsg = '请填写上架日期'
    render()
    return
  }
  if (!D.GPUS[draft.gpu]) {
    fleetMsg = '请选择加速卡'
    render()
    return
  }
  if (!Number.isInteger(count) || count < 1 || count > 8) {
    fleetMsg = '卡数为 1 到 8'
    render()
    return
  }
  if (fleetEdit) {
    const pending = fleet.extra.some(function (node) {
      return node.id === fleetEdit
    })
    if (pending) {
      const current = fleet.extra.find(function (node) {
        return node.id === fleetEdit
      })
      fleet.extra = fleet.extra.map(function (node) {
        return node.id === fleetEdit ? buildExtra(draft, node.id, node.code) : node
      })
      fleetFocus = current.id
    } else {
      fleet.patch[fleetEdit] = {
        place: draft.place,
        hall: draft.hall,
        model: draft.model,
        kind: draft.kind,
        since: draft.since,
        blurb: draft.kind === '视频' ? '视频生成。' : '对话推理。',
      }
      fleetFocus = fleetEdit
    }
  } else {
    fleet.seq += 1
    const created = buildExtra(draft, 'mc-' + fleet.seq, nextMachineCode())
    fleet.extra.push(created)
    fleetFocus = created.id
  }
  fleetOpen = false
  fleetEdit = ''
  fleetMsg = ''
  fleetDraft = null
  saveFleetStore()
  render()
}

function dropFleet(id) {
  if (
    fleet.extra.some(function (node) {
      return node.id === id
    })
  ) {
    fleet.extra = fleet.extra.filter(function (node) {
      return node.id !== id
    })
  } else if (fleet.gone.indexOf(id) === -1) {
    fleet.gone.push(id)
  }
  delete fleet.patch[id]
  if (fleetEdit === id) {
    fleetOpen = false
    fleetEdit = ''
  }
  fleetConfirm = ''
  saveFleetStore()
  render()
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  })
}

function cny(cents) {
  const neg = cents < 0
  const v = Math.abs(Math.round(cents))
  const whole = Math.floor(v / 100).toLocaleString('zh-CN')
  const frac = String(v % 100).padStart(2, '0')
  return (neg ? '-' : '') + '¥' + whole + '.' + frac
}

function cnyPlain(cents) {
  return cny(cents).slice(1)
}

function hero(cents) {
  const v = Math.abs(Math.round(cents))
  const whole = Math.floor(v / 100).toLocaleString('zh-CN')
  const frac = String(v % 100).padStart(2, '0')
  return '¥' + whole + '.<small>' + frac + '</small>'
}

function fmtKwh(centi) {
  const v = Math.abs(Math.round(centi))
  const whole = Math.floor(v / 100).toLocaleString('zh-CN')
  const frac = String(v % 100).padStart(2, '0')
  return (centi < 0 ? '-' : '') + whole + '.' + frac + ' kWh'
}

function fmtTok(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(2) + ' 亿'
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString('zh-CN') + ' 万'
  return Math.round(n).toLocaleString('zh-CN')
}

function fmtM(n) {
  return (n / 1e6).toFixed(2)
}

function fmtInt(n) {
  return Math.round(n).toLocaleString('zh-CN')
}

function fmtUtil(u) {
  return Math.round(u * 100) + '%'
}

function fmtPct(x) {
  const p = x * 100
  if (p >= 10) return Math.round(p) + '%'
  const text = p.toFixed(1)
  return (text.endsWith('.0') ? text.slice(0, -2) : text) + '%'
}

function fmtTimes(x) {
  return x.toFixed(2) + ' 倍'
}

function rate(cents) {
  return (cents / 100).toFixed(2)
}

function zhMd(ymd) {
  const parts = ymd.split('-')
  return Number(parts[1]) + '月' + Number(parts[2]) + '日'
}

function healthClock(id) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const minutes = 5 * 60 + 40 + ((h >>> 0) % 100)
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mm = String(minutes % 60).padStart(2, '0')
  return hh + ':' + mm
}

function healthOf(node) {
  if (node.pending || !node.util) {
    return [
      ['健康检查', '未开始', 'is-wait'],
      ['心跳', '—', 'is-wait'],
      ['温度', '—', 'is-wait'],
      ['最近检查', '—', 'is-wait'],
    ]
  }
  const hold = node.util < 0.25
  const temp = Math.round(46 + node.util * 36) + '°C'
  return [
    ['健康检查', hold ? '检修' : '正常', hold ? 'is-wait' : 'is-ok'],
    ['心跳', hold ? '间断' : '正常', hold ? 'is-wait' : 'is-ok'],
    ['温度', temp, ''],
    ['最近检查', '今日 ' + healthClock(node.id), ''],
  ]
}

function healthHtml(node) {
  return (
    '<div class="mc-health">' +
    healthOf(node)
      .map(function (row) {
        return (
          '<p><span>' +
          esc(row[0]) +
          '</span><b class="' +
          row[2] +
          '">' +
          esc(row[1]) +
          '</b></p>'
        )
      })
      .join('') +
    '</div>'
  )
}

function zhDate(ymd) {
  const parts = ymd.split('-')
  return parts[0] + '年' + Number(parts[1]) + '月' + Number(parts[2]) + '日'
}

function rangeLabel(key) {
  const pair = D.RANGES[key]
  return zhMd(pair[0]) + '–' + zhMd(pair[1])
}

function icon(name) {
  const paths = {
    overview: '<path d="M3.5 13.5 8 7.5l3 3.2 5.5-6.2"/>',
    machines:
      '<rect x="3.5" y="3.5" width="13" height="5" rx="1.2"/><rect x="3.5" y="11.5" width="13" height="5" rx="1.2"/>',
    models: '<path d="M4 8 10 4.5 16 8 10 11.5Z"/><path d="M4 12 10 15.5 16 12"/>',
    ledger: '<path d="M5 3.5h7l3.5 3.5V16.5H5Z"/><path d="M12 3.5V7h3.5"/>',
    power: '<path d="M11 2.5 6 10.5h4.2L9 17.5 15 9.2h-4.2L11 2.5Z"/>',
    settle:
      '<rect x="2.8" y="5" width="14.4" height="10" rx="1.6"/><path d="M2.8 8.5h14.4"/>',
    centers:
      '<circle cx="10" cy="10" r="6.2"/><path d="M10 3.8v12.4M3.8 10h12.4"/><path d="M4.7 7.1c1.5.7 2.8 1 5.3 1s3.8-.3 5.3-1M4.7 12.9c1.5-.7 2.8-1 5.3-1s3.8.3 5.3 1"/>',
    out: '<path d="M7 5.5H4.5v10h10V13"/><path d="M9.5 10.5 16 4"/><path d="M11.5 4H16v4.5"/>',
  }
  return (
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    paths[name] +
    '</svg>'
  )
}

function chev() {
  return '<svg class="mc-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>'
}

function story(today) {
  const box5090 = today.nodes.find(function (node) {
    return node.id === 'FP-ZJG-01'
  })
  const flash = today.nodes.find(function (node) {
    return node.id === 'FP-ZJG-02'
  })
  const h200 = today.nodes.find(function (node) {
    return node.id === 'FP-ZJG-04'
  })
  const video = today.nodes.filter(function (node) {
    return node.kind === '视频'
  })
  const vNet = video.reduce(function (sum, node) {
    return sum + node.netC
  }, 0)
  const vOut = video.reduce(function (sum, node) {
    return sum + node.tokOut
  }, 0)
  const p5 = D.perCardKwh('r5090', box5090.util)
  const p6 = D.perCardKwh('pro6000', flash.util)
  return {
    netShare: fmtPct(vNet / today.netC),
    tokShare: fmtPct(vOut / today.tokOut),
    netWidth: Math.round((vNet / today.netC) * 100),
    tokWidth: Math.round((vOut / today.tokOut) * 100),
    times: fmtTimes(h200.exactKwh / box5090.exactKwh),
    p5: p5.toFixed(3),
    p6: p6.toFixed(3),
    close: Math.abs(p5 - p6) / p5 < 0.01,
    box5090: box5090,
    flash: flash,
    h200: h200,
  }
}

function deltaText(today) {
  const prev = D.DAYS[D.DAYS.indexOf(today) - 1]
  if (!prev) return ''
  const diff = today.netC - prev.netC
  if (diff === 0) return '与昨日持平'
  return (diff > 0 ? '比昨日多 ' : '比昨日少 ') + cny(Math.abs(diff))
}

function chip(kind) {
  return '<span class="mc-chip' + (kind === '视频' ? ' is-video' : '') + '">' + esc(kind) + '</span>'
}

function pips(node) {
  return node.cards
    .map(function (card) {
      let html = ''
      for (let i = 0; i < card.n; i++) {
        html +=
          '<i class="mc-pip" data-vendor="' +
          esc(card.vendor) +
          '" title="' +
          esc(card.vendor + ' ' + card.name) +
          '"><small>' +
          esc(card.vendor) +
          '</small><b>' +
          esc(card.short) +
          '</b></i>'
      }
      return html
    })
    .join('')
}

function rated(node) {
  return node.cards
    .map(function (card) {
      return card.tdp + 'W × ' + card.n
    })
    .join('，')
}

function eq(node) {
  return (
    fmtM(node.tokIn) +
    ' × ' +
    rate(node.inRate) +
    ' + ' +
    fmtM(node.tokOut) +
    ' × ' +
    rate(node.outRate) +
    ' = ' +
    cny(node.netC)
  )
}

function pageOverview() {
  const today = D.day(D.TODAY_YMD)
  const week = D.rangeSum('week')
  const month = D.rangeSum('month')
  const days = D.DAYS.slice(-14)
  const max = days.reduce(function (m, day) {
    return Math.max(m, day.netC)
  }, 1)
  const bars = days
    .map(function (day) {
      const h = Math.max(6, Math.round((day.netC / max) * 100))
      const weekend = day.dow === 0 || day.dow === 6
      return (
        '<div class="mc-bar' +
        (day.ymd === D.TODAY_YMD ? ' is-today' : '') +
        (weekend ? ' is-end' : '') +
        '" style="--h:' +
        h +
        '" title="' +
        esc(zhMd(day.ymd) + ' ' + cny(day.netC)) +
        '"><i></i><span>' +
        day.date.getDate() +
        '</span></div>'
      )
    })
    .join('')
  const body = today.nodes
    .map(function (node) {
      return (
        '<tr data-go="#/machines/' +
        node.id +
        '"><td>' +
        esc(node.place) +
        '<span class="mc-subline">' +
        esc(node.code) +
        '</span></td><td>' +
        esc(
          node.cards
            .map(function (card) {
              return card.n + '× ' + card.short
            })
            .join(' + ')
        ) +
        '</td><td>' +
        esc(node.model) +
        (node.kind === '视频' ? '<span class="mc-kind">视频</span>' : '') +
        '</td><td class="mc-num">' +
        fmtUtil(node.util) +
        '</td><td class="mc-num">' +
        cny(node.netC) +
        '</td><td class="mc-num">' +
        fmtTok(node.tokOut) +
        '</td><td class="mc-num">' +
        fmtKwh(node.kwhC) +
        '</td></tr>'
      )
    })
    .join('')
  return (
    '<header class="mc-hd"><div><p class="mc-kicker">' +
    esc(zhDate(today.ymd) + ' · ' + WEEK[today.dow] + ' · ' + D.STATION.name) +
    '</p><h1>今日入账</h1></div>' +
    '</header><p class="mc-hero">' +
    hero(today.netC) +
    '</p><p class="mc-delta">' +
    esc(deltaText(today)) +
    ' · ' +
    D.nodeTotal +
    ' 台在线 · ' +
    D.cardTotal +
    ' 张卡</p><p class="mc-lead">商家实收按日入账，平台服务费另计。</p><div class="mc-sheet mc-metrics"><button class="mc-metric" type="button" data-span="month" data-day="' +
    D.TODAY_YMD +
    '" data-go="#/ledger"><span>今日</span><b>' +
    cny(today.netC) +
    '</b><small>' +
    fmtTok(today.tokOut) +
    ' token · ' +
    fmtKwh(today.kwhC) +
    '</small></button><button class="mc-metric" type="button" data-span="week" data-go="#/ledger"><span>近七日</span><b>' +
    cny(week.netC) +
    '</b><small>' +
    esc(rangeLabel('week')) +
    '</small></button><button class="mc-metric" type="button" data-span="month" data-go="#/ledger"><span>本月至今</span><b>' +
    cny(month.netC) +
    '</b><small>' +
    esc(rangeLabel('month')) +
    '</small></button></div><h2 class="mc-h">近十四日</h2><div class="mc-bars" role="img" aria-label="近十四日入账">' +
    bars +
    '</div><h2 class="mc-h">在架机器</h2><div class="mc-sheet mc-scroll"><table class="mc-table"><thead><tr><th>机器</th><th>加速卡</th><th>部署模型</th><th class="mc-num">负载</th><th class="mc-num">今日入账</th><th class="mc-num">输出 token</th><th class="mc-num">绿电</th></tr></thead><tbody>' +
    body +
    '</tbody><tfoot><tr><td colspan="4">合计</td><td class="mc-num">' +
    cny(today.netC) +
    '</td><td class="mc-num">' +
    fmtTok(today.tokOut) +
    '</td><td class="mc-num">' +
    fmtKwh(today.kwhC) +
    '</td></tr></tfoot></table></div>'
  )
}

function pageMachines(route) {
  const today = D.day(D.TODAY_YMD)
  const filters = [
    ['all', '全部'],
    ['对话', '对话'],
    ['视频', '视频'],
  ]
    .map(function (item) {
      return (
        '<button type="button" data-kind="' +
        item[0] +
        '" aria-pressed="' +
        (kind === item[0]) +
        '">' +
        item[1] +
        '</button>'
      )
    })
    .join('')
  const nodes = managedNodes(today.nodes).filter(function (node) {
    return kind === 'all' || node.kind === kind
  })
  const cards = nodes
    .map(function (node) {
      const on = route.id === node.id ? ' is-on' : ''
      const ask = fleetConfirm === node.id
      const actions = ask
        ? '<div class="mc-confirm"><span>确认下架</span><button type="button" class="mc-textbtn is-danger" data-fleet="drop" data-id="' +
          esc(node.id) +
          '">下架</button><button type="button" class="mc-textbtn" data-fleet="keep">取消</button></div>'
        : '<div class="mc-node-actions"><button type="button" class="mc-textbtn" data-fleet="edit" data-id="' +
          esc(node.id) +
          '">编辑</button><button type="button" class="mc-textbtn is-danger" data-fleet="ask" data-id="' +
          esc(node.id) +
          '">下架</button></div>'
      return (
        '<article class="mc-sheet mc-node' +
        on +
        '" id="node-' +
        node.id +
        '"><div class="mc-node-top"><div><p class="mc-kicker">' +
        esc(node.place) +
        ' · <span class="mc-id">' +
        esc(node.code) +
        '</span> · ' +
        esc(node.hall) +
        '</p><h2>' +
        esc(node.model) +
        '</h2><p class="mc-spec">' +
        esc(node.blurb) +
        '</p><p class="mc-spec">' +
        esc(node.gpuText) +
        ' · 额定 ' +
        esc(rated(node)) +
        ' · 上架 ' +
        esc(zhMd(node.since)) +
        '</p></div><div class="mc-node-side"><div class="mc-node-badges">' +
        chip(node.kind) +
        (node.pending
          ? '<span class="mc-accept is-wait">待验收</span><span class="mc-live is-wait"><i></i>待上线</span>'
          : '<span class="mc-accept">验收通过</span><span class="mc-live"><i></i>在线</span>') +
        '</div>' +
        healthHtml(node) +
        actions +
        '</div></div><div class="mc-pips">' +
        pips(node) +
        '</div><dl class="mc-stats"><div><dt>今日入账</dt><dd>' +
        cny(node.netC) +
        '</dd></div><div><dt>输出 token</dt><dd>' +
        fmtTok(node.tokOut) +
        '</dd></div><div><dt>绿电</dt><dd>' +
        fmtKwh(node.kwhC) +
        '</dd></div><div><dt>负载</dt><dd>' +
        fmtUtil(node.util) +
        '<i class="mc-track' +
        (node.kind === '视频' ? ' is-video' : '') +
        '"><i style="width:' +
        Math.round(node.util * 100) +
        '%"></i></i></dd></div></dl></article>'
      )
    })
    .join('')
  return (
    '<header class="mc-hd"><div><p class="mc-kicker">' +
    esc(D.STATION.region) +
    '</p><h1>我的机器</h1></div>' +
    (fleetOpen ? '' : '<button class="mc-add" type="button" data-fleet="open">添加机器</button>') +
    '</header>' +
    (fleetOpen ? machineForm() : '') +
    '<div class="mc-filters">' +
    filters +
    '</div>' +
    (cards || '<p class="mc-note">暂无此类机器。</p>')
  )
}

function machineForm() {
  const draft = fleetDraft || blankFleet()
  const editing = fleetEdit ? fleetRecord(fleetEdit) : null
  const locked = editing && !editing.pending
  const gpus = Object.keys(D.GPUS)
    .map(function (id) {
      const gpu = D.GPUS[id]
      return (
        '<option value="' +
        esc(id) +
        '"' +
        (draft.gpu === id ? ' selected' : '') +
        '>' +
        esc(gpu.vendor + ' ' + gpu.name) +
        '</option>'
      )
    })
    .join('')
  return (
    '<form class="mc-sheet mc-form" data-fleet-form><h2>' +
    (fleetEdit ? '编辑机器' : '添加机器') +
    '</h2><div class="mc-form-grid"><label class="mc-field">机位<input name="place" value="' +
    esc(draft.place) +
    '"></label><label class="mc-field">位置<input name="hall" value="' +
    esc(draft.hall) +
    '"></label><label class="mc-field">部署模型<input name="model" value="' +
    esc(draft.model) +
    '"></label><label class="mc-field">类型<select name="kind"><option value="对话"' +
    (draft.kind === '对话' ? ' selected' : '') +
    '>对话</option><option value="视频"' +
    (draft.kind === '视频' ? ' selected' : '') +
    '>视频</option></select></label><label class="mc-field">加速卡<select name="gpu"' +
    (locked ? ' disabled' : '') +
    '>' +
    gpus +
    '</select></label><label class="mc-field">卡数<input name="n" type="number" min="1" max="8" step="1" value="' +
    esc(draft.n) +
    '"' +
    (locked ? ' disabled' : '') +
    '></label><label class="mc-field">上架日期<input name="since" type="date" value="' +
    esc(draft.since) +
    '"></label></div>' +
    (fleetMsg ? '<p class="mc-note">' + esc(fleetMsg) + '</p>' : '') +
    '<div class="mc-form-actions"><button class="mc-add" type="submit">' +
    (fleetEdit ? '保存' : '上架') +
    '</button><button class="mc-quiet" type="button" data-fleet="cancel">取消</button></div></form>'
  )
}

function pageModels() {
  const today = D.day(D.TODAY_YMD)
  const cards = today.nodes
    .map(function (node) {
      return (
        '<article class="mc-sheet mc-model"><div><p class="mc-kicker">' +
        esc(node.place) +
        ' · ' +
        esc(node.gpuText) +
        '</p><h2>' +
        esc(node.model) +
        '</h2><p class="mc-spec">' +
        chip(node.kind) +
        '</p><p class="mc-eq">' +
        esc(eq(node)) +
        '</p></div><dl class="mc-kv"><div><dt>今日调用</dt><dd>' +
        fmtInt(node.calls) +
        '</dd></div><div><dt>输入 · 百万</dt><dd>' +
        fmtM(node.tokIn) +
        '</dd></div><div><dt>输出 · 百万</dt><dd>' +
        fmtM(node.tokOut) +
        '</dd></div><div><dt>今日入账</dt><dd>' +
        cny(node.netC) +
        '</dd></div></dl></article>'
      )
    })
    .join('')
  return (
    '<header class="mc-hd"><div><p class="mc-kicker">' +
    esc(D.STATION.region) +
    '</p><h1>模型产出</h1></div>' +
    '</header><p class="mc-lead">按百万 token 结算输入与输出。单价为商家实收，平台服务费另计。</p>' +
    cards
  )
}

function ledgerList() {
  const key = ledgerSpan === 'week' ? 'week' : ledgerSpan === 'book' ? 'book' : 'month'
  const pair = D.RANGES[key]
  return D.daysBetween(pair[0], pair[1])
}

function pageLedger() {
  const list = ledgerList()
  if (!list.some(function (day) { return day.ymd === picked })) {
    picked = list[list.length - 1].ymd
  }
  const sum = D.sumDays(list)
  const selected = list.find(function (day) {
    return day.ymd === picked
  })
  const segs = [
    ['week', '近七日'],
    ['month', '本月至今'],
    ['book', '全部账本'],
  ]
    .map(function (item) {
      return (
        '<button type="button" data-span="' +
        item[0] +
        '" aria-pressed="' +
        (ledgerSpan === item[0]) +
        '">' +
        item[1] +
        '</button>'
      )
    })
    .join('')
  const rows = list
    .map(function (day) {
      return (
        '<tr data-day="' +
        day.ymd +
        '"' +
        (day.ymd === picked ? ' class="is-on"' : '') +
        '><td>' +
        esc(zhMd(day.ymd)) +
        '<span class="mc-subline">' +
        WEEK[day.dow] +
        '</span></td><td class="mc-num">' +
        cny(day.netC) +
        '</td><td class="mc-num">' +
        fmtKwh(day.kwhC) +
        '</td><td>' +
        esc(day.band.state) +
        '</td></tr>'
      )
    })
    .join('')
  const machines = selected.nodes
    .map(function (node) {
      return (
        '<tr><td>' +
        esc(node.model) +
        '<span class="mc-subline">' +
        esc(node.place) +
        ' · 入 ¥' +
        rate(node.inRate) +
        ' / 出 ¥' +
        rate(node.outRate) +
        '</span></td><td class="mc-num">' +
        fmtM(node.tokIn) +
        '</td><td class="mc-num">' +
        fmtM(node.tokOut) +
        '</td><td class="mc-num">' +
        cny(node.netC) +
        '</td><td class="mc-num">' +
        fmtKwh(node.kwhC) +
        '</td></tr>'
      )
    })
    .join('')
  return (
    '<header class="mc-hd"><div><p class="mc-kicker">账本</p><h1>统计对账</h1></div>' +
    '</header><p class="mc-lead">按日核对入账、服务费与流水。服务费按入账的 18/82 计。</p><div class="mc-seg">' +
    segs +
    '</div><div class="mc-books"><div class="mc-sheet mc-scroll"><table class="mc-table mc-mini"><thead><tr><th>日期</th><th class="mc-num">入账</th><th class="mc-num">绿电</th><th>状态</th></tr></thead><tbody>' +
    rows +
    '</tbody><tfoot><tr><td>合计</td><td class="mc-num">' +
    cny(sum.netC) +
    '</td><td class="mc-num">' +
    fmtKwh(sum.kwhC) +
    '</td><td></td></tr></tfoot></table></div><article class="mc-sheet mc-voucher"><div class="mc-node-top"><div><p class="mc-kicker">' +
    WEEK[selected.dow] +
    ' · ' +
    esc(selected.band.label) +
    '</p><h2>' +
    esc(zhMd(selected.ymd)) +
    '</h2></div><span class="mc-chip' +
    (selected.band.state === '钱包' ? ' is-video' : '') +
    '">' +
    esc(selected.band.state) +
    '</span></div><p class="mc-big">' +
    cny(selected.netC) +
    '</p><p class="mc-sub">商家入账。流水 ' +
    cny(selected.grossC) +
    '，服务费 ' +
    cny(selected.feeC) +
    '。调用 ' +
    fmtInt(selected.calls) +
    ' 次，输出 ' +
    fmtM(selected.tokOut) +
    ' 百万 token。</p><div class="mc-scroll"><table class="mc-table mc-mini"><thead><tr><th>模型</th><th class="mc-num">输入（百万）</th><th class="mc-num">输出（百万）</th><th class="mc-num">入账</th><th class="mc-num">绿电</th></tr></thead><tbody>' +
    machines +
    '</tbody><tfoot><tr><td colspan="3">' +
    selected.nodes.length +
    ' 台合计</td><td class="mc-num">' +
    cny(selected.netC) +
    '</td><td class="mc-num">' +
    fmtKwh(selected.kwhC) +
    '</td></tr></tfoot></table></div></article></div>'
  )
}

function pagePower() {
  const today = D.day(D.TODAY_YMD)
  const week = D.rangeSum('week')
  const month = D.rangeSum('month')
  const s = story(today)
  const bars = []
  today.nodes.forEach(function (node) {
    node.cards.forEach(function (card) {
      bars.push({
        name: card.name,
        kind: node.kind,
        util: node.util,
        tdp: card.tdp,
        kwh: D.perCardKwh(card.id, node.util),
      })
    })
  })
  bars.sort(function (a, b) {
    return a.kwh - b.kwh
  })
  const max = bars[bars.length - 1].kwh
  const ladder = bars
    .map(function (card) {
      const width = Math.max(4, Math.round((card.kwh / max) * 100))
      return (
        '<div class="mc-cmp"><span>' +
        esc(card.name) +
        '<small>' +
        esc(card.kind) +
        ' · ' +
        card.tdp +
        'W · 负载 ' +
        fmtUtil(card.util) +
        '</small></span><i class="mc-track' +
        (card.kind === '视频' ? ' is-video' : '') +
        '"><i style="width:' +
        width +
        '%"></i></i><b>' +
        card.kwh.toFixed(3) +
        '</b></div>'
      )
    })
    .join('')
  const formulaRows = today.nodes
    .map(function (node) {
      return (
        '<tr><td>' +
        esc(node.place) +
        '<span class="mc-subline">' +
        esc(node.model) +
        '</span></td><td>' +
        esc(node.gpuText) +
        '</td><td class="mc-num">' +
        fmtUtil(node.util) +
        '</td><td class="mc-eq">' +
        esc(node.formula) +
        '</td><td class="mc-num">' +
        node.exactKwh.toFixed(3) +
        '</td><td class="mc-num">' +
        fmtKwh(node.kwhC) +
        '</td></tr>'
      )
    })
    .join('')
  return (
    '<header class="mc-hd"><div><p class="mc-kicker">账本</p><h1>绿电账本</h1></div>' +
    '</header><p class="mc-lead">供电站为' +
    esc(D.STATION.name) +
    '。绿电按铭牌功率与当日负载核算，不从入账中抵扣。</p><div class="mc-sheet mc-metrics"><div class="mc-metric"><span>今日</span><b>' +
    fmtKwh(today.kwhC) +
    '</b><small>' +
    esc(zhMd(today.ymd)) +
    '</small></div><div class="mc-metric"><span>近七日</span><b>' +
    fmtKwh(week.kwhC) +
    '</b><small>' +
    esc(rangeLabel('week')) +
    '</small></div><div class="mc-metric"><span>本月至今</span><b>' +
    fmtKwh(month.kwhC) +
    '</b><small>约 ' +
    (month.kwhC / 100000).toFixed(2) +
    ' MWh</small></div></div><p class="mc-formula">绿电（kWh）= Σ 卡数 × 额定功率（kW）× 当日平均负载 × 24</p><div class="mc-examples">' +
    example(s.box5090) +
    example(s.h200) +
    '</div><h2 class="mc-h">单卡日电量</h2><div class="mc-sheet mc-node">' +
    ladder +
    '</div><h2 class="mc-h">今日分机器</h2><div class="mc-sheet mc-scroll"><table class="mc-table" style="min-width:920px"><thead><tr><th>机器</th><th>卡</th><th class="mc-num">负载</th><th>核算式</th><th class="mc-num">核算值</th><th class="mc-num">入账电量</th></tr></thead><tbody>' +
    formulaRows +
    '</tbody><tfoot><tr><td colspan="5">合计</td><td class="mc-num">' +
    fmtKwh(today.kwhC) +
    '</td></tr></tfoot></table></div><p class="mc-note">入账电量精确到 0.01 kWh。铭牌功率：RTX 5090 575W，RTX PRO 6000 600W，RTX PRO 6000D 575W，H100 / H200 700W，B300 1400W，昇腾 910C 350W，曦云 C500 350W。</p>'
  )
}

function example(node) {
  return (
    '<article class="mc-sheet mc-example"><div><p class="mc-kicker">' +
    esc(node.place) +
    ' · ' +
    esc(node.kind) +
    '</p><h2>' +
    esc(node.gpuText) +
    '</h2><p class="mc-spec">' +
    esc(node.model) +
    ' · 负载 ' +
    fmtUtil(node.util) +
    '</p></div><p class="mc-formula">' +
    esc(node.formula) +
    ' = ' +
    node.exactKwh.toFixed(3) +
    '</p><p class="mc-note">入账 ' +
    fmtKwh(node.kwhC) +
    '</p></article>'
  )
}

function pageSettle() {
  const paid = D.rangeSum('paid')
  const payout = D.rangeSum('payoutToday')
  const wallet = D.rangeSum('wallet')
  const book = D.rangeSum('book')
  const rows = D.BANDS.map(function (band) {
    const sum = D.sumDays(D.daysBetween(band.from, band.to))
    return (
      '<tr><td>' +
      esc(band.label) +
      '<span class="mc-subline">' +
      esc(band.detail) +
      '</span></td><td>' +
      esc(band.state) +
      '</td><td class="mc-num">' +
      cny(sum.netC) +
      '</td><td class="mc-num">' +
      fmtKwh(sum.kwhC) +
      '</td></tr>'
    )
  }).join('')
  return (
    '<header class="mc-hd"><div><p class="mc-kicker">账本</p><h1>结算</h1></div>' +
    '</header><p class="mc-lead">钱包为未到账金额。每周三将上一自然周打入收款账户。</p><div class="mc-sheet mc-metrics"><div class="mc-metric"><span>钱包余额</span><b>' +
    cny(wallet.netC) +
    '</b><small>' +
    esc(rangeLabel('wallet')) +
    '</small></div><div class="mc-metric"><span>其中今日打出</span><b>' +
    cny(payout.netC) +
    '</b><small>' +
    esc(rangeLabel('payoutToday')) +
    '</small></div><div class="mc-metric"><span>已到账</span><b>' +
    cny(paid.netC) +
    '</b><small>' +
    esc(rangeLabel('paid')) +
    '</small></div></div><p class="mc-eq">' +
    cny(paid.netC) +
    ' + ' +
    cny(wallet.netC) +
    ' = ' +
    cny(book.netC) +
    '</p><p class="mc-note">已到账与钱包余额之和为账本入账。</p><div class="mc-sheet mc-scroll"><table class="mc-table"><thead><tr><th>批次</th><th>状态</th><th class="mc-num">入账</th><th class="mc-num">绿电</th></tr></thead><tbody>' +
    rows +
    '</tbody><tfoot><tr><td colspan="2">账本合计</td><td class="mc-num">' +
    cny(book.netC) +
    '</td><td class="mc-num">' +
    fmtKwh(book.kwhC) +
    '</td></tr></tfoot></table></div><article class="mc-sheet mc-bank"><p class="mc-kicker">收款账户</p><p><b>' +
    esc(D.ACCOUNT.name) +
    '</b></p><p>' +
    esc(D.ACCOUNT.bank) +
    '</p><p class="mc-acct">' +
    esc(D.ACCOUNT.no) +
    '</p></article>'
  )
}

function rail() {
  const today = D.day(D.TODAY_YMD)
  const month = D.rangeSum('month')
  const wallet = D.rangeSum('wallet')
  const s = story(today)
  return (
    '<aside class="mc-rail" aria-label="汇总"><div class="mc-rs"><button class="mc-spend" type="button" data-span="month" data-go="#/ledger"><span><b>本月入账</b><span class="mc-big">' +
    cny(month.netC) +
    '</span><span class="mc-mut">' +
    esc(rangeLabel('month')) +
    '</span></span>' +
    chev() +
    '</button><button class="mc-row" type="button" data-go="#/settle"><i>' +
    icon('settle') +
    '</i><span><b>' +
    cnyPlain(wallet.netC) +
    '</b> 钱包</span>' +
    chev() +
    '</button><button class="mc-row" type="button" data-go="#/machines"><i>' +
    icon('machines') +
    '</i><span><b>' +
    D.nodeTotal +
    '</b> 台在线</span>' +
    chev() +
    '</button><button class="mc-row" type="button" data-go="#/machines"><i>' +
    icon('machines') +
    '</i><span><b>' +
    D.cardTotal +
    '</b> 张加速卡</span>' +
    chev() +
    '</button><button class="mc-row" type="button" data-go="#/power"><i>' +
    icon('power') +
    '</i><span><b>' +
    (today.kwhC / 100).toFixed(2) +
    '</b> kWh 今日</span>' +
    chev() +
    '</button></div><div class="mc-rs mc-stats-rail"><div><span>视频占入账</span><b>' +
    s.netShare +
    '</b><i class="mc-track is-video"><i style="width:' +
    s.netWidth +
    '%"></i></i></div><div><span>视频占输出 token</span><b>' +
    s.tokShare +
    '</b><i class="mc-track"><i style="width:' +
    s.tokWidth +
    '%"></i></i></div></div></aside>'
  )
}

let stationOpen = false

function stationPicker() {
  return (
    '<div class="mc-station-wrap"><button class="mc-station" type="button" data-station aria-expanded="' +
    stationOpen +
    '" aria-label="电站选择"><span><b>' +
    esc(D.STATION.region) +
    '</b><small>' +
    esc(D.STATION.name) +
    '</small></span>' +
    chev() +
    '</button>' +
    (stationOpen
      ? '<div class="mc-station-pop" role="dialog" aria-label="电站"><p class="mc-kicker">当前电站</p><button type="button" data-station aria-pressed="true"><b>' +
        esc(D.STATION.region) +
        '</b><span>' +
        esc(D.STATION.name) +
        '</span></button></div>'
      : '') +
    '</div>'
  )
}

function side(route) {
  const wallet = D.rangeSum('wallet')
  const items = [
    ['overview', '概览', 'overview'],
    ['machines', '我的机器', 'machines'],
    ['models', '模型产出', 'models'],
    ['centers', '全国智算中心', 'centers'],
  ]
  const books = [
    ['ledger', '统计对账', 'ledger'],
    ['power', '绿电账本', 'power'],
    ['settle', '结算', 'settle'],
  ]
  function buttons(list) {
    return list
      .map(function (item) {
        const on = route.page === item[0] ? ' aria-current="page"' : ''
        return (
          '<button type="button" data-go="#/' +
          item[0] +
          '"' +
          on +
          '>' +
          icon(item[2]) +
          esc(item[1]) +
          '</button>'
        )
      })
      .join('')
  }
  return (
    '<aside class="mc-side" aria-label="菜单"><div class="mc-org"><span class="mc-logo"><img src="assets/mark.svg" alt=""></span><span class="mc-orgn"><b>沐仞</b><small>商家管理后台</small></span></div>' +
    stationPicker() +
    '<nav class="mc-nav">' +
    buttons(items) +
    '</nav><span class="mc-rule"></span><div class="mc-grp">账本</div><nav class="mc-nav">' +
    buttons(books) +
    '</nav><div class="mc-foot"><button class="mc-credit" type="button" data-go="#/settle"><span>¥</span><span>钱包</span><b>' +
    cnyPlain(wallet.netC) +
    '</b></button><div class="mc-me"><i>' +
    esc(D.CUSTOMER.mark) +
    '</i><span>' +
    esc(D.CUSTOMER.name) +
    '<small>' +
    esc(D.CUSTOMER.role) +
    '</small></span></div><button class="mc-foot-link" type="button" data-logout>' +
    icon('out') +
    '退出</button></div></aside>'
  )
}

function pageCenters() {
  return '<iframe class="mc-center" title="全国智算中心" src="public/power-station/single.html"></iframe>'
}

function shell(route) {
  const fill = route.page === 'centers'
  const noRail = fill || route.page === 'ledger' || route.page === 'power'
  const main =
    route.page === 'machines'
      ? pageMachines(route)
      : route.page === 'models'
        ? pageModels()
        : route.page === 'ledger'
          ? pageLedger()
          : route.page === 'power'
            ? pagePower()
            : route.page === 'settle'
              ? pageSettle()
              : route.page === 'centers'
                ? pageCenters()
                : pageOverview()
  return (
    '<div class="mc' +
    (noRail ? ' no-rail' : '') +
    (fill ? ' is-center' : '') +
    '">' +
    side(route) +
    '<div class="mc-main"><main class="mc-pg">' +
    main +
    '</main></div>' +
    (noRail ? '' : rail()) +
    '</div>'
  )
}

function login() {
  return (
    '<main class="mc-login"><div class="mc-login-stage"><div class="mc-login-art"><img src="../web-refactor/public/art/engraved-ascent.webp" width="1024" height="1536" alt="人手与机械手相握的蚀刻画，远山为蓝紫。" draggable="false"></div><div class="mc-gate"><span class="mc-logo"><img src="assets/mark.svg" alt="沐仞"></span><p class="mc-kicker">沐仞</p><h1>商家管理后台</h1><label class="mc-field">用户名<input name="username" autocomplete="username" placeholder="请输入手机号"></label><label class="mc-field">密码<input name="password" type="password" autocomplete="current-password" placeholder="请输入密码"></label><button class="mc-go" type="button" data-enter>登陆</button></div></div></main>'
  )
}

function current() {
  const raw = (location.hash || '#/overview').replace(/^#\/?/, '')
  const bits = raw.split('/').filter(Boolean)
  const pages = ['overview', 'machines', 'models', 'centers', 'ledger', 'power', 'settle']
  const page = pages.indexOf(bits[0]) === -1 ? 'overview' : bits[0]
  return { page: page, id: bits[1] || '' }
}

function navigate(hash) {
  if (hash.indexOf('#/machines/') === 0) kind = 'all'
  if (location.hash === hash) render()
  else location.hash = hash
}

let entering = false

function enter() {
  if (entering || authed) return
  entering = true
  const go = document.querySelector('[data-enter]')
  if (go) {
    go.disabled = true
    go.textContent = '登陆中…'
    go.classList.add('is-wait')
  }
  window.setTimeout(function () {
    entering = false
    authed = true
    sessionStorage.setItem('mc-auth', '1')
    if (!location.hash || location.hash === '#/' || location.hash === '#') {
      location.hash = '#/overview'
      return
    }
    render()
  }, 1000)
}

function logout() {
  authed = false
  stationOpen = false
  sessionStorage.removeItem('mc-auth')
  lastPage = ''
  render()
}

const TITLES = {
  overview: '概览',
  machines: '我的机器',
  models: '模型产出',
  centers: '全国智算中心',
  ledger: '统计对账',
  power: '绿电账本',
  settle: '结算',
}

function render() {
  captureFleetForm()
  const route = current()
  const y = window.scrollY
  const same = authed && route.page === lastPage
  app.innerHTML = authed ? shell(route) : login()
  document.title = authed
    ? TITLES[route.page] + ' · ' + D.PRODUCT
    : '登陆 · ' + D.PRODUCT
  if (!authed) {
    lastPage = ''
    return
  }
  if (same) window.scrollTo(0, y)
  else window.scrollTo(0, 0)
  if (fleetFocus) {
    const focused = document.getElementById('node-' + fleetFocus)
    if (focused) focused.scrollIntoView({ block: 'center' })
    fleetFocus = ''
  } else if (route.page === 'machines' && route.id && !same) {
    const el = document.getElementById('node-' + route.id)
    if (el) el.scrollIntoView({ block: 'center' })
  }
  lastPage = route.page
}

function onClick(event) {
  const target = event.target.closest(
    '[data-enter],[data-logout],[data-span],[data-kind],[data-day],[data-go],[data-station],[data-fleet]'
  )
  const inStation = event.target.closest('[data-station], .mc-station-pop')
  const wasOpen = stationOpen
  if (stationOpen && !inStation) stationOpen = false
  if (!target) {
    if (wasOpen) render()
    return
  }
  if ('station' in target.dataset) {
    stationOpen = !stationOpen
    render()
    return
  }
  if ('enter' in target.dataset) {
    enter()
    return
  }
  if ('logout' in target.dataset) {
    logout()
    return
  }
  if ('fleet' in target.dataset) {
    const act = target.dataset.fleet
    const id = target.dataset.id || ''
    if (act === 'open') {
      fleetOpen = true
      fleetEdit = ''
      fleetDraft = blankFleet()
      fleetMsg = ''
      fleetConfirm = ''
      render()
      return
    }
    if (act === 'cancel') {
      fleetOpen = false
      fleetEdit = ''
      fleetMsg = ''
      fleetDraft = null
      render()
      return
    }
    if (act === 'edit') {
      const node = fleetRecord(id)
      if (!node) return
      fleetOpen = true
      fleetEdit = id
      fleetDraft = draftFromNode(node)
      fleetMsg = ''
      fleetConfirm = ''
      render()
      return
    }
    if (act === 'ask') {
      fleetConfirm = id
      render()
      return
    }
    if (act === 'keep') {
      fleetConfirm = ''
      render()
      return
    }
    if (act === 'drop') {
      dropFleet(id)
      return
    }
    return
  }
  if (target.dataset.span) ledgerSpan = target.dataset.span
  if (target.dataset.kind) kind = target.dataset.kind
  if (target.dataset.day) picked = target.dataset.day
  if (target.dataset.go) {
    stationOpen = false
    navigate(target.dataset.go)
    return
  }
  if (target.dataset.span || target.dataset.kind || target.dataset.day) render()
}

app.addEventListener('click', onClick)
app.addEventListener('submit', function (event) {
  if (!event.target.matches || !event.target.matches('[data-fleet-form]')) return
  event.preventDefault()
  saveFleetForm(event.target)
})
addEventListener('hashchange', render)
addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !authed) enter()
})
render()
