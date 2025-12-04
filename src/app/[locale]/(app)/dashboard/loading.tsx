import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
        <div className="w-full">
            <Skeleton className="h-6 w-32 mb-3 rounded-full" />
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full shrink-0" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full min-h-[280px] flex flex-col justify-between overflow-hidden">
             <div className="p-6 space-y-6">
                 <div className="flex justify-between items-start">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                 </div>
             </div>
             <div className="p-6 bg-muted/20 border-t mt-auto">
                <Skeleton className="h-4 w-24" />
             </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
