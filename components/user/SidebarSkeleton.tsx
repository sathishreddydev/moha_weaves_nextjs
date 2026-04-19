import { Skeleton } from "@/components/ui/skeleton";

export default function SidebarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 sticky top-20">
      <nav className="space-y-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center space-x-3 px-4 py-3 rounded-lg">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}

        <div className="border-t pt-2 mt-2">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="border-t mt-6 pt-6">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </nav>
    </div>
  );
}
