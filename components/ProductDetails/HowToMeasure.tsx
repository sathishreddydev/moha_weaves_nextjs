"use client";

interface HowToMeasureProps {
  className?: string;
}

export default function HowToMeasure({ className = "" }: HowToMeasureProps) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">How to Measure</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-[10px] flex-shrink-0">1</div>
            <div>
              <h4 className="text-xs font-medium text-gray-900">Chest</h4>
              <p className="text-xs text-gray-600">Measure around the fullest part of your chest, keeping the tape horizontal.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-[10px] flex-shrink-0">2</div>
            <div>
              <h4 className="text-xs font-medium text-gray-900">Waist</h4>
              <p className="text-xs text-gray-600">Measure around your natural waistline, keeping the tape comfortable but snug.</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-[10px] flex-shrink-0">3</div>
            <div>
              <h4 className="text-xs font-medium text-gray-900">Hip</h4>
              <p className="text-xs text-gray-600">Measure around the fullest part of your hips, keeping your feet together.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-[10px] flex-shrink-0">💡</div>
            <div>
              <h4 className="text-xs font-medium text-gray-900">Pro Tip</h4>
              <p className="text-xs text-gray-600">Measure wearing minimal clothing and keep the tape level for best results.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
