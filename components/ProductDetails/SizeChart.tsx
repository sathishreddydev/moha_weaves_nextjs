"use client";

interface SizeChartProps {
  className?: string;
}

export default function SizeChart({ className = "" }: SizeChartProps) {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Chart</h3>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Size</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Chest (inches)</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Waist (inches)</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Hip (inches)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-4 py-3 text-sm">XS</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">34-36</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">28-30</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">34-36</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-200 px-4 py-3 text-sm font-medium">S</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">36-38</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">30-32</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">36-38</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-3 text-sm font-medium">M</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">38-40</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">32-34</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">38-40</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-200 px-4 py-3 text-sm font-medium">L</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">40-42</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">34-36</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">40-42</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-4 py-3 text-sm font-medium">XL</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">42-44</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">36-38</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">42-44</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-200 px-4 py-3 text-sm font-medium">XXL</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">44-46</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">38-40</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">44-46</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
