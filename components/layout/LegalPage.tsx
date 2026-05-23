export default function LegalPage({ title, content }: any) {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="border-b border-slate-100 pb-8">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 italic">
          {title}
        </h1>
      </header>
      <div className="space-y-12">
        {content.map((section: any, idx: any) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 flex items-center gap-3">
              <span className="text-slate-200">0{idx + 1}</span> {section.heading}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-8 border-l border-slate-100">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
