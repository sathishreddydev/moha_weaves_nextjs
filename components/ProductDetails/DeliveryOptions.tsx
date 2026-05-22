"use client";

import { Truck } from "lucide-react";

function getEstimatedDate(daysToAdd: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function DeliveryOptions() {
  const standardDate = `${getEstimatedDate(5)} - ${getEstimatedDate(7)}`;
  const expressDate = `${getEstimatedDate(2)} - ${getEstimatedDate(3)}`;

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
        <Truck className="h-5 w-5 mr-2 text-blue-600" />
        Delivery Options
      </h3>
      <div className="text-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              Standard Delivery
            </p>
            <p className="text-gray-500">Est. {standardDate}</p>
          </div>
          <span className="text-green-600 font-medium">FREE</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              Express Delivery
            </p>
            <p className="text-gray-500">Est. {expressDate}</p>
          </div>
          <span className="text-gray-900 font-medium">₹99</span>
        </div>
      </div>
      <div className="text-xs mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-blue-800">
          <strong>Note:</strong> Delivery dates may vary based on
          your location and product availability.
        </p>
      </div>
    </div>
  );
}
