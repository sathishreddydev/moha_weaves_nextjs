import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

const ShippingAddress = ({ address }: { address: string | any }) => {
  const addressData = useMemo(() => {
    if (!address) return { name: 'No address', address: '' };
    
    if (typeof address === "object") return address;
    
    if (typeof address === "string") {
      try {
        return JSON.parse(address);
      } catch (error) {
        console.warn('Failed to parse address JSON:', error);
        return { name: address, address: address };
      }
    }
    
    return { name: 'Invalid address', address: '' };
  }, [address]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("bottom-right");
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto positioning
  useEffect(() => {
    if (open && ref.current && dropdownRef.current) {
      const triggerRect = ref.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      const spaceRight = window.innerWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;

      let vertical =
        spaceBelow < dropdownRect.height && spaceAbove > spaceBelow
          ? "top"
          : "bottom";

      let horizontal =
        spaceRight < dropdownRect.width && spaceLeft > spaceRight
          ? "left"
          : "right";

      setPosition(`${vertical}-${horizontal}`);
    }
  }, [open]);

  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "bottom-full right-0 mb-2 origin-bottom-right";
      case "top-left":
        return "bottom-full left-0 mb-2 origin-bottom-left";
      case "bottom-left":
        return "top-full left-0 origin-top-left";
      default:
        return "top-full right-0 origin-top-right"; // bottom-right
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        className="text-xs font-semibold cursor-pointer flex items-center"
        onClick={() => setOpen((prev) => !prev)}
      >
        {addressData.name}
        <span>
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </div>

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`text-xs absolute ${getPositionClasses()} w-max max-w-xs bg-white border rounded shadow-md p-2 text-gray-600 whitespace-pre-line transition-all duration-200 ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {addressData.name && addressData.name !== "No address" 
          ? `${addressData.name}\n${addressData.address || ""}${addressData.locality ? `\n${addressData.locality}` : ""}${addressData.city ? `\n${addressData.city}` : ""}${addressData.pincode ? `\n${addressData.pincode}` : ""}${addressData.phone ? `\nPhone: ${addressData.phone}` : ""}`.replace(/\n+/g, '\n').trim()
          : "No address details available"}
      </div>
    </div>
  );
};

export default ShippingAddress;
