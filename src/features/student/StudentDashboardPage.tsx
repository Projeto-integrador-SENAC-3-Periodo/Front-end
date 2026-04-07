import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { type NavItem } from "@/components/layout/DashboardLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { CardSkeleton } from "@/components/shared/CardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, BookOpen, ClipboardList, Upload, Trophy, Award, Bell, User, Download, Check,
} from "lucide-react";
import { Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import { proofsApi, activitiesApi, type ApiActivity } from "@/services/api";

// ─── Nav Items (Sidebar) ─────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Dashboard", path: "/student", icon: LayoutDashboard },
  { label: "Meus Cursos", path: "/student/courses", icon: BookOpen },
  { label: "Minhas Atividades", path: "/student/activities", icon: ClipboardList },
  { label: "Enviar Comprovante", path: "/student/submit", icon: Upload },
  { label: "Pontuação", path: "/student/score", icon: Trophy },
  { label: "Certificados", path: "/student/certificates", icon: Award },
  { label: "Notificações", path: "/student/notifications", icon: Bell },
  { label: "Perfil", path: "/student/profile", icon: User },
];

const bottomNavItems = [
  { label: "Dashboard", path: "/student", icon: LayoutDashboard },
  { label: "Atividades", path: "/student/activities", icon: ClipboardList },
  { label: "Enviar", path: "/student/submit", icon: Upload },
  { label: "Pontuação", path: "/student/score", icon: Trophy },
  { label: "Perfil", path: "/student/profile", icon: User },
];

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-center justify-around h-16 lg:hidden safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {bottomNavItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] transition-colors ${active ? "text-senac-blue font-bold" : "text-muted-foreground"}`}
          >
            <item.icon className={`h-5 w-5 ${active ? "text-senac-blue" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────
function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);
  if (loading) return <CardSkeleton count={3} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Pontuação Total" value={45} icon={Trophy} variant="accent" />
        <MetricCard title="Atividades Concluídas" value={3} icon={ClipboardList} />
        <MetricCard title="Atividades Pendentes" value={2} icon={ClipboardList} />
      </div>
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-3">Últimas Atividades</h3>
        <div className="space-y-3">
          {[
            { title: "Palestra de IA", status: "approved" as const, points: 10 },
            { title: "Workshop React", status: "pending" as const, points: 20 },
            { title: "Seminário UX", status: "rejected" as const, points: 15 },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.points} pontos</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Courses ─────────────────────────────────────────────────────
function StudentCourses() {
  const courses = [
    { name: "Desenvolvimento Web", hours: "120h", progress: "60%" },
    { name: "Análise de Dados", hours: "80h", progress: "30%" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Meus Cursos</h2>
      {courses.length === 0 ? (
        <EmptyState title="Nenhum curso" description="Você ainda não está vinculado a nenhum curso." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c, i) => (
            <div key={i} className="bg-card border rounded-md p-5">
              <h3 className="font-display font-semibold">{c.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Carga horária: {c.hours}</p>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progresso</span><span className="font-medium">{c.progress}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: c.progress }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Activities ──────────────────────────────────────────────────
const myActivities = [
  { id: "1", title: "Palestra de IA", description: "Palestra sobre inteligência artificial", points: 10, proofType: "Certificado", status: "approved" as const },
  { id: "2", title: "Workshop React", description: "Workshop prático de React", points: 20, proofType: "Foto", status: "pending" as const },
  { id: "3", title: "Seminário UX", description: "Seminário sobre UX Design", points: 15, proofType: "Documento", status: "rejected" as const },
  { id: "4", title: "Hackathon 2024", description: "Competição de programação", points: 30, proofType: "Certificado", status: "pending" as const },
];

function StudentActivities() {
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Minhas Atividades</h2>
      {myActivities.length === 0 ? (
        <EmptyState title="Nenhuma atividade" description="Não há atividades disponíveis no momento." />
      ) : (
        <div className="space-y-3">
          {myActivities.map((a) => (
            <div key={a.id} className="bg-card border rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.description}</p>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{a.points} pontos</span>
                  <span>•</span>
                  <span>{a.proofType}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                {a.status !== "approved" && (
                  <Link to="/student/submit">
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <Upload className="h-3 w-3" /> Enviar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Submit Proof ────────────────────────────────────────────────
function StudentSubmitProof() {
  const [submitting, setSubmitting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [fileName, setFileName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await proofsApi.submit({
      studentId: "3",
      studentName: "João Pedro",
      activityId: selectedActivity,
      activityTitle: myActivities.find(a => a.id === selectedActivity)?.title || "",
      fileName,
    });
    setSubmitting(false);
    toast.success("Comprovante enviado com sucesso!");
    setSelectedActivity("");
    setFileName("");
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="font-display font-semibold text-lg">Enviar Comprovante</h2>
      <form onSubmit={handleSubmit} className="bg-card border rounded-md p-5 space-y-4">
        <div className="space-y-2">
          <Label>Atividade</Label>
          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
            <SelectTrigger><SelectValue placeholder="Selecione a atividade" /></SelectTrigger>
            <SelectContent>
              {myActivities.filter(a => a.status !== "approved").map(a => (
                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Arquivo</Label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFileName(e.target.files?.[0]?.name || "")} />
          <p className="text-xs text-muted-foreground">Aceito: PDF, JPG, PNG (máx. 5MB)</p>
        </div>
        <Button type="submit" className="w-full gap-2" disabled={submitting || !selectedActivity}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <><Upload className="h-4 w-4" /> Enviar Comprovante</>
          )}
        </Button>
      </form>
    </div>
  );
}

// ─── Score ────────────────────────────────────────────────────────
function StudentScore() {
  const ranking = [
    { pos: 1, name: "Ana Silva", points: 85 },
    { pos: 2, name: "Pedro Santos", points: 60 },
    { pos: 3, name: "João Pedro", points: 45 },
    { pos: 4, name: "Lucas Oliveira", points: 30 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Pontos Acumulados" value={45} icon={Trophy} variant="accent" />
        <MetricCard title="Atividades Concluídas" value={3} icon={Check} />
        <MetricCard title="Posição no Ranking" value="3º" icon={Trophy} />
      </div>
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-3">Ranking</h3>
        <div className="space-y-2">
          {ranking.map((r) => (
            <div key={r.pos} className={`flex items-center justify-between p-3 rounded-md ${r.name === "João Pedro" ? "bg-primary/5 border border-primary/20" : ""}`}>
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${r.pos <= 3 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  {r.pos}
                </span>
                <span className="text-sm font-medium">{r.name}</span>
              </div>
              <span className="text-sm font-display font-bold">{r.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Certificates ────────────────────────────────────────────────
function StudentCertificates() {
  const certs = [
    { activity: "Palestra de IA", date: "2024-03-15" },
    { activity: "Curso Online Python", date: "2024-02-20" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Certificados</h2>
      {certs.length === 0 ? (
        <EmptyState title="Nenhum certificado" description="Certificados serão gerados após aprovação." />
      ) : (
        <div className="space-y-3">
          {certs.map((c, i) => (
            <div key={i} className="bg-card border rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.activity}</p>
                <p className="text-xs text-muted-foreground">{c.date}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-3 w-3" /> Baixar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────
function StudentNotifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, msg: "Sua atividade 'Palestra de IA' foi aprovada!", type: "approved", read: false },
    { id: 2, msg: "Comprovante do 'Seminário UX' foi rejeitado", type: "rejected", read: false },
    { id: 3, msg: "Nova atividade disponível: Hackathon 2024", type: "new", read: true },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Notificação marcada como lida");
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Notificações</h2>
      {notifications.length === 0 ? (
        <EmptyState title="Nenhuma notificação" description="Você está em dia!" />
      ) : (
        <div className="bg-card border rounded-md divide-y">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-center justify-between p-4 ${!n.read ? "bg-primary/5" : ""}`}>
              <div className="flex items-center gap-3">
                {!n.read && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                <span className="text-sm">{n.msg}</span>
              </div>
              {!n.read && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAsRead(n.id)}>
                  Marcar como lida
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────
function StudentProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name });
    toast.success("Perfil atualizado!");
    setEditing(false);
    setPassword("");
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-display font-semibold text-lg mb-4">Meu Perfil</h2>
      <div className="bg-card border rounded-md p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-senac-blue flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-display font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Matrícula: {user?.matricula}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Nova Senha (opcional)</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
              <div><p className="text-muted-foreground">Curso</p><p className="font-medium">ADS</p></div>
              <div><p className="text-muted-foreground">Pontuação</p><p className="font-medium">45 pontos</p></div>
            </div>
            <Button variant="outline" onClick={() => setEditing(true)} className="w-full">Editar Perfil</Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Title Map & Router ──────────────────────────────────────────
const titleMap: Record<string, string> = {
  "/student": "Dashboard",
  "/student/courses": "Meus Cursos",
  "/student/activities": "Minhas Atividades",
  "/student/submit": "Enviar Comprovante",
  "/student/score": "Pontuação",
  "/student/certificates": "Certificados",
  "/student/notifications": "Notificações",
  "/student/profile": "Perfil",
};

export default function StudentDashboardPage() {
  const location = useLocation();
  const title = titleMap[location.pathname] || "Dashboard";
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout navItems={navItems} title={title}>
        <div className="pb-24 lg:pb-8 px-4">
          <Routes>
            <Route index element={<StudentDashboard />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="activities" element={<StudentActivities />} />
            <Route path="submit" element={<StudentSubmitProof />} />
            <Route path="score" element={<StudentScore />} />
            <Route path="certificates" element={<StudentCertificates />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="profile" element={<StudentProfile />} />
          </Routes>
        </div>
      </DashboardLayout>
      <BottomNav />
    </div>
  );
}