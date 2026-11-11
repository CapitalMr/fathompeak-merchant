        // ==============================
        // 视图 3：算力集群管理智能体
        // ==============================
        const ComputeAgentView = ({ selectedStationId, onSelectStation }) => {
            const [nodes, setNodes] = useState(
                STATION_CATALOG.map((raw, i) => {
                    const st = localizeStation(raw);
                    return {
                    id: st.id,
                    city: st.city,
                    name: st.name,
                    typeLabel: st.typeLabel,
                    usage: Math.max(15, 98 - i * 7.5),
                    cpu: 105624 - i * 1800,
                    task: 107534 - i * 2100,
                    queue: Math.max(20, 102 - i * 6),
                };
                })
            );

            const [overviewStats, setOverviewStats] = useState([
                { id: 'general', nameKey: 'compute.overview.general', cpu: 65, mem: 82, gpu: 98, color: '#3b82f6' },
                { id: 'super', nameKey: 'compute.overview.super', cpu: 88, mem: 79, gpu: 64, color: '#0ea5e9' },
                { id: 'intelligent', nameKey: 'compute.overview.intelligent', cpu: 99, mem: 72, gpu: 75, color: '#8b5cf6' },
                { id: 'edge', nameKey: 'compute.overview.edge', cpu: 61, mem: 73, gpu: 89, color: '#10b981' },
            ]);

            const [alarms, setAlarms] = useState({ total: 164, fixed: 164 });
            const [mapArcs, setMapArcs] = useState([]);

            const [topStats, setTopStats] = useState([
                { id: 'cores', labelKey: 'compute.stat.cores', val: 3008626 },
                { id: 'gpu', labelKey: 'compute.stat.gpu', val: 30218 },
                { id: 'nodes', labelKey: 'compute.stat.nodes', val: 503256 },
                { id: 'tasks', labelKey: 'compute.stat.tasks', val: 9032325 },
            ]);

            const [taskStats, setTaskStats] = useState([
                { id: 'general', titleKey: 'compute.task.general', val: 382 },
                { id: 'super', titleKey: 'compute.task.super', val: 857 },
                { id: 'edge', titleKey: 'compute.task.edge', val: 1054 },
                { id: 'intelligent', titleKey: 'compute.task.intelligent', val: 577 },
            ]);

            const [networkCenter, setNetworkCenter] = useState({
                totalInvocations: 231770767, platformCap: 284, appCap: 127,
                hexNodes: { A: 118, B: 18, C: 530, D: 219, E: 146, N: 327, S: 308, T: 28 }
            });

            const [hoveredComputeNode, setHoveredComputeNode] = useState(null);
            const [computeMapNodes, setComputeMapNodes] = useState(
                STATION_CATALOG.map((st, i) => {
                    const style = stationTypeStyle(st.type);
                    return {
                        id: st.id,
                        name: localizeStation(st).name,
                        city: localizeStation(st).city,
                        type: st.type,
                        typeLabel: localizeStation(st).typeLabel,
                        x: st.geoX,
                        y: st.geoY,
                        power: Math.round(st.cap * 42 + i * 60),
                        tasks: Math.round(st.power * 900 + i * 800),
                        statusKey: st.status === 'warning' ? 'compute.status.highLoad' : style.statusKey,
                    };
                })
            );

            useEffect(() => {
                const timer = setInterval(() => {
                setTopStats(prev => prev.map(s => ({ ...s, val: s.val + Math.floor(Math.random() * 30) })));
                setOverviewStats(prev => prev.map(s => ({ ...s, cpu: Math.max(0, Math.min(100, s.cpu + Math.floor(Math.random() * 5 - 2))), mem: Math.max(0, Math.min(100, s.mem + Math.floor(Math.random() * 5 - 2))) })));
                setNodes(prev => prev.map(n => ({
                    ...n, usage: Math.max(0, Math.min(100, n.usage + (Math.random() * 2 - 1))),
                    cpu: Math.max(0, n.cpu + Math.floor(Math.random() * 100 - 50)),
                    task: Math.max(0, n.task + Math.floor(Math.random() * 50 - 20)), queue: Math.max(0, n.queue + Math.floor(Math.random() * 10 - 5))
                })));
                setAlarms(prev => {
                    let newTotal = prev.total; let newFixed = prev.fixed;
                    if (Math.random() > 0.7) { newTotal += 1; newFixed += (Math.random() > 0.5 ? 1 : 0); }
                    if (newFixed < newTotal && Math.random() > 0.5) newFixed += 1;
                    return { total: newTotal, fixed: newFixed };
                });
                setNetworkCenter(prev => ({
                    totalInvocations: prev.totalInvocations + Math.floor(Math.random() * 1000 + 200),
                    platformCap: Math.max(0, prev.platformCap + Math.floor(Math.random() * 5 - 2)),
                    appCap: Math.max(0, prev.appCap + Math.floor(Math.random() * 5 - 2)),
                    hexNodes: {
                    A: Math.max(0, prev.hexNodes.A + Math.floor(Math.random() * 5 - 2)), B: Math.max(0, prev.hexNodes.B + Math.floor(Math.random() * 3 - 1)),
                    C: Math.max(0, prev.hexNodes.C + Math.floor(Math.random() * 10 - 4)), D: Math.max(0, prev.hexNodes.D + Math.floor(Math.random() * 5 - 2)),
                    E: Math.max(0, prev.hexNodes.E + Math.floor(Math.random() * 5 - 2)), N: Math.max(0, prev.hexNodes.N + Math.floor(Math.random() * 8 - 3)),
                    S: Math.max(0, prev.hexNodes.S + Math.floor(Math.random() * 8 - 3)), T: Math.max(0, prev.hexNodes.T + Math.floor(Math.random() * 3 - 1))
                    }
                }));
                setTaskStats(prev => prev.map(t => ({ ...t, val: t.val + Math.floor(Math.random() * 8) })));
                setComputeMapNodes(prev => prev.map(n => ({
                    ...n,
                    power: Math.max(0, n.power + Math.floor(Math.random() * 50 - 25)),
                    tasks: Math.max(0, n.tasks + Math.floor(Math.random() * 200 - 50))
                })));
                }, 2000);
                return () => clearInterval(timer);
            }, []);

            const topIcons = {
                cores: <Cpu className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />, gpu: <Layers className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />,
                nodes: <Server className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />, tasks: <Database className="w-5 h-5 lg:w-6 lg:h-6 text-teal-400" />
            };

            const appTiles = [
                { nameKey: 'compute.app.aiFilm', color: 'from-blue-600 to-cyan-400' },
                { nameKey: 'compute.app.companion', color: 'from-green-600 to-emerald-400' },
                { nameKey: 'compute.app.ai4s', color: 'from-purple-600 to-pink-400' },
                { nameKey: 'compute.app.moderation', color: 'from-orange-600 to-yellow-400' },
            ];

            useEffect(() => {
                const generateArc = () => {
                    const start = STATION_CATALOG[Math.floor(Math.random() * STATION_CATALOG.length)];
                    let end = STATION_CATALOG[Math.floor(Math.random() * STATION_CATALOG.length)];
                    if (end.id === start.id) {
                        end = STATION_CATALOG[(STATION_CATALOG.indexOf(start) + 1) % STATION_CATALOG.length];
                    }
                    const cx = (start.geoX + end.geoX) / 2 + (Math.random() * 6 - 3);
                    const cy = Math.min(start.geoY, end.geoY) - 8 - Math.random() * 5;
                    return { id: Math.random(), d: `M ${start.geoX} ${start.geoY} Q ${cx} ${cy} ${end.geoX} ${end.geoY}` };
                };
                const interval = setInterval(() => setMapArcs(prev => [...prev, generateArc()].slice(-6)), 1500);
                return () => clearInterval(interval);
            }, []);

            return (
                <div className="flex-1 grid grid-cols-12 gap-4 h-full animate-fade-in min-h-0">
                <div className="col-span-3 flex flex-col gap-4">
                    <TechCard title={tt('compute.card.overview')} className="flex-[4] min-h-0">
                    <div className="grid grid-cols-2 gap-4 h-full pt-2">
                        {overviewStats.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <CircleProgress percentage={item.cpu} label={tt(item.nameKey)} color={item.color} size={65} />
                            <div className="flex flex-col text-[10px] gap-1 justify-center w-full">
                            <div className="flex justify-between text-slate-400"><span>{tt('compute.cpu')}</span><span className="text-cyan-300"><AnimatedNumber value={item.cpu} isFloat={false} />%</span></div>
                            <div className="w-full h-1 bg-blue-950 rounded"><div className="h-full bg-cyan-500 rounded transition-all duration-1000" style={{ width: `${item.cpu}%`}}></div></div>
                            <div className="flex justify-between text-slate-400 mt-1"><span>{tt('compute.mem')}</span><span className="text-cyan-300"><AnimatedNumber value={item.mem} isFloat={false} />%</span></div>
                            <div className="w-full h-1 bg-blue-950 rounded"><div className="h-full bg-blue-400 rounded transition-all duration-1000" style={{ width: `${item.mem}%`}}></div></div>
                            </div>
                        </div>
                        ))}
                    </div>
                    </TechCard>

                    <TechCard title={tt('compute.card.nodes')} className="flex-[4] min-h-0">
                    <div className="grid grid-cols-3 gap-2 h-full overflow-auto glass-scroll pt-1">
                        {nodes.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => onSelectStation && onSelectStation(n.id)}
                            className={`flex flex-col items-center justify-center min-w-0 rounded border p-1.5 text-left transition-colors ${selectedStationId === n.id ? 'border-cyan-400 bg-cyan-900/30' : 'border-blue-900/50 bg-blue-950/40 hover:border-cyan-500/40'}`}
                        >
                            <div className="text-[10px] text-cyan-400 truncate w-full text-center">{n.typeLabel}</div>
                            <div className="text-xs font-bold text-white truncate w-full text-center">{n.city}</div>
                            <div className="text-[11px] font-mono text-cyan-300 mt-0.5"><AnimatedNumber value={n.usage} isFloat={true} />%</div>
                        </button>
                        ))}
                    </div>
                    </TechCard>

                    <TechCard title={tt('compute.card.alarm')} className="flex-[2] min-h-0">
                    <div className="flex justify-between items-center h-full px-2 lg:px-4 gap-2">
                        <div className="bg-red-950/30 border border-red-500/30 p-2 rounded flex flex-col items-center flex-1 min-w-0">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> {tt('compute.alarm.total')}</div>
                            <div className="text-lg lg:text-xl font-mono text-red-400 font-bold flex items-baseline whitespace-nowrap">
                                <AnimatedNumber value={alarms.total} isFloat={false} /><span className="text-xs ml-1 text-red-600">{tt('compute.alarm.unit')}</span>
                            </div>
                        </div>
                        <div className="bg-green-950/30 border border-green-500/30 p-2 rounded flex flex-col items-center flex-1 min-w-0">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {tt('compute.alarm.fixed')}</div>
                            <div className="text-sm lg:text-base font-mono text-green-400 font-bold flex items-center gap-1 whitespace-nowrap">
                                <AnimatedNumber value={alarms.fixed} isFloat={false} /> / <AnimatedNumber value={Math.floor((alarms.fixed/alarms.total)*100)} isFloat={false} />%
                            </div>
                        </div>
                    </div>
                    </TechCard>
                </div>

                <div className="col-span-6 flex flex-col relative bg-transparent">
                    <div className="grid grid-cols-4 gap-2 lg:gap-4 mb-4 absolute top-0 left-0 w-full z-10 px-2 lg:px-4">
                    {topStats.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 lg:gap-3 bg-[#0a1530]/80 border border-blue-500/40 p-1.5 lg:p-2 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="p-1.5 bg-blue-950 rounded-lg border border-blue-800/50 shrink-0">{topIcons[s.id]}</div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-slate-400 bg-blue-900/40 px-1 rounded inline-block mb-1 truncate max-w-full">{tt(s.labelKey)}</div>
                            <div className="text-sm lg:text-base font-mono font-bold text-white truncate" title={s.val}>
                            <AnimatedNumber value={s.val} isFloat={false} compact={true} />
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>

                    <div className="flex-1 w-full relative mt-16 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                    <div className="relative w-[90%] h-[85%]">
                        <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" /><stop offset="50%" stopColor="#22d3ee" stopOpacity="1" /><stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>
                            <text x="50" y="8" textAnchor="middle" fill="#64748b" fontSize="3.2" letterSpacing="1.2">{tt('compute.map.title')}</text>
                            <text x="48" y="14" fill="rgba(34,211,238,0.35)" fontSize="3.2" fontWeight="bold">{tt('compute.map.jjj')}</text>
                            <text x="12" y="24" fill="rgba(96,165,250,0.45)" fontSize="3.2" fontWeight="bold">{tt('compute.map.xj')}</text>
                            <text x="74" y="42" fill="rgba(96,165,250,0.4)" fontSize="3.2" fontWeight="bold">{tt('compute.map.js')}</text>
                            <text x="40" y="62" fill="rgba(52,211,153,0.4)" fontSize="3.2" fontWeight="bold">{tt('compute.map.jx')}</text>
                            <text x="70" y="90" fill="rgba(251,191,36,0.45)" fontSize="3.2" fontWeight="bold">{tt('compute.map.gd')}</text>
                            {mapArcs.map(arc => <path key={arc.id} d={arc.d} fill="none" stroke="url(#arcGrad)" strokeWidth="0.6" className="animate-[dash_2s_ease-out_forwards]" strokeDasharray="100" strokeDashoffset="100" />)}
                        </svg>

                        {computeMapNodes.map((node, i) => {
                            const style = stationTypeStyle(node.type) || stationTypeStyle('distributed-pv');
                            const isSelected = selectedStationId === node.id;
                            const isHot = isSelected || hoveredComputeNode === node.id;
                            const statusColor = node.statusKey === 'compute.status.highLoad' ? 'text-yellow-400' : (node.type === 'hydro' || node.type === 'wind' || node.type === 'offshore-wind' ? 'text-green-400' : 'text-cyan-300');
                            
                            return (
                            <div 
                                key={node.id} 
                                className={`absolute flex flex-col items-center cursor-pointer group ${isHot ? 'z-50' : 'z-10'}`} 
                                style={{ top: `${node.y}%`, left: `${node.x}%`, transform: 'translate(-50%, -50%)' }}
                                onMouseEnter={() => setHoveredComputeNode(node.id)}
                                onMouseLeave={() => setHoveredComputeNode(null)}
                                onClick={() => onSelectStation && onSelectStation(node.id)}
                            >
                                <div className={`w-2.5 h-2.5 ${style.dot} rounded-full ${style.shadow} group-hover:scale-150 transition-transform ${isSelected ? 'scale-150 ring-2 ring-white/80' : 'animate-pulse'}`} style={{ animationDelay: `${i * 0.2}s`}}></div>
                                <div className={`mt-1 px-1.5 py-0.5 bg-blue-950/90 border ${isSelected ? 'border-white/70 bg-blue-800' : style.border} text-cyan-100 text-[9px] rounded-full whitespace-nowrap group-hover:bg-blue-800 transition-colors`}>
                                    {node.city}·{node.typeLabel}
                                </div>
                                {hoveredComputeNode === node.id && (
                                    <div className={`absolute ${node.y > 60 ? 'bottom-full mb-2' : 'top-full mt-2'} ${node.x < 30 ? 'left-0' : node.x > 70 ? 'right-0' : 'left-1/2 transform -translate-x-1/2'} bg-[#0a1530]/95 border border-blue-500/50 p-3 rounded shadow-[0_0_20px_rgba(34,211,238,0.3)] text-xs z-50 whitespace-nowrap backdrop-blur-md min-w-[160px] pointer-events-none`}>
                                        <div className="text-cyan-300 font-bold mb-1.5 border-b border-blue-900/80 pb-1.5 flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 ${style.dot} rounded-full`}></div>
                                            {node.name}
                                        </div>
                                        <div className="flex justify-between items-center gap-4 mt-1">
                                            <span className="text-slate-400">{tt('compute.label.type')}</span>
                                            <span className="text-cyan-100">{node.typeLabel}</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-4 mt-1.5">
                                            <span className="text-slate-400">{tt('compute.label.power')}</span> 
                                            <span className="text-cyan-50 font-mono font-bold"><AnimatedNumber value={node.power} isFloat={false} compact={true}/> PFlops</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-4 mt-1.5">
                                            <span className="text-slate-400">{tt('compute.label.tasks')}</span> 
                                            <span className="text-teal-400 font-mono font-bold"><AnimatedNumber value={node.tasks} isFloat={false} compact={true}/></span>
                                        </div>
                                        <div className="flex justify-between items-center gap-4 mt-1.5">
                                            <span className="text-slate-400">{tt('compute.label.status')}</span> 
                                            <span className={statusColor}>{tt(node.statusKey)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                    </div>

                    <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-[10px] text-slate-400 bg-[#060d1f]/80 p-2 rounded border border-blue-900/50 z-20">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> {tt('compute.legend.dist')}</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {tt('compute.legend.cent')}</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> {tt('compute.legend.hydro')}</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> {tt('compute.legend.wind')}</div>
                    </div>
                </div>

                <div className="col-span-3 flex flex-col gap-4">
                    <TechCard title={tt('compute.card.tasks')} className="flex-[3] min-h-0">
                    <div className="grid grid-cols-2 gap-3 h-full pt-2">
                        {taskStats.map((item, i) => {
                        const icons = [ <Server className="w-5 h-5 text-blue-400" />, <ZapIcon className="w-5 h-5 text-cyan-400" />, <Navigation className="w-5 h-5 text-indigo-400" />, <Cpu className="w-5 h-5 text-teal-400" /> ];
                        return (
                            <div key={item.id} className="bg-gradient-to-r from-blue-900/40 to-transparent border border-blue-800/50 p-2 flex items-center gap-3 rounded hover:border-cyan-500/50 transition-colors cursor-pointer group">
                                <div className="p-1.5 bg-blue-500/20 rounded group-hover:bg-cyan-500/20 transition-colors">{icons[i % icons.length]}</div>
                                <div>
                                <div className="text-[10px] text-slate-300">{tt(item.titleKey)}</div>
                                <div className="text-sm font-bold text-cyan-50 font-mono mt-0.5"><AnimatedNumber value={item.val} isFloat={false} /><span className="text-xs ml-0.5 font-sans">{tt('compute.alarm.unit')}</span></div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                    </TechCard>

                    <TechCard title={tt('compute.card.net')} className="flex-[5] min-h-0">
                    <div className="flex justify-between items-center bg-blue-950/40 p-2 rounded border border-blue-900/50 mb-4">
                        <span className="text-xs text-slate-300">{tt('compute.invocations')}</span>
                        <span className="text-lg font-mono font-bold text-cyan-300"><AnimatedNumber value={networkCenter.totalInvocations} isFloat={false} /></span>
                    </div>
                    
                    <div className="flex-1 relative flex items-center justify-center">
                        <div className="absolute w-20 h-24 bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cG9seWdvbiBwb2ludHM9IjUwLDUgOTUsMjcgOTUsNzMgNTAsOTUgNSw3MyA1LDI3IiBmaWxsPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjIpIiBzdHJva2U9IiMwZWE1ZTkiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')] bg-center bg-contain bg-no-repeat flex items-center justify-center drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <Hexagon className="w-8 h-8 text-cyan-300 animate-pulse" />
                        </div>
                        <div className="absolute top-[5%] left-[2%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">A</span> {tt('compute.hex.A')} <AnimatedNumber value={networkCenter.hexNodes.A} isFloat={false} /></div>
                        <div className="absolute top-[35%] left-[0%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">B</span> {tt('compute.hex.B')} <AnimatedNumber value={networkCenter.hexNodes.B} isFloat={false} /></div>
                        <div className="absolute top-[65%] left-[0%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">C</span> {tt('compute.hex.C')} <AnimatedNumber value={networkCenter.hexNodes.C} isFloat={false} /></div>
                        <div className="absolute top-[90%] left-[8%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">D</span> {tt('compute.hex.D')} <AnimatedNumber value={networkCenter.hexNodes.D} isFloat={false} /></div>
                        <div className="absolute top-[5%] right-[2%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">E</span> {tt('compute.hex.E')} <AnimatedNumber value={networkCenter.hexNodes.E} isFloat={false} /></div>
                        <div className="absolute top-[35%] right-[0%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">N</span> {tt('compute.hex.N')} <AnimatedNumber value={networkCenter.hexNodes.N} isFloat={false} /></div>
                        <div className="absolute top-[65%] right-[0%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">S</span> {tt('compute.hex.S')} <AnimatedNumber value={networkCenter.hexNodes.S} isFloat={false} /></div>
                        <div className="absolute top-[90%] right-[8%] text-[9px] flex items-center gap-1 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/30 z-10"><span className="text-blue-400">T</span> {tt('compute.hex.T')} <AnimatedNumber value={networkCenter.hexNodes.T} isFloat={false} /></div>
                    </div>

                    <div className="flex justify-between mt-2 gap-2">
                        <div className="flex-1 bg-blue-950/60 border border-blue-800/50 p-1.5 text-center text-xs flex justify-between px-4">
                        <span className="text-slate-400">{tt('compute.platformCap')}</span><span className="text-cyan-300 font-bold"><AnimatedNumber value={networkCenter.platformCap} isFloat={false} /></span>
                        </div>
                        <div className="flex-1 bg-blue-950/60 border border-blue-800/50 p-1.5 text-center text-xs flex justify-between px-4">
                        <span className="text-slate-400">{tt('compute.appCap')}</span><span className="text-cyan-300 font-bold"><AnimatedNumber value={networkCenter.appCap} isFloat={false} /></span>
                        </div>
                    </div>
                    </TechCard>

                    <TechCard title={tt('compute.card.apps')} className="flex-[3] min-h-0">
                    <div className="grid grid-cols-2 gap-4 h-full pt-2">
                        {appTiles.map((app) => (
                            <div key={app.nameKey} className="flex flex-col items-center justify-center bg-[#07132b] border border-blue-900/50 rounded-lg hover:border-cyan-500/50 transition-all cursor-pointer group overflow-hidden relative">
                            <div className="absolute bottom-0 w-[60%] h-1.5 rounded-full blur-md bg-white opacity-20 group-hover:opacity-50 transition-opacity"></div>
                            <div className={`w-14 h-6 rounded-[50%] bg-gradient-to-r ${app.color} opacity-20 mt-4 group-hover:opacity-40 transition-opacity transform group-hover:scale-110`}></div>
                            <div className="absolute mt-2 text-xs font-bold text-slate-200 group-hover:text-white z-10">{tt(app.nameKey)}</div>
                            </div>
                        ))}
                    </div>
                    </TechCard>
                </div>
                </div>
            );
        };
