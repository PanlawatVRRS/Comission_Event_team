import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'emerald' | 'purple'
}

export default function MetricCard({ title, value, icon: Icon, color = 'blue' }: Props) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-900/60',
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between transition-colors">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl border ${colorStyles[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
}