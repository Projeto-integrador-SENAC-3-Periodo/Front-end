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
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-senac-blue text-white transition-all duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "w-16" : "w-64"}`}>
        <div className="flex items-center h-16 border-b border-white/10 px-4">
          {!collapsed && (
             <div>
               <h2 className="font-bold text-lg">SENAC</h2>
               <p className="text-[10px] text-white/60">Atividades Complementares</p>
             </div>
          )}
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-white/70"><X className="h-6 w-6" /></button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${location.pathname === item.path ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/5"}`}>
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{forceCorrectLabel(item.path, item.label)}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 pb-24 lg:pb-4 border-t border-white/10">
          {!collapsed && (
            <div className="mb-4 px-2">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">{roleLabel}</p>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-full px-2 py-2 rounded-md hover:bg-white/5">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-senac-orange shadow-md flex items-center justify-between px-4 lg:px-6 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></Button>
            <h1 className="font-bold text-white text-lg">{forceCorrectLabel(location.pathname, title)}</h1>
          </div>
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-senac-blue text-sm font-black shadow-sm ring-2 ring-white/20">
            {user?.name?.charAt(0)}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-24">{children}</main>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex lg:hidden justify-around items-center h-16 px-2 z-50 shadow-lg">
          <Link to={getBasePath()} className={`flex flex-col items-center gap-1 ${location.pathname === getBasePath() ? "text-senac-blue" : "text-gray-400"}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold">Dashboard</span>
          </Link>

          {user?.role === "student" ? (
            <>
              <Link to="/student/activities" className={`flex flex-col items-center gap-1 ${location.pathname === "/student/activities" ? "text-senac-blue" : "text-gray-400"}`}>
                <ClipboardList className="h-5 w-5" />
                <span className="text-[10px] font-bold">Atividades</span>
              </Link>
              <Link to="/student/proofs" className={`flex flex-col items-center gap-1 ${location.pathname === "/student/proofs" ? "text-senac-blue" : "text-gray-400"}`}>
                <FileUp className="h-5 w-5" />
                <span className="text-[10px] font-bold">Enviar</span>
              </Link>
            </>
          ) : (
            <>
              <Link to={user?.role === "admin" ? "/admin/users" : "/coordinator/students"} className={`flex flex-col items-center gap-1 ${location.pathname.includes("users") || location.pathname.includes("students") ? "text-senac-blue" : "text-gray-400"}`}>
                <Users className="h-5 w-5" />
                <span className="text-[10px] font-bold">{user?.role === "admin" ? "Usuários" : "Alunos"}</span>
              </Link>
              <Link to={user?.role === "admin" ? "/admin/courses" : "/coordinator/courses"} className={`flex flex-col items-center gap-1 ${location.pathname.includes("courses") ? "text-senac-blue" : "text-gray-400"}`}>
                <BookOpen className="h-5 w-5" />
                <span className="text-[10px] font-bold">Cursos</span>
              </Link>
            </>
          )}

          <Link to={`${getBasePath()}/notifications`} className={`flex flex-col items-center gap-1 ${location.pathname.includes("notifications") ? "text-senac-blue" : "text-gray-400"}`}>
            <Bell className="h-5 w-5" />
            <span className="text-[10px] font-bold">Notificações</span>
          </Link>
          
          <Link to={`${getBasePath()}/profile`} className={`flex flex-col items-center gap-1 ${location.pathname.includes("profile") ? "text-senac-blue" : "text-gray-400"}`}>
            <User className="h-5 w-5" />
            <span className="text-[10px] font-bold">Perfil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}