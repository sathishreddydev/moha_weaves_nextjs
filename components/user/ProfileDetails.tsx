"use client";

import { useAuth } from "@/auth";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  LogOut,
  Mail,
  Phone,
  User,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import ProfileSkeleton from "./ProfileSkeleton";
import {
  useProfile,
  useUpdateProfile,
  type UserProfile,
} from "@/hooks/useProfileQuery";

export default function ProfileDetails() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // ─── React Query ────────────────────────────────────────────────────────────
  const { data: profile, isLoading: loading } = useProfile(!!user);

  const updateProfileMutation = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Sync form state when profile data arrives or changes
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditEmail(profile.email || "");
      setEditPhone(profile.phone || "");
    }
  }, [profile]);

  const handleEdit = () => {
    setEditing(true);
    setSuccess("");
    updateProfileMutation.reset();
  };

  const handleCancel = () => {
    setEditing(false);
    updateProfileMutation.reset();
    // Reset to current values
    if (profile) {
      setEditName(profile.name || "");
      setEditEmail(profile.email || "");
      setEditPhone(profile.phone || "");
    }
  };

  const handleSave = async () => {
    setSuccess("");

    const body: Record<string, string> = {};

    // Always send name if changed
    if (editName.trim() && editName.trim() !== profile?.name) {
      body.name = editName.trim();
    }

    // Only send email if it's not already set
    if (!profile?.email && editEmail.trim()) {
      body.email = editEmail.trim();
    }

    // Only send phone if it's not already set
    if (!profile?.phone && editPhone.trim()) {
      body.phone = editPhone.replace(/\s/g, "");
    }

    if (Object.keys(body).length === 0) {
      setEditing(false);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync(body);
      setEditing(false);
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      // Error is available via updateProfileMutation.error
    }
  };

  const handleBack = () => {
    router.push("/my");
  };

  const saving = updateProfileMutation.isPending;
  const error = updateProfileMutation.error
    ? (updateProfileMutation.error as Error).message
    : "";

  if (!user || loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div>
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Header with Edit button */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {profile?.name || "User"}
                </h2>
                <p className="text-sm text-gray-500">
                  {profile?.email || profile?.phone || ""}
                </p>
              </div>
            </div>

            {!editing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {/* Profile Fields */}
          <div className="space-y-1">
            {/* Name */}
            <div className="flex items-center justify-between py-4 border-b border-gray-50">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  {editing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-1 h-9"
                      disabled={saving}
                      label="Full Name"
                      endIcon={<User size={18} />}
                    />
                  ) : (
                    <p className="text-gray-700 font-medium">
                      {profile?.name || "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between py-4 border-b border-gray-50">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  {editing && !profile?.email ? (
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1 h-9"
                      disabled={saving}
                      label="Email"
                      endIcon={<Mail size={18} />}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-gray-700 font-medium">
                        {profile?.email || "—"}
                      </p>
                      {profile?.email && editing && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          Cannot change
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  {editing && !profile?.phone ? (
                    <div className="flex mt-1">
                      <Input
                        type="tel"
                        inputMode="numeric"
                        value={editPhone}
                        onChange={(e) =>
                          setEditPhone(e.target.value.replace(/\D/g, ""))
                        }
                        maxLength={10}
                        className="rounded-l-none h-9"
                        disabled={saving}
                        label="Phone Number"
                        endIcon={<Phone size={18} />}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-gray-700 font-medium">
                        {profile?.phone ? `+91 ${profile.phone}` : "—"}
                      </p>
                      {profile?.phone && editing && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          Cannot change
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save / Cancel buttons */}
          {editing && (
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <Check size={16} className="mr-1.5" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 h-10"
              >
                <X size={16} className="mr-1.5" />
                Cancel
              </Button>
            </div>
          )}

          {/* Logout */}
          <div className="mt-12 lg:hidden">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => logout()}
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
