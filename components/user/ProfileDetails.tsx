"use client";

import { signOut, useAuth } from "@/auth";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
const MinimalItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-4 group cursor-pointer border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-4">
      <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-tight">
          {label}
        </p>
        <p className="text-gray-700 font-medium">{value}</p>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 md:hidden" />
  </div>
);
export default function ProfileDetails() {
  const { user } = useAuth();
  const router = useRouter();

  const handleBack = () => {
    router.push("/my");
  };
  return (
    <div className="space-y-4">
      <div className="">
        <div className="flex items-center justify-between border-b border-gray-50">
          <div
            onClick={handleBack}
            className="flex items-center gap-4 cursor-pointer lg:hidden"
          >
            <ArrowLeft className="w-6 h-6 text-gray-500" color="#1F2937" />
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md overflow-hidden">
        <div className="p-6">
          <div>
            {/* Simple Header */}
            <div className="flex items-center gap-5 mb-5">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {user?.name || ""}
                </h2>
              </div>
            </div>

            {/* Minimal List Grid */}
            <div>
              <MinimalItem
                label="Full Name"
                value={user?.name || ""}
                icon={<User size={18} />}
              />
              <MinimalItem
                label="Email"
                value={user?.email || ""}
                icon={<Mail size={18} />}
              />
              <MinimalItem
                label="Phone"
                value={user?.phone || ""}
                icon={<Phone size={18} />}
              />
            </div>

            <div className="mt-12 lg:hidden">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
