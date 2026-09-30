import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'emerald' | 'purple'
}

export default function MetricCard({ title, value, icon: Icon, color = 'blue' }: Props) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl border ${colorStyles[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
}