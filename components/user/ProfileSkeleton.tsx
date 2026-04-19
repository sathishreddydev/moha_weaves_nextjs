import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md overflow-hidden">
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-5 mb-5">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <Skeleton className="w-5 h-5" />
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Skeleton className="w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <Skeleton className="w-5 h-5" />
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-5 h-5" />
                <div>
                  <Skeleton className="h-3 w-14 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="w-4 h-4" />
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-12">
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
