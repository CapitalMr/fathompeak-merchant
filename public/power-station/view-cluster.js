        // ==============================
        // 视图 2：电力资源管理智能体
        // ==============================
        const PowerAgentView = ({ selectedStationId, onSelectStation }) => {
            const lineData1 = useDynamicData([40, 50, 45, 60, 80, 75, 90, 85, 95, 80, 70, 75], 5);
            // 碳排放量数据量级远超新能源出力，启用双Y轴必须配置正确的现实数据结构
            const lineData2 = useDynamicData([2800, 3200, 2950, 3600, 4200, 3900, 4500, 4250, 4800, 4000, 3500, 3750], 150);
            const barData = useDynamicData([60, 80, 45, 90, 75, 50, 85, 60], 5);

            const [topStats, setTopStats] = useState([
                { id: 'greenUse', labelKey: 'cluster.stat.greenUse', value: 6815.2, unit: 'MW', isFloat: true },
                { id: 'greenRatio', labelKey: 'cluster.stat.greenRatio', value: 78.31, unit: '%', isFloat: true },
                { id: 'greenMatch', labelKey: 'cluster.stat.greenMatch', value: 42.36, unit: '%', isFloat: true },
                { id: 'loadMatch', labelKey: 'cluster.stat.loadMatch', value: 55.05, unit: '%', isFloat: true },
                { id: 'computeDispatch', labelKey: 'cluster.stat.computeDispatch', value: 312, unit: '', isFloat: false },
                { id: 'computeUsage', labelKey: 'cluster.stat.computeUsage', value: 34.19, unit: '%', isFloat: true },
            ]);

            const [subStats, setSubStats] = useState([
                { id: 'balance', labelKey: 'cluster.stat.balance', value: 93.55, unit: '%', isFloat: true },
                { id: 'priorityJobs', labelKey: 'cluster.stat.priorityJobs', value: 13, unit: '', isFloat: false },
                { id: 'jobRate', labelKey: 'cluster.stat.jobRate', value: 100, unit: '%', isFloat: false },
                { id: 'nodeDispatch', labelKey: 'cluster.stat.nodeDispatch', value: 341, unit: '', isFloat: false },
                { id: 'carbon', labelKey: 'cluster.stat.carbon', value: 5124, unit: '', isFloat: false },
            ]);

            const [responsiveness, setResponsiveness] = useState({ center: 45.22, left: 25.21, right: 52.20 });

            useEffect(() => {
                const timer = setInterval(() => {
                setTopStats(prev => prev.map(s => ({ ...s, value: Math.max(0, s.value + (s.isFloat ? (Math.random() * 1.5 - 0.75) : Math.floor(Math.random() * 5 - 2))) })));
                setSubStats(prev => prev.map(s => s.id === 'jobRate' ? s : { ...s, value: Math.max(0, s.value + (s.isFloat ? (Math.random() * 1 - 0.5) : Math.floor(Math.random() * 3 - 1))) }));
                setResponsiveness(prev => ({
                    center: Math.max(0, Math.min(100, prev.center + (Math.random() * 2 - 1))),
                    left: Math.max(0, Math.min(100, prev.left + (Math.random() * 1.5 - 0.75))),
                    right: Math.max(0, Math.min(100, prev.right + (Math.random() * 1.5 - 0.75)))
                }));
                }, 2500);
                return () => clearInterval(timer);
            }, []);

            const tableData = Array.from({ length: 10 }).map((_, i) => ({ id: i, nameKey: 'cluster.task.n', nameN: i + 1, space: 213 + i*5, task: 341 - i*2, node: 153 + i*3, res: 123 + i }));

            return (
                <div className="flex-1 grid grid-cols-12 gap-4 h-full animate-fade-in min-h-0">
                <div className="col-span-3 flex flex-col gap-4">
                    <TechCard title={tt('cluster.card.energy')} className="flex-1 min-h-0">
                    <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#0ea5e9] rounded-full"></span>{tt('cluster.legend.centerA')}</span>
                    </div>
                    <div className="flex-1 mt-2"><MiniLineChart data1={lineData1} color1="#0ea5e9" /></div>
                    </TechCard>
                    
                    <TechCard title={tt('cluster.card.dual')} className="flex-1 min-h-0">
                    <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{tt('cluster.legend.renew')}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full"></span>{tt('cluster.legend.carbon')}</span>
                    </div>
                    <div className="flex-1 mt-2"><MiniLineChart data1={lineData1} data2={lineData2} color1="#10b981" color2="#f97316" dualAxis={true} yMax1={120} yMax2={6000} /></div>
                    </TechCard>

                    <TechCard title={tt('cluster.card.resp')} className="flex-1 min-h-0 flex flex-col">
                    <div className="relative flex flex-col justify-center items-center w-full h-full">
                        <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyan-900/20 shadow-[0_0_20px_rgba(6,182,212,0.2)] my-auto shrink-0">
                            <div className="text-2xl lg:text-3xl font-bold text-cyan-300">
                            <AnimatedNumber value={responsiveness.center} isFloat={true} /><span className="text-sm lg:text-base">%</span>
                            </div>
                        </div>
                        <div className="w-full flex justify-between px-2 pb-1 mt-auto shrink-0">
                            <div className="text-center">
                            <div className="text-cyan-400 text-xs lg:text-sm font-bold"><AnimatedNumber value={responsiveness.left} isFloat={true} />%</div>
                            <div className="text-[10px] text-slate-400">{tt('cluster.resp.a')}</div>
                            </div>
                            <div className="text-center">
                            <div className="text-cyan-400 text-xs lg:text-sm font-bold"><AnimatedNumber value={responsiveness.right} isFloat={true} />%</div>
                            <div className="text-[10px] text-slate-400">{tt('cluster.resp.b')}</div>
                            </div>
                        </div>
                    </div>
                    </TechCard>
                </div>

                <div className="col-span-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-2 shrink-0">
                    <div className="grid grid-cols-6 gap-2">
                        {topStats.map((s) => (
                        <div key={s.id} className="bg-gradient-to-b from-blue-900/40 to-transparent border-t-2 border-cyan-400/80 rounded flex flex-col items-center py-2 relative overflow-hidden group">
                            <div className="text-[11px] text-slate-300">{tt(s.labelKey)}</div>
                            <div className="text-lg font-mono font-bold text-cyan-300 mt-1 transition-all duration-300">
                            <AnimatedNumber value={s.value} isFloat={s.isFloat} /> <span className="text-[10px] text-cyan-600">{s.unit}</span>
                            </div>
                            <div className="absolute bottom-0 w-full h-1 bg-cyan-400/20 transform translate-y-full group-hover:translate-y-0 transition-transform"></div>
                        </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                        {subStats.map((s) => (
                        <div key={s.id} className="flex flex-col items-center justify-center bg-[#07132b]/80 border border-blue-800/50 py-1.5 rounded-full">
                            <div className="text-sm font-mono text-white font-bold transition-all duration-300">
                                <AnimatedNumber value={s.value} isFloat={s.isFloat} />{s.unit}
                            </div>
                            <div className="text-[10px] text-slate-400">{tt(s.labelKey)}</div>
                        </div>
                        ))}
                    </div>
                    </div>

                    <ThreeProvinceMapPanel selectedStationId={selectedStationId} onSelectStation={onSelectStation} />

                    <TechCard title={tt('cluster.card.strategy')} className="flex-[3] min-h-0">
                    <div className="grid grid-cols-6 text-[10px] text-cyan-500 bg-blue-950/40 py-1.5 px-2 mb-1">
                        <div>{tt('cluster.col.task')}</div><div className="text-center">{tt('cluster.col.space')}</div><div className="text-center">{tt('cluster.col.taskSched')}</div>
                        <div className="text-center">{tt('cluster.col.node')}</div><div className="text-center">{tt('cluster.col.res')}</div><div className="text-right">{tt('cluster.col.action')}</div>
                    </div>
                    <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
                        <div className="absolute w-full animate-scroll-up">
                        {[...tableData, ...tableData].map((row, i) => (
                            <div key={i} className="grid grid-cols-6 text-xs text-slate-300 py-2 border-b border-blue-900/30 hover:bg-blue-900/20 px-2 transition-colors">
                            <div className="font-mono text-cyan-200">{tt(row.nameKey, { n: row.nameN })}</div><div className="text-center font-mono">{row.space}</div>
                            <div className="text-center font-mono text-green-400">{row.task}</div><div className="text-center font-mono">{row.node}</div>
                            <div className="text-center font-mono text-yellow-400">{row.res}</div><div className="text-right text-cyan-500 cursor-pointer hover:text-cyan-300">{tt('cluster.action.edit')}</div>
                            </div>
                        ))}
                        </div>
                    </div>
                    </TechCard>
                </div>

                <div className="col-span-3 flex flex-col gap-4">
                    <TechCard title={tt('cluster.card.predEnergy')} className="flex-1 min-h-0">
                        <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#f43f5e] rounded-full"></span>{tt('cluster.legend.pred')}</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#0ea5e9] rounded-full"></span>{tt('cluster.legend.base')}</span>
                        </div>
                        <div className="flex-1 mt-2"><MiniLineChart data1={lineData2} data2={lineData1} color1="#f43f5e" color2="#0ea5e9" /></div>
                    </TechCard>
                    
                    <TechCard title={tt('cluster.card.dispatch')} className="flex-1 min-h-0">
                        <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-400 rounded-full"></span>{tt('cluster.legend.slack')}</span>
                        </div>
                        <div className="flex-1 mt-2 min-h-0 pr-1"><MiniBarChart data={barData} xLabels={barData.map((_, i) => tt('center.n', { n: i+1 }))} /></div>
                    </TechCard>
                    
                    <TechCard title={tt('cluster.card.carbonPred')} className="flex-1 min-h-0">
                        <div className="flex justify-end gap-2 text-[10px] text-slate-400 mb-2">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#d946ef] rounded-full"></span>{tt('cluster.legend.carbon24h')}</span>
                        </div>
                        <div className="flex-1 mt-2"><MiniLineChart data1={lineData1} color1="#d946ef" /></div>
                    </TechCard>
                </div>
                </div>
            );
        };

