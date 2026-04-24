import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  type LucideIcon, Menu, X, LogOut, ChevronLeft, 
  LayoutDashboard, ClipboardList, FileUp, Trophy, User, Bell, Users, BookOpen
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const roleLabel = user?.role === "admin" ? "Administrador" : user?.role === "coordinator" ? "Coordenador" : "Aluno";

  const forceCorrectLabel = (path: string, originalLabel: string) => {
    if (path.endsWith("/admin") || path.endsWith("/coordinator") || path.endsWith("/student")) return "Dashboard";
    if (path.includes("notifications")) return "Notificações";
    return originalLabel;
  };

  const getBasePath = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "coordinator") return "/coordinator";
    return "/student";
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar com o azul oficial [#002d5e] */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#002d5e] text-white transition-all duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "w-16" : "w-64"}`}>
        <div className="flex items-center h-16 border-b border-white/10 px-4">
          {!collapsed && (
             <div className="flex items-center gap-2">
               <img src="/marca_senac.png" alt="Senac" className="h-6 brightness-0 invert" />
               <div className="h-6 w-[1px] bg-white/20 mx-1" />
               <div>
                 <p className="text-[10px] font-bold text-white/60 leading-none">Portal</p>
                 <p className="text-[10px] font-bold text-white leading-none">Acadêmico</p>
               </div>
             </div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-white/70"><X className="h-6 w-6" /></button>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? "bg-white/10 text-orange-500 font-bold shadow-sm" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-orange-500" : ""}`} />
                {!collapsed && <span>{forceCorrectLabel(item.path, item.label)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 pb-24 lg:pb-6 border-t border-white/10 bg-black/10">
          {!collapsed && (
            <div className="mb-4 px-2">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-orange-500 uppercase tracking-widest font-black">{roleLabel}</p>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-3 text-sm text-white/60 hover:text-red-400 transition-colors w-full px-2 py-2 rounded-lg hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="font-bold">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho com a borda inferior laranja */}
        <header className="h-16 bg-white border-b-2 border-orange-500 flex items-center justify-between px-4 lg:px-8 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></Button>
            <h1 className="font-bold text-slate-800 text-lg uppercase tracking-tight">{forceCorrectLabel(location.pathname, title)}</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sessão Ativa</span>
                <span className="text-[11px] font-bold text-[#002d5e]">Recife - PE</span>
             </div>
             <div className="h-10 w-10 rounded-xl bg-[#002d5e] flex items-center justify-center text-white text-sm font-black shadow-lg">
               {user?.name?.charAt(0)}
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-24 bg-[#F8FAFC]">{children}</main>

        {/* Bottom Nav Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex lg:hidden justify-around items-center h-16 px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Link to={getBasePath()} className={`flex flex-col items-center gap-1 ${location.pathname === getBasePath() ? "text-orange-500" : "text-gray-400"}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold tracking-tight">Home</span>
          </Link>
          
          <Link to={`${getBasePath()}/notifications`} className={`flex flex-col items-center gap-1 ${location.pathname.includes("notifications") ? "text-orange-500" : "text-gray-400"}`}>
            <Bell className="h-5 w-5" />
            <span className="text-[10px] font-bold tracking-tight">Avisos</span>
          </Link>

          <Link to={`${getBasePath()}/profile`} className={`flex flex-col items-center gap-1 ${location.pathname.includes("profile") ? "text-orange-500" : "text-gray-400"}`}>
            <User className="h-5 w-5" />
            <span className="text-[10px] font-bold tracking-tight">Perfil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}