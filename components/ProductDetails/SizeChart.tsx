"use client";

interface SizeChartProps {
  className?: string;
}

export default function SizeChart({ className = "" }: SizeChartProps) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Size Chart</h3>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-900">Size</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-900">Chest (in)</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-900">Waist (in)</th>
              <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-900">Hip (in)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-3 py-2 text-xs font-medium">XS</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">34-36</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">28-30</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">34-36</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-200 px-3 py-2 text-xs font-medium">S</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">36-38</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">30-32</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">36-38</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2 text-xs font-medium">M</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">38-40</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">32-34</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">38-40</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-200 px-3 py-2 text-xs font-medium">L</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">40-42</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">34-36</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">40-42</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2 text-xs font-medium">XL</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">42-44</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">36-38</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">42-44</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-200 px-3 py-2 text-xs font-medium">XXL</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">44-46</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">38-40</td>
              <td className="border border-gray-200 px-3 py-2 text-xs">44-46</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
