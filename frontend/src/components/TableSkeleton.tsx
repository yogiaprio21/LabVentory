import cls from 'classnames'

interface TableSkeletonProps {
    rows?: number
    cols?: number
}

export default function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
    return (
        <div className="w-full animate-pulse">
            <div className="bg-slate-50/50 h-12 w-full border-b border-slate-100 flex items-center px-8 gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-3 bg-slate-200 rounded-full flex-1" />
                ))}
            </div>
            <div className="divide-y divide-slate-50">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="py-6 px-8 flex items-center gap-4">
                        {Array.from({ length: cols }).map((_, colIndex) => (
                            <div key={colIndex} className={cls(
                                "h-4 bg-slate-100 rounded-lg flex-1",
                                colIndex === 0 ? "w-1/3" : "w-full"
                            )} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
