/* 深州电力在河北深州集中式光伏上的账本。系统名是沐仞商家管理后台。
   入账 = 输入 token × 输入实收价 + 输出 token × 输出实收价。
   平台服务费 = round(入账 × 18 / 82)，流水 = 入账 + 服务费，相当于流水的 18%。
   绿电 kWh = Σ 卡数 × 额定 kW × 当日平均负载 × 24。电量不从入账里扣。
   每天的负载按工作日形态、电站波动和单机抖动生成。token 与负载一起走，单价乘出来对得上入账。 */
;(function () {
  const TODAY = new Date(2026, 10, 11)
  const TODAY_YMD = '2026-11-11'
  const FEE_NUM = 18
  const FEE_DEN = 82

  const RANGES = {
    today: ['2026-11-11', '2026-11-11'],
    week: ['2026-11-05', '2026-11-11'],
    month: ['2026-11-01', '2026-11-11'],
    book: ['2026-10-01', '2026-11-11'],
    payoutToday: ['2026-11-02', '2026-11-08'],
    unpaid: ['2026-11-09', '2026-11-11'],
    wallet: ['2026-11-02', '2026-11-11'],
    paid: ['2026-10-01', '2026-11-01'],
  }

  const BANDS = [
    {
      id: 'earlier',
      from: '2026-10-01',
      to: '2026-10-25',
      label: '更早打款',
      detail: '10月1日–10月25日',
      state: '已打款',
    },
    {
      id: 'nov4',
      from: '2026-10-26',
      to: '2026-11-01',
      label: '11月4日已打出',
      detail: '10月26日–11月1日',
      state: '已打款',
    },
    {
      id: 'today',
      from: '2026-11-02',
      to: '2026-11-08',
      label: '本周在钱包',
      detail: '11月2日–11月8日',
      state: '钱包',
    },
    {
      id: 'closed',
      from: '2026-11-09',
      to: '2026-11-10',
      label: '已日结',
      detail: '11月9日–11月10日',
      state: '钱包',
    },
    {
      id: 'live',
      from: '2026-11-11',
      to: '2026-11-11',
      label: '今日计费',
      detail: '11月11日',
      state: '计费中',
    },
  ]

  /** 额定功率用来把电量和卡对上。inRate/outRate 单位是分 / 百万 token。 */
  const PRODUCT = '沐仞商家管理后台'
  const CUSTOMER = { name: '深州电力', mark: '深', role: '客户' }
  const STATION = { region: '河北深州', name: '河北深州集中式光伏' }
  const ACCOUNT = {
    bank: '招商银行',
    name: '深州电力',
    no: '7559 **** **** 2618',
    tail: '2618',
  }

  const GPUS = {
    r5090: { name: 'RTX 5090', short: '5090', vendor: 'NVIDIA', tdp: 575 },
    pro6000: { name: 'RTX PRO 6000', short: '6000', vendor: 'NVIDIA', tdp: 600 },
    pro6000d: {
      name: 'RTX PRO 6000D',
      short: '6000D',
      vendor: 'NVIDIA',
      tdp: 575,
    },
    h100: { name: 'H100 SXM', short: 'H100', vendor: 'NVIDIA', tdp: 700 },
    h200: { name: 'H200 SXM', short: 'H200', vendor: 'NVIDIA', tdp: 700 },
    b300: { name: 'B300', short: 'B300', vendor: 'NVIDIA', tdp: 1400 },
    a910c: { name: '昇腾 910C', short: '910C', vendor: '华为', tdp: 350 },
    c500: { name: '曦云 C500', short: 'C500', vendor: '沐曦', tdp: 350 },
  }

  const NODES = [
    {
      id: 'FP-ZJG-01',
      place: '深州 01',
      site: '河北深州集中式光伏',
      hall: 'A 栋 · A12',
      since: '2026-08-02',
      model: 'Qwen3-32B',
      kind: '对话',
      blurb: '开源对话，部署于 RTX 5090。',
      cards: [{ gpu: 'r5090', n: 8 }],
      util: 0.46,
      tokInPerCard: 12.8e6,
      tokOutPerCard: 4.48e6,
      inRate: 140,
      outRate: 480,
      callsPerCard: 1800,
    },
    {
      id: 'FP-ZJG-02',
      place: '深州 02',
      site: '河北深州集中式光伏',
      hall: 'A 栋 · A13',
      since: '2026-08-18',
      model: 'DeepSeek-V3',
      kind: '对话',
      blurb: '开源高速对话，PRO 6000 与 PRO 6000D 混部。',
      cards: [
        { gpu: 'pro6000', n: 4 },
        { gpu: 'pro6000d', n: 4 },
      ],
      util: 0.44,
      tokInPerCard: 25.6e6,
      tokOutPerCard: 10.4e6,
      inRate: 50,
      outRate: 200,
      callsPerCard: 6000,
    },
    {
      id: 'FP-ZJG-03',
      place: '深州 03',
      site: '河北深州集中式光伏',
      hall: 'B 栋 · B02',
      since: '2026-06-11',
      model: 'Qwen3-235B-A22B',
      kind: '对话',
      blurb: '开源长上下文对话，部署于 H100。',
      cards: [{ gpu: 'h100', n: 8 }],
      util: 0.49,
      tokInPerCard: 9.6e6,
      tokOutPerCard: 3.52e6,
      inRate: 180,
      outRate: 720,
      callsPerCard: 800,
    },
    {
      id: 'FP-ZJG-04',
      place: '深州 04',
      site: '河北深州集中式光伏',
      hall: 'B 栋 · B06',
      since: '2026-09-02',
      model: 'Wan2.2-14B',
      kind: '视频',
      blurb: '开源视频生成，部署于 H200。',
      cards: [{ gpu: 'h200', n: 8 }],
      util: 0.88,
      tokInPerCard: 0.224e6,
      tokOutPerCard: 1.36e6,
      inRate: 1200,
      outRate: 12000,
      callsPerCard: 160,
    },
    {
      id: 'FP-ZJG-05',
      place: '深州 05',
      site: '河北深州集中式光伏',
      hall: 'C 栋 · C01',
      since: '2026-10-20',
      model: 'Wan2.2-A14B',
      kind: '视频',
      blurb: '开源视频生成，部署于 B300。',
      cards: [{ gpu: 'b300', n: 8 }],
      util: 0.92,
      tokInPerCard: 0.224e6,
      tokOutPerCard: 1.52e6,
      inRate: 1400,
      outRate: 13000,
      callsPerCard: 140,
    },
    {
      id: 'FP-SZ-06',
      place: '深州 06',
      site: '河北深州集中式光伏',
      hall: '昇腾舱 · Q06',
      since: '2026-07-09',
      model: 'Qwen2.5-72B',
      kind: '对话',
      blurb: '开源对话，部署于昇腾 910C。',
      cards: [{ gpu: 'a910c', n: 8 }],
      util: 0.56,
      tokInPerCard: 8e6,
      tokOutPerCard: 3.2e6,
      inRate: 120,
      outRate: 480,
      callsPerCard: 1200,
    },
    {
      id: 'FP-SZ-07',
      place: '深州 07',
      site: '河北深州集中式光伏',
      hall: '沐曦舱 · Q08',
      since: '2026-09-28',
      model: 'Qwen3-8B',
      kind: '对话',
      blurb: '开源轻量对话，部署于曦云 C500。',
      cards: [{ gpu: 'c500', n: 8 }],
      util: 0.34,
      tokInPerCard: 19.2e6,
      tokOutPerCard: 8e6,
      inRate: 30,
      outRate: 120,
      callsPerCard: 5500,
    },
  ]

  function toYmd(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return date.getFullYear() + '-' + m + '-' + d
  }

  function addDays(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
  }

  function hash01(text) {
    let h = 2166136261
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return (h >>> 0) / 4294967296
  }

  function stationShape(date) {
    const dow = date.getDay()
    const shape = [0.866, 0.945, 0.987, 1, 0.976, 0.935, 0.882]
    const wobble = 0.988 + hash01('site|' + toYmd(date)) * 0.024
    return shape[dow] * wobble
  }

  function presence(node, ymd) {
    if (ymd < node.since) return 0
    if (node.id === 'FP-ZJG-05' && ymd === '2026-10-20') return 0.42
    if (node.id === 'FP-ZJG-05' && ymd === '2026-10-21') return 0.71
    if (node.id === 'FP-ZJG-05' && ymd === '2026-10-22') return 0.88
    if (node.id === 'FP-ZJG-03' && ymd === '2026-10-14') return 0.36
    return 1
  }

  function nodeScale(node, ymd, date) {
    const live = presence(node, ymd)
    if (live === 0) return 0
    const jitter = 0.985 + hash01(node.id + '|' + ymd) * 0.03
    return stationShape(date) * live * jitter
  }

  function tokenUnit(rate) {
    for (let step = 1; step <= 100; step++) {
      if ((step * rate) % 100 === 0) return step * 10000
    }
    return 1000000
  }

  function quantize(raw, rate) {
    const unit = tokenUnit(rate)
    const q = Math.round(raw / unit) * unit
    return q < unit ? unit : q
  }

  function fmtU(u) {
    const r = Math.round(u * 1e6) / 1e6
    const hundred = Math.round(r * 100)
    if (Math.abs(r * 100 - hundred) < 1e-4) return (hundred / 100).toFixed(2)
    return r.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  }

  function bandOf(ymd) {
    return BANDS.find(function (band) {
      return ymd >= band.from && ymd <= band.to
    })
  }

  function cardCount(node) {
    return node.cards.reduce(function (sum, card) {
      return sum + card.n
    }, 0)
  }

  function makeNodeDay(node, date, scale, utilOverride) {
    const ymd = toYmd(date)
    let util = utilOverride == null ? node.util * scale : utilOverride
    if (util > 0.96) util = 0.96
    const applied = util / node.util
    const cardsN = cardCount(node)
    const inMix = 0.986 + hash01(node.id + '|in|' + ymd) * 0.028
    const outMix = 0.986 + hash01(node.id + '|out|' + ymd) * 0.028
    const callMix = 0.94 + hash01(node.id + '|c|' + ymd) * 0.12
    const tokIn = quantize(node.tokInPerCard * cardsN * applied * inMix, node.inRate)
    const tokOut = quantize(node.tokOutPerCard * cardsN * applied * outMix, node.outRate)
    const calls = Math.max(1, Math.round(node.callsPerCard * cardsN * applied * callMix))
    const inC = Math.round((tokIn * node.inRate) / 1e6)
    const outC = Math.round((tokOut * node.outRate) / 1e6)
    const netC = inC + outC
    const feeC = Math.round((netC * FEE_NUM) / FEE_DEN)
    const grossC = netC + feeC
    const cards = node.cards.map(function (card) {
      const gpu = GPUS[card.gpu]
      return {
        n: card.n,
        id: card.gpu,
        name: gpu.name,
        short: gpu.short,
        vendor: gpu.vendor,
        tdp: gpu.tdp,
      }
    })
    let exactKwh = 0
    const formula = cards
      .map(function (card) {
        const part = card.n * (card.tdp / 1000) * util * 24
        exactKwh += part
        return card.n + ' × ' + (card.tdp / 1000).toFixed(3) + ' × ' + fmtU(util) + ' × 24'
      })
      .join(' + ')
    const kwhC = Math.round(exactKwh * 100)
    return {
      id: node.id,
      code: 'HSZ-' + String(NODES.indexOf(node) + 1).padStart(2, '0'),
      place: node.place,
      site: node.site,
      hall: node.hall,
      since: node.since,
      model: node.model,
      kind: node.kind,
      blurb: node.blurb,
      inRate: node.inRate,
      outRate: node.outRate,
      util: util,
      cards: cards,
      cardsN: cardsN,
      tokIn: tokIn,
      tokOut: tokOut,
      calls: calls,
      inC: inC,
      outC: outC,
      netC: netC,
      feeC: feeC,
      grossC: grossC,
      exactKwh: exactKwh,
      kwhC: kwhC,
      formula: formula,
      gpuText: cards
        .map(function (card) {
          return card.n + '× ' + card.name
        })
        .join(' + '),
    }
  }

  function makeDay(date) {
    const ymd = toYmd(date)
    const nodes = []
    let util5090 = null
    NODES.forEach(function (node) {
      const scale = nodeScale(node, ymd, date)
      if (scale <= 0) return
      let override = null
      if (node.id === 'FP-ZJG-02' && util5090 != null) {
        const eps = (hash01(node.id + '|pair|' + ymd) - 0.5) * 0.0012
        override = Math.min(0.96, util5090 * (0.575 / 0.6) * (1 + eps))
      }
      const row = makeNodeDay(node, date, scale, override)
      if (node.id === 'FP-ZJG-01') util5090 = row.util
      nodes.push(row)
    })
    const tot = nodes.reduce(
      function (sum, node) {
        sum.netC += node.netC
        sum.feeC += node.feeC
        sum.grossC += node.grossC
        sum.tokIn += node.tokIn
        sum.tokOut += node.tokOut
        sum.calls += node.calls
        sum.kwhC += node.kwhC
        sum.exactKwh += node.exactKwh
        return sum
      },
      {
        netC: 0,
        feeC: 0,
        grossC: 0,
        tokIn: 0,
        tokOut: 0,
        calls: 0,
        kwhC: 0,
        exactKwh: 0,
      }
    )
    return {
      date: date,
      ymd: ymd,
      dow: date.getDay(),
      nodes: nodes,
      band: bandOf(ymd),
      netC: tot.netC,
      feeC: tot.feeC,
      grossC: tot.grossC,
      tokIn: tot.tokIn,
      tokOut: tot.tokOut,
      calls: tot.calls,
      kwhC: tot.kwhC,
      exactKwh: tot.exactKwh,
    }
  }

  const DAYS = []
  for (let date = new Date(2026, 9, 1); date <= TODAY; date = addDays(date, 1)) {
    DAYS.push(makeDay(date))
  }

  function daysBetween(from, to) {
    return DAYS.filter(function (day) {
      return day.ymd >= from && day.ymd <= to
    })
  }

  function sumDays(list) {
    return list.reduce(
      function (sum, day) {
        sum.netC += day.netC
        sum.feeC += day.feeC
        sum.grossC += day.grossC
        sum.tokIn += day.tokIn
        sum.tokOut += day.tokOut
        sum.calls += day.calls
        sum.kwhC += day.kwhC
        sum.exactKwh += day.exactKwh
        return sum
      },
      {
        netC: 0,
        feeC: 0,
        grossC: 0,
        tokIn: 0,
        tokOut: 0,
        calls: 0,
        kwhC: 0,
        exactKwh: 0,
      }
    )
  }

  function day(ymd) {
    return DAYS.find(function (item) {
      return item.ymd === ymd
    })
  }

  function rangeSum(key) {
    const pair = RANGES[key]
    return sumDays(daysBetween(pair[0], pair[1]))
  }

  const cardTotal = NODES.reduce(function (sum, node) {
    return sum + cardCount(node)
  }, 0)

  function perCardKwh(gpuId, util) {
    return (GPUS[gpuId].tdp / 1000) * util * 24
  }

  function audit() {
    const problems = []
    const today = day(TODAY_YMD)
    if (DAYS.length !== 42) problems.push('天数应为 42，实际 ' + DAYS.length)
    if (cardTotal !== 56) problems.push('卡数应为 56')
    if (NODES.length !== 7) problems.push('机器应为 7 台')
    DAYS.forEach(function (item) {
      if (!item.band) problems.push(item.ymd + ' 没有账期')
      const hits = BANDS.filter(function (band) {
        return item.ymd >= band.from && item.ymd <= band.to
      })
      if (hits.length !== 1) problems.push(item.ymd + ' 账期不唯一')
      const net = item.nodes.reduce(function (sum, node) {
        return sum + node.netC
      }, 0)
      const fee = item.nodes.reduce(function (sum, node) {
        return sum + node.feeC
      }, 0)
      const kwh = item.nodes.reduce(function (sum, node) {
        return sum + node.kwhC
      }, 0)
      if (net !== item.netC || fee !== item.feeC || kwh !== item.kwhC) {
        problems.push(item.ymd + ' 合计对不上分机器')
      }
      item.nodes.forEach(function (node) {
        if (node.inC + node.outC !== node.netC) problems.push(node.id + ' 入账分项')
        if (node.netC + node.feeC !== node.grossC) problems.push(node.id + ' 流水')
      })
    })
    const bandSum = BANDS.reduce(function (sum, band) {
      return sum + sumDays(daysBetween(band.from, band.to)).netC
    }, 0)
    const bookSum = sumDays(DAYS).netC
    if (bandSum !== bookSum) problems.push('账期相加不等于账本')
    const settleParts =
      rangeSum('paid').netC + rangeSum('payoutToday').netC + rangeSum('unpaid').netC
    if (settleParts !== bookSum) problems.push('三段结算对不上账本')
    const wallet = rangeSum('wallet')
    if (wallet.netC !== rangeSum('payoutToday').netC + rangeSum('unpaid').netC) {
      problems.push('钱包不等于未到账')
    }
    if (rangeSum('paid').netC + wallet.netC !== bookSum) problems.push('已到账加钱包不等于账本')
    if (today.nodes.length !== 7) problems.push('今日应有 7 台')
    const beforeB300 = day('2026-10-19')
    const firstB300 = day('2026-10-20')
    if (!beforeB300 || beforeB300.nodes.length !== 6) problems.push('10月19日 B300 尚未上架')
    if (!firstB300 || firstB300.nodes.length !== 7) problems.push('10月20日 B300 应已上架')
    const hold = day('2026-10-14')
    const held = hold && hold.nodes.find(function (node) { return node.id === 'FP-ZJG-03' })
    if (!held || held.util > 0.25) problems.push('10月14日 H100 检修日负载过高')
    if (today.netC < 200000 || today.netC > 500000) {
      problems.push('今日入账偏离运营区间：' + today.netC)
    }
    if (today.calls > 180000) problems.push('今日调用过高 ' + today.calls)
    today.nodes.forEach(function (node) {
      if (node.netC > 200000) problems.push(node.id + ' 单日入账过高 ' + node.netC)
    })
    const n5090 = today.nodes.find(function (node) {
      return node.id === 'FP-ZJG-01'
    })
    const n6000 = today.nodes.find(function (node) {
      return node.id === 'FP-ZJG-02'
    })
    const n200 = today.nodes.find(function (node) {
      return node.id === 'FP-ZJG-04'
    })
    const p5090 = perCardKwh('r5090', n5090.util)
    const p6000 = perCardKwh('pro6000', n6000.util)
    const gap = Math.abs(p5090 - p6000) / p5090
    if (gap >= 0.002) problems.push('5090 与 PRO 6000 单卡电量差了 ' + gap)
    const times = n200.exactKwh / n5090.exactKwh
    if (times < 2.2 || times > 2.5) problems.push('H200/5090 电量倍数 ' + times)
    const video = today.nodes.filter(function (node) {
      return node.kind === '视频'
    })
    const vNet = video.reduce(function (sum, node) {
      return sum + node.netC
    }, 0)
    const vOut = video.reduce(function (sum, node) {
      return sum + node.tokOut
    }, 0)
    if (vNet / today.netC < 0.6) problems.push('视频入账占比过低')
    if (vOut / today.tokOut > 0.1) problems.push('视频 token 占比过高')
    DAYS.forEach(function (item) {
      item.nodes.forEach(function (node) {
        if (node.netC <= 0 || node.kwhC <= 0) problems.push(item.ymd + ' ' + node.id + ' 空账')
        const inYuan = Number((node.tokIn / 1e6).toFixed(2)) * (node.inRate / 100)
        const outYuan = Number((node.tokOut / 1e6).toFixed(2)) * (node.outRate / 100)
        if (Math.round(inYuan * 100) !== node.inC || Math.round(outYuan * 100) !== node.outC) {
          problems.push(item.ymd + ' ' + node.id + ' 单价乘出来对不上')
        }
        if ((node.tokIn * node.inRate) / 1e6 !== node.inC) {
          problems.push(item.ymd + ' ' + node.id + ' 输入 token 没有落在计价刻度上')
        }
      })
    })
    if (problems.length) {
      const error = new Error(problems.join('\n'))
      error.problems = problems
      throw error
    }
    return {
      todayNetC: today.netC,
      todayKwhC: today.kwhC,
      videoNetShare: vNet / today.netC,
      videoTokShare: vOut / today.tokOut,
      perCard: {
        r5090: p5090,
        pro6000: p6000,
        pro6000d: perCardKwh('pro6000d', n6000.util),
        h200: perCardKwh('h200', n200.util),
        b300: perCardKwh('b300', today.nodes.find(function (node) { return node.id === 'FP-ZJG-05' }).util),
      },
      h200Vs5090: times,
      weekNetC: rangeSum('week').netC,
      monthNetC: rangeSum('month').netC,
      payoutNetC: rangeSum('payoutToday').netC,
    }
  }

  globalThis.MerchantData = {
    PRODUCT: PRODUCT,
    CUSTOMER: CUSTOMER,
    STATION: STATION,
    ACCOUNT: ACCOUNT,
    TODAY: TODAY,
    TODAY_YMD: TODAY_YMD,
    RANGES: RANGES,
    BANDS: BANDS,
    GPUS: GPUS,
    NODES: NODES,
    DAYS: DAYS,
    cardTotal: cardTotal,
    nodeTotal: NODES.length,
    daysBetween: daysBetween,
    sumDays: sumDays,
    day: day,
    rangeSum: rangeSum,
    perCardKwh: perCardKwh,
    audit: audit,
  }

  if (typeof process !== 'undefined' && process.argv && process.argv.indexOf('--audit') !== -1) {
    console.log(JSON.stringify(audit(), null, 2))
  }
})()
