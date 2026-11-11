        // ==============================
        // 单体电站主图 (全新 2D 源网荷储拓扑版)
        // ==============================
        const SolarStationDiagram = ({ station }) => {
            const sourceTitle = sourceTitleFor(station?.type);
            const stationName = station ? localizeStation(station).name : tt('type.distributed-pv');
            return (
                <div className="w-full h-full flex items-center justify-center relative bg-[#040812]">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded border border-cyan-500/30 bg-[#0a1530]/80 text-cyan-100 text-xs font-bold tracking-wider whitespace-nowrap">
                        {stationName}
                    </div>
                    {/* SVG 拓扑画布，按比例缩放，填满可用空间 */}
                    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                        <defs>
                            <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#0f172a" />
                                <stop offset="100%" stopColor="#020617" />
                            </linearGradient>
                            <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#0284c7" />
                                <stop offset="100%" stopColor="#0369a1" />
                            </linearGradient>
                            <linearGradient id="invGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* 基础物理导线 (暗底色) */}
                        {/* 屋顶 -> 逆变器 */}
                        <path d="M 470 300 L 580 300" fill="none" stroke="#1e293b" strokeWidth="8" />
                        {/* 逆变器 -> 电网 */}
                        <path d="M 700 300 L 760 300 L 760 130 L 830 130" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinejoin="round" />
                        {/* 逆变器 -> 储能 */}
                        <path d="M 700 300 L 830 300" fill="none" stroke="#1e293b" strokeWidth="8" />
                        {/* 逆变器 -> 厂区负荷 */}
                        <path d="M 700 300 L 760 300 L 760 480 L 830 480" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinejoin="round" />

                        {/* 动态能量流动轨道 (使用 dashoffset 驱动) */}
                        {/* 光伏阵列 (直流输出) -> 发电 */}
                        <path d="M 470 300 L 580 300" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="10 10">
                            <animate attributeName="stroke-dashoffset" values="20;0" dur="0.8s" repeatCount="indefinite" />
                        </path>
                        
                        {/* 逆变器 (交流并网) -> 电网 */}
                        <path d="M 700 300 L 760 300 L 760 130 L 830 130" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="10 10" strokeLinejoin="round">
                            <animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite" />
                        </path>

                        {/* 逆变器 (直流充放) -> 储能充电中 */}
                        <path d="M 700 300 L 830 300" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="10 10">
                            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.2s" repeatCount="indefinite" />
                        </path>

                        {/* 逆变器 (交流消耗) -> 厂区负荷用电 */}
                        <path d="M 700 300 L 760 300 L 760 480 L 830 480" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="10 10" strokeLinejoin="round">
                            <animate attributeName="stroke-dashoffset" values="20;0" dur="0.6s" repeatCount="indefinite" />
                        </path>

                        {/* 节点 1：大面积屋顶光伏俯视图 */}
                        <g filter="url(#glow)">
                            <rect x="50" y="40" width="420" height="520" rx="12" fill="url(#roofGrad)" stroke="#334155" strokeWidth="3" />
                            {/* 阵列排布逻辑，刻意留出真实的设施空隙 */}
                            <g transform="translate(65, 55)">
                                {Array.from({length: 12}).map((_, r) => 
                                    Array.from({length: 10}).map((_, c) => {
                                        // 模拟屋顶天窗与通风设备留白区域
                                        if ((r >= 4 && r <= 7) && (c >= 4 && c <= 6)) return null; 
                                        return (
                                            <rect key={`${r}-${c}`} x={c * 39} y={r * 41} width="35" height="37" rx="2" fill="url(#panelGrad)" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.4" />
                                        )
                                    })
                                )}
                                {/* 模拟屋顶机房/HVAC设备 */}
                                <rect x="156" y="164" width="117" height="164" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                                <circle cx="214" cy="200" r="22" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                                <circle cx="214" cy="285" r="22" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                            </g>
                        </g>
                        <text x="260" y="24" fill="#94a3b8" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="4">{sourceTitle}</text>
                        <text x="260" y="585" fill="#10b981" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{tt('diagram.realtimeOut')}</text>

                        {/* 节点 2：逆变/EMS 枢纽中心 */}
                        <g filter="url(#glow)">
                            <rect x="580" y="240" width="120" height="120" rx="12" fill="url(#invGrad)" stroke="#0ea5e9" strokeWidth="2" />
                            <rect x="595" y="255" width="90" height="35" rx="4" fill="#020617" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
                            <text x="640" y="278" fill="#38bdf8" fontSize="14" fontWeight="bold" textAnchor="middle">{tt('diagram.invCenter')}</text>
                            <text x="640" y="325" fill="#64748b" fontSize="12" fontWeight="bold" textAnchor="middle">{tt('diagram.dcac')}</text>
                            <text x="640" y="345" fill="#34d399" fontSize="12" textAnchor="middle">{tt('diagram.ems')}</text>
                        </g>

                        {/* 节点 3：大电网交互 */}
                        <g filter="url(#glow)">
                            <circle cx="880" cy="130" r="50" fill="#0f172a" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8 4" />
                            <circle cx="880" cy="130" r="38" fill="#1e293b" />
                            {/* 电塔简化图标 */}
                            <path d="M 868 105 L 892 105 M 880 105 L 880 135 M 860 155 L 880 135 L 900 155" fill="none" stroke="#93c5fd" strokeWidth="2" />
                            <text x="880" y="65" fill="#93c5fd" fontSize="16" fontWeight="bold" textAnchor="middle">{tt('diagram.grid')}</text>
                            <text x="880" y="205" fill="#0ea5e9" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{tt('diagram.gridFlow')}</text>
                        </g>

                        {/* 节点 4：储能系统 */}
                        <g filter="url(#glow)">
                            <rect x="830" y="250" width="100" height="100" rx="8" fill="#0f172a" stroke="#8b5cf6" strokeWidth="3" />
                            {/* 电池容量指示器 */}
                            <rect x="850" y="270" width="60" height="30" rx="4" fill="#1e293b" stroke="#c4b5fd" strokeWidth="2" />
                            <rect x="910" y="280" width="4" height="10" rx="1" fill="#c4b5fd" />
                            <rect x="853" y="273" width="43" height="24" rx="2" fill="#a855f7" /> {/* 约 72% 填充 */}
                            <text x="880" y="325" fill="#c4b5fd" fontSize="14" fontWeight="bold" textAnchor="middle">{tt('diagram.storage')}</text>
                            <text x="880" y="342" fill="#d8b4fe" fontSize="12" fontFamily="monospace" textAnchor="middle">SOC: 72%</text>
                        </g>

                        {/* 节点 5：本地负荷 */}
                        <g filter="url(#glow)">
                            {/* 工厂建筑图标化 */}
                            <path d="M 830 520 L 830 460 L 860 430 L 890 460 L 920 430 L 950 460 L 950 520 Z" fill="#0f172a" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
                            <rect x="850" y="480" width="15" height="40" fill="#1e293b" />
                            <rect x="895" y="480" width="15" height="40" fill="#1e293b" />
                            <text x="890" y="550" fill="#fcd34d" fontSize="16" fontWeight="bold" textAnchor="middle">{tt('diagram.load')}</text>
                            <text x="890" y="570" fill="#f59e0b" fontSize="15" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{tt('diagram.loadPower')}</text>
                        </g>

                        {/* 强化光晕粒子，与虚线流动同频以增强视觉厚度 */}
                        <circle cx="0" cy="0" r="4" fill="#10b981" filter="url(#glow)">
                            <animateMotion path="M 470 300 L 580 300" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r="4" fill="#0ea5e9" filter="url(#glow)">
                            <animateMotion path="M 700 300 L 760 300 L 760 130 L 830 130" dur="1s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r="4" fill="#8b5cf6" filter="url(#glow)">
                            <animateMotion path="M 700 300 L 830 300" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="0" cy="0" r="4" fill="#fcd34d" filter="url(#glow)">
                            <animateMotion path="M 700 300 L 760 300 L 760 480 L 830 480" dur="0.6s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                </div>
            );
        };
