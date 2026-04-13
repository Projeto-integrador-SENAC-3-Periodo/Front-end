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
import {
  proofsApi,
  activitiesApi,
  coursesApi,
  pontuacaoApi,
  notificacoesApi,
  type ApiActivity,
  type ApiCertificate,
  certificadosApi,
  userCursoApi,
  ApiNotification,
} from "@/services/api";

function uiActivityStatus(s?: string): "pending" | "approved" | "rejected" {
  if (s === "APROVADO") return "approved";
  if (s === "REPROVADO") return "rejected";
  return "pending";
}

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pontos, setPontos] = useState(0);
  const [concluidas, setConcluidas] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [recent, setRecent] = useState<ApiActivity[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [p, acts] = await Promise.all([
          pontuacaoApi.get(user.id),
          activitiesApi.listByStudent(user.id),
        ]);
        if (cancelled) return;
        setPontos(p.totalPontos);
        setConcluidas(p.atividadesConcluidas);
        setPendentes(acts.filter((a) => a.backendStatus === "PENDENTE").length);
        setRecent(acts.slice(0, 5));
      } catch {
        toast.error("Erro ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) return <CardSkeleton count={3} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Pontuação total" value={pontos} icon={Trophy} variant="accent" />
        <MetricCard title="Atividades concluídas" value={concluidas} icon={ClipboardList} />
        <MetricCard title="Atividades pendentes" value={pendentes} icon={ClipboardList} />
      </div>
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-3">Últimas atividades</h3>
        <div className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
          ) : (
            recent.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.points} pontos</p>
                </div>
                <StatusBadge status={uiActivityStatus(a.backendStatus)} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Courses ─────────────────────────────────────────────────────
function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<{ id: string; nome: string; hours: string; dataMatricula: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    userCursoApi
      .listarCursosDoAluno(user.id)
      .then(setCourses)
      .catch(() => toast.error("Erro ao carregar seus cursos"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <CardSkeleton count={2} />;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Meus Cursos</h2>
      {courses.length === 0 ? (
        <EmptyState title="Nenhum curso" description="Você ainda não foi vinculado a nenhum curso. Aguarde seu coordenador." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-card border rounded-md p-5">
              <h3 className="font-display font-semibold">{c.nome}</h3>
              <p className="text-xs text-muted-foreground mt-2">Matriculado em: {c.dataMatricula}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ─── Activities ──────────────────────────────────────────────────
function StudentActivities() {
  const { user } = useAuth();
  const [list, setList] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const cursos = await userCursoApi.listarCursosDoAluno(user.id);
      const porCurso = await Promise.all(
        cursos.map((c) => activitiesApi.listByCourse(c.id).catch(() => []))
      );  
      setList(porCurso.flat());
    } catch {
      toast.error("Erro ao carregar atividades");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <CardSkeleton count={2} />;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Minhas atividades</h2>
      {list.length === 0 ? (
        <EmptyState title="Nenhuma atividade" description="Quando o coordenador registrar atividades para você, elas aparecerão aqui." />
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const st = uiActivityStatus(a.backendStatus);
            return (
              <div key={a.id} className="bg-card border rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{a.points} pontos</span>
                    <span>•</span>
                    <span>{a.courseName}</span>
                    <span>•</span>
                    <span>{a.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={st} />
                  {st !== "approved" && (
                    <Link to="/student/submit">
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Upload className="h-3 w-3" /> Enviar
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Submit Proof ────────────────────────────────────────────────
function StudentSubmitProof() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ApiActivity[]>([]);

  useEffect(() => {
    if (!user?.id) return;
      userCursoApi.listarCursosDoAluno(user.id)
      .then((cursos) => Promise.all(cursos.map((c) => activitiesApi.listByCourse(c.id).catch(() => []))))
      .then((porCurso) => setOptions(porCurso.flat()))
      .catch(() => toast.error("Erro ao carregar atividades"));
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedActivity || !file) return;
    setSubmitting(true);
    try {
      await proofsApi.submit({
        atividadeId: selectedActivity,
        idAluno: user.id,
        file,
      });
      toast.success("Comprovante enviado com sucesso!");
      setSelectedActivity("");
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no envio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="font-display font-semibold text-lg">Enviar comprovante</h2>
      <form onSubmit={handleSubmit} className="bg-card border rounded-md p-5 space-y-4">
        <div className="space-y-2">
          <Label>Atividade</Label>
          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
            <SelectTrigger><SelectValue placeholder="Selecione a atividade" /></SelectTrigger>
            <SelectContent>
              {options.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Arquivo</Label>
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">
            Aceito: PDF, JPG, PNG — no celular você pode tirar foto diretamente
          </p>
        </div>
        <Button type="submit" className="w-full gap-2" disabled={submitting || !selectedActivity || !file}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <><Upload className="h-4 w-4" /> Enviar comprovante</>
          )}
        </Button>
      </form>
    </div>
  );
}

// ─── Score ────────────────────────────────────────────────────────
function StudentScore() {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);
  const [concluidas, setConcluidas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    pontuacaoApi
      .get(user.id)
      .then((p) => {
        setTotal(p.totalPontos);
        setConcluidas(p.atividadesConcluidas);
      })
      .catch(() => toast.error("Erro ao carregar pontuação"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <CardSkeleton count={3} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard title="Pontos acumulados" value={total} icon={Trophy} variant="accent" />
        <MetricCard title="Atividades concluídas" value={concluidas} icon={Check} />
      </div>
      <p className="text-sm text-muted-foreground">Ranking geral depende de endpoint no servidor; aqui mostramos apenas os seus dados.</p>
    </div>
  );
}

// ─── Certificates ────────────────────────────────────────────────
function StudentCertificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
      certificadosApi
      .listByAluno(user.id)
      .then((list) => setCerts(list))
      .catch(() => toast.error("Erro ao carregar certificados"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <CardSkeleton count={2} />;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Certificados</h2>
      {certs.length === 0 ? (
        <EmptyState
          title="Nenhum certificado"
          description="Após a aprovação de uma atividade, o certificado aparece aqui."
        />
      ) : (
        <div className="space-y-3">
          {certs.map((c) => (
            <div key={c.id} className="bg-card border rounded-md p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.activityTitle}</p>
                <p className="text-xs text-muted-foreground">{c.date}</p>
              </div>
              <a href={c.downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-3 w-3" /> Baixar
                </Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────
function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    notificacoesApi
      .list(user.id)
      .then((list) => setNotifications(list))
      .catch(() => toast.error("Erro ao carregar notificações"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const markAsRead = async (id: number) => {
    try {
      await notificacoesApi.marcarLida(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      toast.success("Notificação marcada como lida");
    } catch {
      toast.error("Não foi possível atualizar");
    }
  };

  if (loading) return <CardSkeleton count={2} />;

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
                <div>
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="text-xs text-muted-foreground">{n.mensagem}</p>
                </div>
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
  const [pontos, setPontos] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    pontuacaoApi.get(user.id).then((p) => setPontos(p.totalPontos)).catch(() => setPontos(null));
  }, [user?.id]);

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
              <div><p className="text-muted-foreground">Pontuação</p><p className="font-medium">{pontos != null ? `${pontos} pts` : "—"}</p></div>
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