import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(180deg, #080c14 0%, #0d1f15 50%, #080c14 100%)' }}>
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full mx-auto mb-5 bg-red-600" 
          style={{ boxShadow: '0 6px 24px rgba(220,38,38,0.3), inset 0 -3px 6px rgba(0,0,0,0.4), inset 0 3px 6px rgba(255,255,255,0.1)' }} />
        <h1 className="text-3xl font-bold text-white mb-1">Snooker Score</h1>
        <p className="text-sm text-gray-500">Live scoring & tournament platform</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
        <NavCard href="/scorer" icon="📱" title="Score" desc="Score a match" />
        <NavCard href="/live" icon="📺" title="Live" desc="Watch live" />
        <NavCard href="/dashboard" icon="🏟️" title="Venue" desc="Multi-table" />
        <NavCard href="/tournaments" icon="🏆" title="Tournaments" desc="Manage" />
        <NavCard href="/players" icon="👤" title="Players" desc="Profiles" />
        <NavCard href="/matches" icon="📊" title="Matches" desc="History" />
        <NavCard href="/display/demo" icon="🖥️" title="TV" desc="Scoreboard" />
        <NavCard href="/overlay/demo" icon="🎬" title="OBS" desc="Overlay" />
        <NavCard href="/overlay/demo?layout=scorebug" icon="📐" title="Bug" desc="Score bug" />
      </div>

      <p className="text-[9px] text-gray-700 mt-10">Snooker Score Platform v1.0</p>
    </main>
  );
}

function NavCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:border-emerald-700/50 hover:bg-gray-900/80 transition-all text-center">
      <span className="text-xl">{icon}</span>
      <p className="text-xs font-semibold text-white mt-1.5">{title}</p>
      <p className="text-[10px] text-gray-500">{desc}</p>
    </Link>
  );
}
