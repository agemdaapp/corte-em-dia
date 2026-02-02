import { NavLink } from 'react-router-dom'

type NavItem =
  | {
      label: string
      to: string
    }
  | {
      label: string
      onClick: () => void
    }

type TopNavProps = {
  title?: string
  items: NavItem[]
}

function TopNav({ title = 'Corte em Dia', items }: TopNavProps) {
  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold text-slate-900">{title}</div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {items.map((item) => {
            if ('to' in item) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm border transition ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="px-3 py-1.5 rounded-md text-sm border transition border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export type { NavItem }
export default TopNav
