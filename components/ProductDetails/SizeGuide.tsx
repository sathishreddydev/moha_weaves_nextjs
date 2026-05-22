"use client";

import SizeChart from "./SizeChart";
import HowToMeasure from "./HowToMeasure";
import SizeTips from "./SizeTips";
import { Ruler } from "lucide-react";
import StickyPanel from "@/components/ui/StickyPanel";

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
  return (
    <StickyPanel
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-sm font-semibold">Size Guide</span>}
      icon={<Ruler className="h-4 w-4" />}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <SizeChart />
        <HowToMeasure />
        <SizeTips />
      </div>
    </StickyPanel>
  );
}
