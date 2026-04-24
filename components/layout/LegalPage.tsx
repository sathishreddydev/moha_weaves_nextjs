export default function LegalPage({ title, content }: any) {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-12 italic">
        {title}
      </h1>
      <div className="space-y-12">
        {content.map((section: any, idx: any) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 flex items-center gap-3">
              <span className="text-slate-200">0{idx + 1}</span> {section.heading}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed pl-8 border-l border-slate-100">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
