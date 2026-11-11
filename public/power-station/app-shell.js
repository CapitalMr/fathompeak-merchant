
        const STATION_STORAGE_KEY = 'ps-selected-station';
        function getSelectedStationId() {
            try {
                const id = sessionStorage.getItem(STATION_STORAGE_KEY);
                if (id && STATION_CATALOG.some(s => s.id === id)) return id;
            } catch (e) {}
            return STATION_CATALOG[0].id;
        }
        function setSelectedStationId(id) {
            try { sessionStorage.setItem(STATION_STORAGE_KEY, id); } catch (e) {}
        }
        function navClass(active, variant) {
            if (active) {
                if (variant === 'compute') {
                    return 'px-4 py-1.5 text-sm rounded transition-all font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]';
                }
                return 'px-4 py-1.5 text-sm rounded transition-all font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]';
            }
            if (variant === 'compute') {
                return 'px-4 py-1.5 text-sm rounded transition-all font-bold text-slate-400 hover:text-blue-300 hover:bg-blue-900/30';
            }
            return 'px-4 py-1.5 text-sm rounded transition-all font-bold text-slate-400 hover:text-cyan-300 hover:bg-blue-900/30';
        }
        // Isolated so the 1s tick does not re-render AppShell and wipe #static-i18n-switcher
        function HeaderClock() {
            const [time, setTime] = useState(new Date());
            useEffect(() => {
                const timer = setInterval(() => setTime(new Date()), 1000);
                return () => clearInterval(timer);
            }, []);
            const y = time.getFullYear();
            const m = String(time.getMonth() + 1).padStart(2, '0');
            const d = String(time.getDate()).padStart(2, '0');
            const h = String(time.getHours()).padStart(2, '0');
            const min = String(time.getMinutes()).padStart(2, '0');
            const s = String(time.getSeconds()).padStart(2, '0');
            return (
                <div className="flex items-center gap-2 text-cyan-300 font-mono bg-blue-950/30 px-3 py-1 rounded border border-blue-900/50">
                    <Clock className="w-4 h-4" />{`${y}-${m}-${d} ${h}:${min}:${s}`}
                </div>
            );
        }
        function AppShell({ activeView, children }) {
            const [lang, setLang] = useState(() => (window.PagesI18n ? PagesI18n.getLang() : 'zh'));
            useEffect(() => {
                const onChange = (e) => {
                    if (e.detail && e.detail.lang) setLang(e.detail.lang);
                };
                window.addEventListener('static-i18n:change', onChange);
                if (window.PagesI18n && PagesI18n.remountSwitcher) {
                    PagesI18n.remountSwitcher();
                }
                return () => window.removeEventListener('static-i18n:change', onChange);
            }, []);
            // React clears unmanaged DOM children under this host on commit — repaint after each shell render
            React.useLayoutEffect(() => {
                if (window.PagesI18n && PagesI18n.remountSwitcher) {
                    PagesI18n.remountSwitcher();
                }
            });
            const langQ = '?lang=' + lang;
            // Do NOT key={lang} on the shell — remounting destroys the switcher mid-click
            return (
                <div className="min-h-screen flex flex-col">
                    <header className="h-16 flex items-center justify-between px-6 border-b border-blue-900/50 bg-[#060d1f] relative z-20">
                        <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 text-cyan-400">
                            <Globe className="w-6 h-6 animate-pulse" />
                            <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">{tt('brand.title')}</h1>
                        </div>
                        <nav className="flex gap-2 bg-[#050b14] p-1 rounded-lg border border-blue-900/50">
                            <a href={'single.html' + langQ} className={navClass(activeView === 'single')}>{tt('nav.single')}</a>
                            <a href={'cluster.html' + langQ} className={navClass(activeView === 'power')}>{tt('nav.cluster')}</a>
                            <a href={'compute.html' + langQ} className={navClass(activeView === 'compute', 'compute')}>{tt('nav.compute')}</a>
                        </nav>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                        <div id="static-i18n-switcher"></div>
                        <HeaderClock />
                        </div>
                    </header>
                    <main key={lang} className="flex-1 p-3 overflow-hidden relative flex flex-col h-[calc(100vh-4rem)]">
                        {children}
                    </main>
                </div>
            );
        }
