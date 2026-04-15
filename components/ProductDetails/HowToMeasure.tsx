"use client";

interface HowToMeasureProps {
  className?: string;
}

export default function HowToMeasure({ className = "" }: HowToMeasureProps) {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Measure</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">1</div>
            <div>
              <h4 className="font-medium text-gray-900">Chest</h4>
              <p className="text-sm text-gray-600">Measure around the fullest part of your chest, keeping the tape measure horizontal.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">2</div>
            <div>
              <h4 className="font-medium text-gray-900">Waist</h4>
              <p className="text-sm text-gray-600">Measure around your natural waistline, keeping the tape measure comfortable but snug.</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">3</div>
            <div>
              <h4 className="font-medium text-gray-900">Hip</h4>
              <p className="text-sm text-gray-600">Measure around the fullest part of your hips, keeping your feet together.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">💡</div>
            <div>
              <h4 className="font-medium text-gray-900">Pro Tip</h4>
              <p className="text-sm text-gray-600">For best fit, measure yourself wearing minimal clothing and keep the tape measure level.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
