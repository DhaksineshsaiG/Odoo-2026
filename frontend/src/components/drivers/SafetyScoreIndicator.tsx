export function SafetyScoreIndicator({ score }: { score: number }) {
  const tone = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  const text = score >= 90 ? 'text-emerald-700' : score >= 70 ? 'text-amber-700' : 'text-rose-700';
  return <div className="min-w-24"><div className="flex items-center justify-between gap-2"><span className={`text-sm font-semibold ${text}`}>{score}</span><span className="text-xs text-slate-400">/ 100</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone}`} style={{ width: `${score}%` }} /></div></div>;
}
