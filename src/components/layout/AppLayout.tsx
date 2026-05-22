import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  History, AlertTriangle, FileText, Users, Settings, LogOut, Bell,
} from 'lucide-react'
import { cn, initials, getRoleLabel } from '@/lib/utils'
import { useAuthStore } from '@/lib/authStore'
import { useAlertCount } from '@/hooks/useAlertCount'
import toast from 'react-hot-toast'

// Pages
import { DashboardPage }  from '@/pages/DashboardPage'
import { InventarioPage } from '@/pages/InventarioPage'
import { RecepcionPage }  from '@/pages/RecepcionPage'
import { DespachoPage }   from '@/pages/DespachoPage'
import { HistorialPage }  from '@/pages/HistorialPage'
import { AlertasPage }    from '@/pages/AlertasPage'
import { ReportesPage }   from '@/pages/ReportesPage'
import { AdminPage }      from '@/pages/AdminPage'
import { ConfigPage }     from '@/pages/ConfigPage'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  roles?: string[]
  badge?: number
}

interface AppLayoutProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const PAGES: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  inventario: InventarioPage,
  recepcion: RecepcionPage,
  despacho: DespachoPage,
  historial: HistorialPage,
  alertas: AlertasPage,
  reportes: ReportesPage,
  admin: AdminPage,
  config: ConfigPage,
}

const roleColorMap: Record<string, string> = {
  admin:      'bg-brand/15 text-brand-light border border-brand/20',
  bodeguero:  'bg-success-muted text-success border border-success/20',
  viewer:     'bg-warning-muted text-warning border border-warning/20',
}
const roleAvatarMap: Record<string, string> = {
  admin:     'bg-gradient-brand',
  bodeguero: 'bg-gradient-success',
  viewer:    'bg-warning',
}

export function AppLayout({ currentPage, onNavigate }: AppLayoutProps) {
  const { profile, hasRole, logout } = useAuthStore()
  const alertCount = useAlertCount()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!profile) return null

  const navItems: NavItem[] = [
    { id: 'dashboard',  label: 'Dashboard',   icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'alertas',    label: 'Alertas',      icon: <AlertTriangle   className="w-4 h-4" />, badge: alertCount },
    { id: 'inventario', label: 'Inventario',   icon: <Package         className="w-4 h-4" /> },
    { id: 'recepcion',  label: 'Recepción',    icon: <ArrowDownToLine className="w-4 h-4" />, roles: ['admin','bodeguero'] },
    { id: 'despacho',   label: 'Despacho',     icon: <ArrowUpFromLine className="w-4 h-4" />, roles: ['admin','bodeguero'] },
    { id: 'historial',  label: 'Historial',    icon: <History         className="w-4 h-4" /> },
    { id: 'reportes',   label: 'Reportes',     icon: <FileText        className="w-4 h-4" /> },
    { id: 'admin',      label: 'Usuarios',     icon: <Users           className="w-4 h-4" />, roles: ['admin'] },
    { id: 'config',     label: 'Configuración',icon: <Settings        className="w-4 h-4" />, roles: ['admin'] },
  ]

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(profile.role)
  )
  const canAccessCurrentPage = visibleItems.some((item) => item.id === currentPage)
  const effectivePage = canAccessCurrentPage ? currentPage : 'dashboard'

  useEffect(() => {
    if (!canAccessCurrentPage) {
      onNavigate('dashboard')
    }
  }, [canAccessCurrentPage, onNavigate])

  const handleLogout = async () => {
    await logout()
    toast.success('Sesión cerrada')
  }

  const PageComponent = PAGES[effectivePage] ?? DashboardPage

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Topbar */}
      <header className="h-14 bg-surface-1 border-b border-white/8 flex items-center px-4 gap-4 z-40 sticky top-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-8 h-8 rounded-lg hover:bg-surface-2 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-brand rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-200 tracking-tight">StockFlow</span>
        </div>

        <div className="flex-1" />

        {/* Alert bell */}
        <button
          onClick={() => onNavigate('alertas')}
          className="relative w-9 h-9 rounded-lg hover:bg-surface-2 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-white/8">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
            roleAvatarMap[profile.role] ?? 'bg-slate-600',
          )}>
            {initials(profile.full_name)}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-slate-300 leading-tight">{profile.full_name.split(' ')[0]}</div>
            <div className={cn('text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm mt-0.5 inline-block', roleColorMap[profile.role])}>
              {getRoleLabel(profile.role)}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center text-slate-500 hover:text-danger transition-colors ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          'bg-surface-1 border-r border-white/8 flex flex-col transition-all duration-200 overflow-hidden',
          sidebarOpen ? 'w-56' : 'w-0',
        )}>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-w-56">
            {/* Principal group */}
            <SidebarSection label="Principal">
              {visibleItems.slice(0, 2).map((item) => (
                <NavButton key={item.id} item={item} active={effectivePage === item.id} onClick={() => onNavigate(item.id)} />
              ))}
            </SidebarSection>

            {/* Operaciones */}
            {hasRole('admin', 'bodeguero') && (
              <SidebarSection label="Operaciones">
                {visibleItems.filter(i => ['inventario','recepcion','despacho','historial'].includes(i.id)).map((item) => (
                  <NavButton key={item.id} item={item} active={effectivePage === item.id} onClick={() => onNavigate(item.id)} />
                ))}
              </SidebarSection>
            )}
            {profile.role === 'viewer' && (
              <SidebarSection label="Consulta">
                {visibleItems.filter(i => ['inventario','historial'].includes(i.id)).map((item) => (
                  <NavButton key={item.id} item={item} active={effectivePage === item.id} onClick={() => onNavigate(item.id)} />
                ))}
              </SidebarSection>
            )}

            {/* Analisis */}
            <SidebarSection label="Análisis">
              {visibleItems.filter(i => ['reportes'].includes(i.id)).map((item) => (
                <NavButton key={item.id} item={item} active={effectivePage === item.id} onClick={() => onNavigate(item.id)} />
              ))}
            </SidebarSection>

            {/* Admin */}
            {hasRole('admin') && (
              <SidebarSection label="Administración">
                {visibleItems.filter(i => ['admin','config'].includes(i.id)).map((item) => (
                  <NavButton key={item.id} item={item} active={effectivePage === item.id} onClick={() => onNavigate(item.id)} />
                ))}
              </SidebarSection>
            )}
          </nav>

          {/* Bottom user info */}
          <div className="p-3 border-t border-white/8">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-2/60">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0', roleAvatarMap[profile.role])}>
                {initials(profile.full_name)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-300 truncate">{profile.full_name}</div>
                <div className="text-[10px] text-slate-500">{getRoleLabel(profile.role)}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <PageComponent />
        </main>
      </div>
    </div>
  )
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-100 group',
        active
          ? 'bg-brand/10 text-brand-light border border-brand/15'
          : 'text-slate-400 hover:bg-surface-2 hover:text-slate-200 border border-transparent',
      )}
    >
      <span className={cn('flex-shrink-0', active ? 'text-brand' : 'text-slate-500 group-hover:text-slate-300')}>
        {item.icon}
      </span>
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {item.badge}
        </span>
      )}
    </button>
  )
}
