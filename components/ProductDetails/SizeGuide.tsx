"use client";

import SizeChart from "./SizeChart";
import HowToMeasure from "./HowToMeasure";
import SizeTips from "./SizeTips";

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Size Guide</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close size guide"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <SizeChart />
            <HowToMeasure />
            <SizeTips />
          </div>
        </div>
      </div>
    </div>
  );
}
