        const { useState, useEffect, useRef } = React;

        // ==============================
        // SVG 图标库
        // ==============================
        const Icon = ({ path, className, ...props }) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
                {path}
            </svg>
        );
        const Globe = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></>} />;
        const Clock = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
        const Cpu = (p) => <Icon {...p} path={<><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 21v3M15 21v3M20 9h3M20 14h3M1 9h3M1 14h3"/></>} />;
        const Server = (p) => <Icon {...p} path={<><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>} />;
        const Layers = (p) => <Icon {...p} path={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>} />;
        const Database = (p) => <Icon {...p} path={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>} />;
        const Hexagon = (p) => <Icon {...p} path={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>} />;
        const ZapIcon = (p) => <Icon {...p} path={<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>} />;
        const Navigation = (p) => <Icon {...p} path={<><polygon points="3 11 22 2 13 21 11 13 3 11"/></>} />;

        // 与 tokenseller.html 完全统一：name 为对外展示名，city 为图表短标签（须与 name 一致，不得出现未对外使用的地名）
        const STATION_CATALOG = [
            // x/y：集群拓扑图（西=左、北=上）；geoX/geoY：全国算力地图。坐标按大致地理方位等比铺开
            { id: 'xj-pv', city: '新疆', name: '新疆集中式光伏电站', type: 'centralized-pv', typeLabel: '集中式光伏', x: 10, y: 26, geoX: 10, geoY: 28, power: 142.3, today: 528.6, cap: 220, status: 'normal', subCount: 8 },
            { id: 'bj-dx', city: '北京大兴', name: '北京大兴区分布式光伏电站', type: 'distributed-pv', typeLabel: '分布式光伏', x: 58, y: 20, geoX: 48, geoY: 18, power: 85.2, today: 312.5, cap: 120, status: 'normal', subCount: 4 },
            { id: 'tj-pv', city: '天津', name: '天津分布式光伏电站', type: 'distributed-pv', typeLabel: '分布式光伏', x: 72, y: 18, geoX: 58, geoY: 22, power: 62.7, today: 248.0, cap: 90, status: 'normal', subCount: 3 },
            { id: 'hb-sz', city: '河北深州', name: '河北深州集中式光伏电站', type: 'centralized-pv', typeLabel: '集中式光伏', x: 52, y: 42, geoX: 42, geoY: 38, power: 91.5, today: 356.2, cap: 130, status: 'warning', subCount: 6 },
            { id: 'js-gy', city: '江苏高邮', name: '江苏高邮集中式光伏电站', type: 'centralized-pv', typeLabel: '集中式光伏', x: 82, y: 48, geoX: 72, geoY: 48, power: 54.1, today: 201.3, cap: 80, status: 'normal', subCount: 4 },
            { id: 'jx-wa', city: '江西', name: '江西水电电站', type: 'hydro', typeLabel: '水电', x: 58, y: 65, geoX: 48, geoY: 68, power: 103.8, today: 402.1, cap: 150, status: 'normal', subCount: 5 },
            { id: 'gd-st', city: '广东汕头', name: '广东汕头海上风电电站', type: 'offshore-wind', typeLabel: '海上风电', x: 78, y: 88, geoX: 68, geoY: 82, power: 67.2, today: 261.5, cap: 95, status: 'normal', subCount: 3 },
        ];

        const STATION_TYPE_STYLE = {
            'distributed-pv': { dot: 'bg-cyan-400', shadow: 'shadow-[0_0_15px_#22d3ee]', border: 'border-cyan-500/50', statusKey: 'status.stable' },
            'centralized-pv': { dot: 'bg-blue-400', shadow: 'shadow-[0_0_15px_#60a5fa]', border: 'border-blue-500/50', statusKey: 'status.computing' },
            'hydro': { dot: 'bg-emerald-400', shadow: 'shadow-[0_0_15px_#34d399]', border: 'border-emerald-500/50', statusKey: 'status.green' },
            'wind': { dot: 'bg-amber-400', shadow: 'shadow-[0_0_15px_#fbbf24]', border: 'border-amber-500/50', statusKey: 'status.green' },
            'offshore-wind': { dot: 'bg-amber-400', shadow: 'shadow-[0_0_15px_#fbbf24]', border: 'border-amber-500/50', statusKey: 'status.green' },
        };

        const SOURCE_TITLE_KEYS = {
            'distributed-pv': 'source.distributed-pv',
            'centralized-pv': 'source.centralized-pv',
            'wind': 'source.wind',
            'offshore-wind': 'source.offshore-wind',
            'hydro': 'source.hydro',
        };

        function tt(key, vars) {
            return (typeof t === 'function') ? t(key, vars) : key;
        }
        function localizeStation(st) {
            if (!st) return st;
            return Object.assign({}, st, {
                name: tt('station.' + st.id + '.name'),
                city: tt('station.' + st.id + '.city'),
                typeLabel: tt('type.' + st.type),
            });
        }
        function stationTypeStyle(type) {
            const base = STATION_TYPE_STYLE[type] || STATION_TYPE_STYLE['distributed-pv'];
            return Object.assign({}, base, { status: tt(base.statusKey) });
        }
        function sourceTitleFor(type) {
            return tt(SOURCE_TITLE_KEYS[type] || SOURCE_TITLE_KEYS['distributed-pv']);
        }

        // ==============================
        // 工具与自定义 Hook
        // ==============================
        const useDynamicData = (initialData, variance = 5, interval = 3000) => {
            const [data, setData] = useState(initialData);
            useEffect(() => {
                const timer = setInterval(() => {
                    setData(prev => prev.map(val => Math.max(0, val + (Math.random() * variance * 2 - variance))));
                }, interval);
                return () => clearInterval(timer);
            }, [variance, interval]);
            return data;
        };

        // ==============================
        // 共享 UI 组件
        // ==============================
        const AnimatedNumber = ({ value, isFloat, compact = false }) => {
            const [displayValue, setDisplayValue] = useState(value);

            useEffect(() => {
                let startValue = displayValue;
                let endValue = value;
                if (startValue === endValue) return;
                
                let startTime = null;
                const duration = 1000;
                let animationFrameId;

                const animate = (currentTime) => {
                    if (!startTime) startTime = currentTime;
                    const progress = Math.min((currentTime - startTime) / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 4);
                    setDisplayValue(startValue + (endValue - startValue) * easeOut);
                    
                    if (progress < 1) animationFrameId = requestAnimationFrame(animate);
                    else setDisplayValue(endValue);
                };
                
                animationFrameId = requestAnimationFrame(animate);
                return () => cancelAnimationFrame(animationFrameId);
            }, [value]);

            let formattedValue;
            if (compact) {
                if (displayValue >= 1000000) formattedValue = (displayValue / 1000000).toFixed(1) + 'M';
                else if (displayValue >= 1000) formattedValue = (displayValue / 1000).toFixed(1) + 'K';
                else formattedValue = Math.floor(displayValue).toString();
            } else {
                formattedValue = isFloat ? displayValue.toFixed(1) : Math.floor(displayValue).toLocaleString();
            }

            return <>{formattedValue}</>;
        };

        const TechCard = ({ title, children, className = "" }) => (
            <div className={`relative bg-[#060d1f]/80 border border-blue-500/30 backdrop-blur-sm flex flex-col ${className}`}>
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400"></div>
                
                {title && (
                <div className="px-4 py-2 bg-gradient-to-r from-blue-900/50 to-transparent border-b border-blue-500/30 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-cyan-400 rounded-sm skew-x-[-20deg]"></div>
                    <h3 className="text-cyan-100 text-sm font-bold tracking-wider">{title}</h3>
                </div>
                )}
                <div className="p-3 flex-1 flex flex-col overflow-hidden relative">
                {children}
                </div>
            </div>
        );

        const MiniLineChart = ({ data1, data2, color1 = "#0ea5e9", color2 = "#10b981", xLabels = ['00:00', '12:00', '24:00'], dualAxis = false, yMax1, yMax2 }) => {
            const [hoverIndex, setHoverIndex] = useState(null);
            const m1 = yMax1 || (Math.max(...data1) * 1.2 || 100);
            const m2 = dualAxis ? (yMax2 || (Math.max(...(data2 || [])) * 1.2 || 100)) : m1;
            const maxForData2 = data2 ? (dualAxis ? m2 : m1) : m1;

            const toPoints = (data, m) => data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - (val / m) * 100}`).join(' L ');
            
            return (
                <div className="relative w-full h-full min-h-[80px] flex" onMouseLeave={() => setHoverIndex(null)}>
                    {/* 左侧Y轴 (Data1) */}
                    <div className="flex flex-col justify-between items-end text-[9px] pr-2 pb-5 shrink-0 w-8 z-10 font-mono" style={{ color: color1 }}>
                        <span>{Math.floor(m1)}</span>
                        <span>{Math.floor(m1 / 2)}</span>
                        <span>0</span>
                    </div>

                    <div className="relative flex-1 h-full">
                        <div className="absolute inset-0 pb-5 flex flex-col justify-between pointer-events-none z-0">
                            <div className="w-full border-t border-dashed border-blue-900/40"></div>
                            <div className="w-full border-t border-dashed border-blue-900/40"></div>
                            <div className="w-full border-t border-dashed border-blue-900/40"></div>
                        </div>

                        <svg className="absolute top-0 left-0 w-full h-[calc(100%-1.25rem)] drop-shadow-md pointer-events-none z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d={`M 0,${100 - (data1[0]/m1)*100} L ${toPoints(data1, m1)}`} fill="none" stroke={color1} strokeWidth="2" className="transition-all duration-1000 ease-in-out" />
                            {data2 && <path d={`M 0,${100 - (data2[0]/maxForData2)*100} L ${toPoints(data2, maxForData2)}`} fill="none" stroke={color2} strokeWidth="2" className="transition-all duration-1000 ease-in-out" />}
                            <path d={`M 0,100 L 0,${100 - (data1[0]/m1)*100} L ${toPoints(data1, m1)} L 100,100 Z`} fill={`url(#grad-${color1.replace('#','')})`} opacity="0.2" className="transition-all duration-1000 ease-in-out" />
                            <defs>
                            <linearGradient id={`grad-${color1.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={color1} stopOpacity="1" />
                                <stop offset="100%" stopColor={color1} stopOpacity="0" />
                            </linearGradient>
                            </defs>
                        </svg>

                        <div className="absolute bottom-0 left-0 w-full flex justify-between text-[9px] text-slate-500 px-1 z-0 font-mono">
                            {xLabels.map((label, idx) => <span key={idx}>{label}</span>)}
                        </div>

                        <div className="absolute top-0 left-0 w-full h-[calc(100%-1.25rem)] flex z-20">
                            {data1.map((_, i) => (
                                <div key={i} className="flex-1 h-full" onMouseEnter={() => setHoverIndex(i)} style={{ cursor: 'crosshair' }} />
                            ))}
                        </div>

                        {hoverIndex !== null && (
                            <div className="absolute top-0 left-0 w-full h-[calc(100%-1.25rem)] pointer-events-none z-30">
                                <div className="absolute top-0 bottom-0 border-l border-dashed border-cyan-400/50 transition-all duration-200" style={{ left: `${(hoverIndex / (data1.length - 1)) * 100}%` }} />
                                <div className="absolute w-2 h-2 rounded-full border border-white transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200" style={{ left: `${(hoverIndex / (data1.length - 1)) * 100}%`, top: `${100 - (data1[hoverIndex] / m1) * 100}%`, backgroundColor: color1, boxShadow: `0 0 8px ${color1}` }} />
                                {data2 && <div className="absolute w-2 h-2 rounded-full border border-white transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200" style={{ left: `${(hoverIndex / (data1.length - 1)) * 100}%`, top: `${100 - (data2[hoverIndex] / maxForData2) * 100}%`, backgroundColor: color2, boxShadow: `0 0 8px ${color2}` }} />}
                                
                                <div className="absolute top-0 bg-[#0a1530]/95 border border-blue-500/50 p-2 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] text-[10px] whitespace-nowrap backdrop-blur-sm transition-transform duration-100" style={{ left: `${(hoverIndex / (data1.length - 1)) * 100}%`, transform: `translate(${hoverIndex > data1.length / 2 ? '-115%' : '15%'}, 0)` }}>
                                    <div className="text-slate-400 mb-1 border-b border-blue-900/50 pb-1">{tt('chart.nodeRealtime', { n: hoverIndex + 1 })}</div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: color1}}></span><span className="text-slate-300">{tt('chart.metric1')}</span></div>
                                        <span className="font-mono text-cyan-50 font-bold">{data1[hoverIndex].toFixed(1)}</span>
                                    </div>
                                    {data2 && (
                                        <div className="flex items-center justify-between gap-3 mt-1.5">
                                            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: color2}}></span><span className="text-slate-300">{tt('chart.metric2')}</span></div>
                                            <span className="font-mono text-cyan-50 font-bold">{data2[hoverIndex].toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右侧Y轴 (Data2) */}
                    {dualAxis && data2 && (
                        <div className="flex flex-col justify-between items-start text-[9px] pl-2 pb-5 shrink-0 w-8 z-10 font-mono" style={{ color: color2 }}>
                            <span>{Math.floor(m2)}</span>
                            <span>{Math.floor(m2 / 2)}</span>
                            <span>0</span>
                        </div>
                    )}
                </div>
            );
        };

        const MiniBarChart = ({ data, colorFrom = "from-cyan-600", colorTo = "to-cyan-300", xLabels, yMax }) => {
            const [hoverIndex, setHoverIndex] = useState(null);
            const max = yMax || (Math.max(...data) * 1.2 || 100);
            
            return (
                <div className="relative w-full h-full min-h-[80px] flex" onMouseLeave={() => setHoverIndex(null)}>
                    <div className="flex flex-col justify-between items-end text-[9px] text-slate-500 pr-2 pb-5 shrink-0 w-8 z-10 font-mono">
                        <span>{Math.floor(max)}</span><span>{Math.floor(max / 2)}</span><span>0</span>
                    </div>

                    <div className="relative flex-1 h-full">
                        <div className="absolute inset-0 pb-5 flex flex-col justify-between pointer-events-none z-0">
                            <div className="w-full border-t border-dashed border-blue-900/40"></div>
                            <div className="w-full border-t border-dashed border-blue-900/40"></div>
                            <div className="w-full border-t border-dashed border-blue-900/40"></div>
                        </div>

                        <div className="absolute top-0 left-0 w-full h-[calc(100%-1.25rem)] flex justify-between gap-1.5 lg:gap-2 z-10 items-end">
                            {data.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end h-full relative group cursor-pointer" onMouseEnter={() => setHoverIndex(i)}>
                                    <div className="w-full bg-blue-900/30 relative flex flex-col justify-end flex-1 rounded-t-sm">
                                        <div className={`w-full bg-gradient-to-t ${colorFrom} ${colorTo} transition-all duration-1000 rounded-t-sm group-hover:opacity-80 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.5)]`} style={{ height: `${(val / max) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="absolute bottom-0 left-0 w-full flex justify-between text-[9px] text-slate-500 z-0 font-mono">
                            {xLabels.map((label, idx) => (
                                <div key={idx} className="flex-1 flex justify-center whitespace-nowrap"><span className={`transition-colors ${hoverIndex === idx ? "text-cyan-400 font-bold" : ""}`}>{label}</span></div>
                            ))}
                        </div>

                        {hoverIndex !== null && (
                            <div className="absolute top-0 pointer-events-none bg-[#0a1530]/95 border border-blue-500/50 p-2 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] text-[10px] z-30 whitespace-nowrap backdrop-blur-sm transition-transform duration-100" style={{ left: `${(hoverIndex / data.length) * 100 + (50 / data.length)}%`, transform: `translate(${hoverIndex >= data.length / 2 ? '-115%' : '15%'}, 0)` }}>
                                <div className="text-slate-400 mb-1 border-b border-blue-900/50 pb-1">{tt('chart.labelRealtime', { label: xLabels[hoverIndex] })}</div>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span className="text-slate-300">{tt('chart.value')}</span></div>
                                    <span className="font-mono text-cyan-50 font-bold">{data[hoverIndex].toFixed(1)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        const CircleProgress = ({ percentage, label, color = "#0ea5e9", size = 80 }) => {
            const radius = 36;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            return (
                <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} stroke="rgba(14, 165, 233, 0.2)" strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r={radius} stroke={color} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-mono font-bold text-white"><AnimatedNumber value={percentage} isFloat={false} />%</span>
                </div>
                {label && <div className="absolute -bottom-5 text-[10px] text-cyan-400/80 whitespace-nowrap">{label}</div>}
                </div>
            );
        };

