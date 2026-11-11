        // ==============================
        // 核心地图组件重构：星型集群拓扑 (Star Cluster Topology)
        // 完全抛弃城市间的虚假互联，强调"城市作为枢纽，收集旗下物理站点"的业务逻辑
        // ==============================
        const ThreeProvinceMapPanel = ({ selectedStationId, onSelectStation }) => {
            const canvasRef = React.useRef(null);
            const animRef = React.useRef(null);
            const [hovered, setHovered] = React.useState(null);
            const [mousePos, setMousePos] = React.useState({x:0, y:0});

            const stationsRef = React.useRef(STATION_CATALOG.map(s => localizeStation({ ...s })));

            React.useEffect(() => {
                const t = setInterval(() => {
                    stationsRef.current = stationsRef.current.map(s => ({
                        ...s,
                        power: +(s.power * (0.98 + Math.random()*0.04)).toFixed(1),
                        today: +(s.today + Math.random()*2).toFixed(1)
                    }));
                }, 2000);
                return () => clearInterval(t);
            }, []);

            React.useEffect(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                let time = 0;

                function getPx(coord, max) {
                    return 48 + (coord / 100) * (max - 96); // 留边，拉满可用画布
                }

                function clusterRadiusOf(st) {
                    return 16 + st.subCount * 1.8; // 缩小控制域，避免节点挤叠
                }

                function render() {
                    time += 0.016;
                    const W = canvas.width;
                    const H = canvas.height;
                    ctx.clearRect(0, 0, W, H);

                    // 1. 绘制底层抽象网络脉络
                    ctx.save();
                    ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < W; i += 40) {
                        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
                    }
                    for (let i = 0; i < H; i += 40) {
                        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
                    }
                    ctx.restore();

                    // 2. 绘制星型集群拓扑 (每个城市包含多个子站点)
                    stationsRef.current.forEach((st, i) => {
                        const px = getPx(st.x, W);
                        const py = getPx(st.y, H);
                        const isWarn = st.status === 'warning';
                        const mainColor = isWarn ? '#ef4444' : '#22d3ee';
                        const glowColor = isWarn ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 211, 238, 0.12)';
                        
                        const clusterRadius = clusterRadiusOf(st);
                        
                        // 绘制集群控制域背景
                        ctx.beginPath();
                        ctx.arc(px, py, clusterRadius, 0, Math.PI * 2);
                        ctx.fillStyle = glowColor;
                        ctx.strokeStyle = isWarn ? 'rgba(239, 68, 68, 0.28)' : 'rgba(34, 211, 238, 0.28)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([3, 3]);
                        ctx.fill(); 
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // 绘制子节点及其到中心的连线
                        for (let j = 0; j < st.subCount; j++) {
                            const angle = (Math.PI * 2 / st.subCount) * j - Math.PI / 2;
                            const dist = clusterRadius * 0.72;
                            const sx = px + Math.cos(angle) * dist;
                            const sy = py + Math.sin(angle) * dist;

                            ctx.beginPath();
                            ctx.moveTo(sx, sy);
                            ctx.lineTo(px, py);
                            ctx.strokeStyle = isWarn ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 211, 238, 0.35)';
                            ctx.lineWidth = 1;
                            ctx.setLineDash([2, 3]);
                            ctx.lineDashOffset = -time * 15;
                            ctx.stroke();
                            ctx.setLineDash([]);

                            ctx.beginPath();
                            ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
                            ctx.fillStyle = mainColor;
                            ctx.fill();
                            ctx.beginPath();
                            ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
                            ctx.fillStyle = isWarn ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 211, 238, 0.35)';
                            ctx.fill();
                        }

                        const pulse = 0.5 + 0.5 * Math.sin(time * 3 + i);

                        ctx.beginPath();
                        ctx.arc(px, py, 11 + 3 * pulse, 0, Math.PI * 2);
                        ctx.fillStyle = isWarn ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 211, 238, 0.35)';
                        ctx.fill();

                        ctx.beginPath();
                        ctx.arc(px, py, 8, 0, Math.PI * 2);
                        ctx.fillStyle = '#0a1530';
                        ctx.strokeStyle = mainColor;
                        ctx.lineWidth = 2;
                        ctx.fill();
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.arc(px, py, 3, 0, Math.PI * 2);
                        ctx.fillStyle = mainColor;
                        ctx.fill();

                        ctx.save();
                        ctx.font = 'bold 11px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillStyle = '#f8fafc';
                        ctx.shadowColor = '#000';
                        ctx.shadowBlur = 4;
                        ctx.fillText(`${st.city}·${st.typeLabel}`, px, py - clusterRadius - 4);

                        ctx.font = 'bold 10px monospace';
                        ctx.textBaseline = 'top';
                        ctx.fillStyle = mainColor;
                        ctx.fillText(`${st.power.toFixed(1)} MW`, px, py + clusterRadius + 4);
                        ctx.restore();
                        
                        if (hovered === i || st.id === selectedStationId) {
                            ctx.beginPath();
                            ctx.arc(px, py, clusterRadius + 5, 0, Math.PI * 2);
                            ctx.strokeStyle = '#f8fafc';
                            ctx.lineWidth = 1.5;
                            ctx.setLineDash([4, 4]);
                            ctx.lineDashOffset = time * 20;
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    });

                    animRef.current = requestAnimationFrame(render);
                }

                function resize() {
                    const p = canvas.parentElement;
                    canvas.width  = p.clientWidth  || 800;
                    canvas.height = p.clientHeight || 500;
                }
                const ro = new ResizeObserver(resize);
                ro.observe(canvas.parentElement);
                resize();
                animRef.current = requestAnimationFrame(render);
                return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
            }, [hovered, selectedStationId]);

            function handleMouseMove(e) {
                const canvas = canvasRef.current;
                const rect   = canvas.getBoundingClientRect();
                const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
                const my = (e.clientY - rect.top)  * (canvas.height / rect.height);
                const W  = canvas.width, H = canvas.height;
                const toPx = (coord, max) => 48 + (coord / 100) * (max - 96);

                let found = null;
                stationsRef.current.forEach((st, i) => {
                    const cx = toPx(st.x, W);
                    const cy = toPx(st.y, H);
                    const clusterRadius = 16 + st.subCount * 1.8;
                    if (Math.hypot(mx - cx, my - cy) < clusterRadius) found = i;
                });
                setHovered(found);
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }

            const hov = hovered !== null ? stationsRef.current[hovered] : null;

            return (
                <div className="flex-[5] min-h-0 relative overflow-hidden border border-blue-500/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#060d1f] to-[#060d1f]">
                    <canvas
                        ref={canvasRef}
                        style={{width:'100%', height:'100%', display:'block', cursor: hovered !== null ? 'pointer' : 'default'}}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => {
                            if (hovered !== null && onSelectStation) {
                                onSelectStation(stationsRef.current[hovered].id);
                            }
                        }}
                    />
                    
                    {/* 悬浮 Tooltip */}
                    {hov && (
                        <div style={{
                            position:'absolute',
                            left: mousePos.x > 400 ? mousePos.x - 240 : mousePos.x + 20,
                            top: mousePos.y > 250 ? mousePos.y - 160 : mousePos.y + 20,
                            background:'rgba(10,21,48,0.95)', border:'1px solid rgba(34,211,238,0.5)',
                            borderRadius:8, padding:'14px 16px', minWidth:220, pointerEvents:'none', zIndex:50,
                            backdropFilter:'blur(8px)', boxShadow:'0 10px 30px rgba(0,0,0,0.5)',
                        }}>
                            <div style={{ color: hov.status === 'warning' ? '#ef4444' : '#22d3ee', fontWeight:'bold', fontSize:14, borderBottom:'1px solid rgba(34,211,238,0.2)', paddingBottom:8, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
                                <span className={`w-2.5 h-2.5 rounded-full ${hov.status === 'warning' ? 'bg-red-500 animate-ping' : 'bg-cyan-400'}`}></span>
                                {hov.name}
                            </div>
                            {[
                                [tt('map.field.type'), hov.typeLabel],
                                [tt('map.field.subs'), `${hov.subCount}`],
                                [tt('map.field.cap'), tt('map.unit.cap', { n: hov.cap })],
                                [tt('map.field.powerMw'), `${hov.power} MW`],
                                [tt('map.field.todayMwh'), `${hov.today} MWh`],
                                [tt('map.field.load'), `${((hov.power/hov.cap)*100).toFixed(1)}%`],
                            ].map(([label, val]) => (
                                <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:6 }}>
                                    <span style={{color:'#94a3b8'}}>{label}</span>
                                    <span style={{color:'#f8fafc', fontFamily:'monospace', fontWeight:'bold'}}>{val}</span>
                                </div>
                            ))}
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginTop:8, paddingTop:8, borderTop:'1px dashed rgba(255,255,255,0.1)'}}>
                                <span style={{color:'#94a3b8'}}>{tt('station.statusOverview')}</span>
                                <span style={{color: hov.status === 'warning' ? '#f87171' : '#34d399', fontWeight:'bold'}}>
                                    {hov.status === 'warning' ? tt('map.status.warn') : tt('map.status.ok')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        };

