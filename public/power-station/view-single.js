        // ==============================
        // 视图 1：单体电站管理智能体
        // ==============================
        const SingleStationView = ({ selectedStationId, onSelectStation }) => {
            const selectedStation = localizeStation(STATION_CATALOG.find(s => s.id === selectedStationId) || STATION_CATALOG[0]);
            // 图表数据 (修正了盲目动态抖动的历史/固定基线数据)
            const lineDataPwr1 = [60,72,85,91,88,95,102,98,95,88,79,72];
            const lineDataPwr2 = [55,68,80,88,85,92,98,94,91,84,76,68];
            const lineDataEnv1 = [0,120,480,750,820,810,760,630,390,150,20,0]; // 辐照度
            const lineDataEnv2 = [22,24,32,41,45,46,44,40,35,28,24,22];       // 温度
            const barDataInv = useDynamicData([96.2,97.8,95.1,98.3,96.7,97.2,94.8,98.1], 1.5);
            const barDataIncome = [28500,31200,35800,42100,48600,52300,49800,44200];
            const lineDataNet1 = [820,910,880,950,920,870,840];
            const lineDataNet2 = [180,210,195,230,215,195,175];

            // 顶部与圆形指标数据
            const [topStats, setTopStats] = useState([
                { id: 'today', labelKey: 'single.metric.today', value: 12486.5, unit: 'kWh', isFloat: true },
                { id: 'power', labelKey: 'single.metric.power', value: 1248.3, unit: 'kW', isFloat: true },
                { id: 'cap', labelKey: 'single.metric.cap', value: 2000, unit: 'kWp', isFloat: false },
                { id: 'pr', labelKey: 'single.metric.pr', value: 82.6, unit: '%', isFloat: true },
                { id: 'total', labelKey: 'single.metric.total', value: 8562, unit: 'MWh', isFloat: false },
                { id: 'hours', labelKey: 'single.metric.hours', value: 4281, unit: 'h', isFloat: false }
            ]);
            
            const [subStats, setSubStats] = useState([
                { id: 'avail', labelKey: 'single.metric.avail', value: 99.2, unit: '%', isFloat: true },
                { id: 'month', labelKey: 'single.metric.month', value: 38520, unit: 'kWh', isFloat: false },
                { id: 'year', labelKey: 'single.metric.year', value: 312, unit: 'MWh', isFloat: false },
                { id: 'export', labelKey: 'single.metric.export', value: 9856, unit: 'kWh', isFloat: false },
                { id: 'self', labelKey: 'single.metric.self', value: 2630, unit: 'kWh', isFloat: false }
            ]);

            const [healthStats, setHealthStats] = useState([
                { id: 'inv', labelKey: 'single.health.inv', value: 95, color: '#0ea5e9' },
                { id: 'combiner', labelKey: 'single.health.combiner', value: 88, color: '#10b981' },
                { id: 'weather', labelKey: 'single.health.weather', value: 100, color: '#f59e0b' },
                { id: 'storage', labelKey: 'single.health.storage', value: 72, color: '#8b5cf6' }
            ]);

            useEffect(() => {
                const timer = setInterval(() => {
                    setTopStats(prev => prev.map(s => {
                        if(s.id === 'cap') return s;
                        return { ...s, value: Math.max(0, s.value + (s.isFloat ? (Math.random() * 1.5 - 0.75) : Math.floor(Math.random() * 5 - 2))) };
                    }));
                    setSubStats(prev => prev.map(s => ({ 
                        ...s, value: Math.max(0, s.value + (s.isFloat ? (Math.random() * 0.4 - 0.2) : Math.floor(Math.random() * 3 - 1))) 
                    })));
                    setHealthStats(prev => prev.map(s => ({
                        ...s, value: Math.max(60, Math.min(100, s.value + Math.floor(Math.random() * 3 - 1)))
                    })));
                }, 2500);
                return () => clearInterval(timer);
            }, []);

            const stringData = Array.from({ length: 10 }).map((_, i) => ({
                id: `STR-A${String(i+1).padStart(2, '0')}`,
                inv: `INV${(i%4)+1}`,
                current: (8.2 + Math.random()*1.4).toFixed(1),
                voltage: (580 + Math.random()*40).toFixed(0),
                power: (4700 + Math.random()*1100).toFixed(0),
                statusKey: i < 8 ? 'single.status.ok' : 'single.status.warn'
            }));

            return (
                <div className="flex-1 grid grid-cols-12 gap-4 h-full animate-fade-in min-h-0">
                    <div className="col-span-3 flex flex-col gap-4">
                        <TechCard title={tt('single.card.power')} className="flex-1 min-h-0">
                            <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#0ea5e9] rounded-full"></span>{tt('single.legend.powerLive')}</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#f97316] rounded-full"></span>{tt('single.legend.powerPred')}</span>
                            </div>
                            <div className="flex-1 mt-2"><MiniLineChart data1={lineDataPwr1} data2={lineDataPwr2} color1="#0ea5e9" color2="#f97316" xLabels={['00:00','06:00','12:00','18:00','24:00']} /></div>
                        </TechCard>
                        
                        <TechCard title={tt('single.card.env')} className="flex-1 min-h-0">
                            <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full"></span>{tt('single.legend.irr')}</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"></span>{tt('single.legend.temp')}</span>
                            </div>
                            <div className="flex-1 mt-2"><MiniLineChart data1={lineDataEnv1} data2={lineDataEnv2} dualAxis={true} color1="#eab308" color2="#f43f5e" xLabels={['00:00','06:00','12:00','18:00','24:00']} /></div>
                        </TechCard>

                        <TechCard title={tt('single.card.inv')} className="flex-1 min-h-0">
                            <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-400 rounded-full"></span>{tt('single.legend.eff')}</span>
                            </div>
                            <div className="flex-1 mt-2"><MiniBarChart data={barDataInv} yMax={100} xLabels={['INV1','INV2','INV3','INV4','INV5','INV6','INV7','INV8']} colorFrom="from-cyan-600" colorTo="to-cyan-300" /></div>
                        </TechCard>
                    </div>

                    <div className="col-span-6 flex flex-col gap-4">
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                            {STATION_CATALOG.map((st) => {
                                const loc = localizeStation(st);
                                const chip =
                                    (window.PagesI18n && PagesI18n.getLang() === 'en')
                                        ? (loc.city + ' · ' + loc.typeLabel)
                                        : loc.name;
                                return (
                                <button
                                    key={st.id}
                                    onClick={() => onSelectStation(st.id)}
                                    className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${selectedStation.id === st.id ? 'bg-cyan-600/80 border-cyan-400 text-white' : 'bg-[#07132b]/80 border-blue-800/50 text-slate-400 hover:text-cyan-200 hover:border-cyan-500/40'}`}
                                >
                                    {chip}
                                </button>
                                );
                            })}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                            <div className="grid grid-cols-6 gap-2">
                                {topStats.map((s) => (
                                <div key={s.id} className="bg-gradient-to-b from-blue-900/40 to-transparent border-t-2 border-cyan-400/80 rounded flex flex-col items-center py-2 relative overflow-hidden group">
                                    <div className="text-[11px] text-slate-300">{tt(s.labelKey)}</div>
                                    <div className="text-lg font-mono font-bold text-cyan-300 mt-1 transition-all duration-300">
                                    <AnimatedNumber value={s.value} isFloat={s.isFloat} /> <span className="text-[10px] text-cyan-600 ml-0.5">{s.unit}</span>
                                    </div>
                                    <div className="absolute bottom-0 w-full h-1 bg-cyan-400/20 transform translate-y-full group-hover:translate-y-0 transition-transform"></div>
                                </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-5 gap-2 mt-2">
                                {subStats.map((s) => (
                                <div key={s.id} className="flex flex-col items-center justify-center bg-[#07132b]/80 border border-blue-800/50 py-1.5 rounded-full">
                                    <div className="text-sm font-mono text-white font-bold transition-all duration-300">
                                        <AnimatedNumber value={s.value} isFloat={s.isFloat} /><span className="text-[10px] text-cyan-600 ml-0.5">{s.unit}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">{tt(s.labelKey)}</div>
                                </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-[5] min-h-0 relative overflow-hidden border border-blue-500/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#060d1f] to-[#060d1f]">
                            <SolarStationDiagram station={selectedStation} />
                        </div>

                        <TechCard title={tt('single.card.string')} className="flex-[3] min-h-0">
                            <div className="grid grid-cols-6 text-[10px] text-cyan-500 bg-blue-950/40 py-1.5 px-2 mb-1">
                                <div>{tt('single.col.stringId')}</div><div className="text-center">{tt('single.col.inv')}</div><div className="text-center">{tt('single.col.current')}</div>
                                <div className="text-center">{tt('single.col.voltage')}</div><div className="text-center">{tt('single.col.power')}</div><div className="text-right">{tt('single.col.status')}</div>
                            </div>
                            <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
                                <div className="absolute w-full animate-scroll-up">
                                {[...stringData, ...stringData].map((row, i) => (
                                    <div key={i} className="grid grid-cols-6 text-xs text-slate-300 py-2 border-b border-blue-900/30 hover:bg-blue-900/20 px-2 transition-colors">
                                        <div className="font-mono text-cyan-200">{row.id}</div>
                                        <div className="text-center font-mono">{row.inv}</div>
                                        <div className="text-center font-mono text-cyan-300">{row.current}</div>
                                        <div className="text-center font-mono text-blue-300">{row.voltage}</div>
                                        <div className="text-center font-mono text-yellow-300">{row.power}</div>
                                        <div className={`text-right font-bold ${row.statusKey === 'single.status.ok' ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>{tt(row.statusKey)}</div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </TechCard>
                    </div>

                    <div className="col-span-3 flex flex-col gap-4">
                        <TechCard title={tt('single.card.income')} className="flex-1 min-h-0">
                            <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span>{tt('single.legend.income')}</span>
                            </div>
                            <div className="flex-1 mt-2"><MiniBarChart data={barDataIncome} xLabels={[1,2,3,4,5,6,7,8].map(i => tt('month.'+i))} colorFrom="from-yellow-600" colorTo="to-yellow-300" /></div>
                        </TechCard>
                        
                        <TechCard title={tt('single.card.health')} className="flex-1 min-h-0">
                            <div className="grid grid-cols-2 gap-2 pt-2 h-full">
                                {healthStats.map((item) => (
                                    <div key={item.id} className="flex flex-col items-center justify-center">
                                        <CircleProgress percentage={item.value} label={tt(item.labelKey)} color={item.color} size={62} />
                                    </div>
                                ))}
                            </div>
                        </TechCard>
                        
                        <TechCard title={tt('single.card.grid')} className="flex-1 min-h-0">
                            <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#10b981] rounded-full"></span>{tt('single.legend.export')}</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#a855f7] rounded-full"></span>{tt('single.legend.self')}</span>
                            </div>
                            <div className="flex-1 mt-2"><MiniLineChart data1={lineDataNet1} data2={lineDataNet2} color1="#10b981" color2="#a855f7" xLabels={['mon','tue','wed','thu','fri','sat','sun'].map(d => tt('week.'+d))} dualAxis={true} /></div>
                        </TechCard>
                    </div>
                </div>
            );
        };

