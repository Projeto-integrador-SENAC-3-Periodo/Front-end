import { useState, useEffect, useCallback } from "react";
import { DashboardLayout, type NavItem } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ModalForm } from "@/components/shared/ModalForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { CardSkeleton } from "@/components/shared/CardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Bell, FileText, Plus, Pencil, Trash2, User,
} from "lucide-react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  usersApi,
  coursesApi,
  activitiesApi,
  logsApi,
  proofsApi,
  pontuacaoApi,
  tiposAtividadeApi,
  notificacoesApi,
  categoriaAtividadeApi,
  type ApiUser,
  type ApiCourse,
  type ApiActivity,
  type ApiLog,
  type ApiNotification,
} from "@/services/api";

// ─── Nav Items (Sidebar) ─────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Usuários", path: "/admin/users", icon: Users },
  { label: "Cursos", path: "/admin/courses", icon: BookOpen },
  { label: "Atividades", path: "/admin/activities", icon: ClipboardList },
  { label: "Notificações", path: "/admin/notifications", icon: Bell },
  { label: "Logs", path: "/admin/logs", icon: FileText },
  { label: "Perfil", path: "/admin/profile", icon: User },
];

const bottomNavItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Usuários", path: "/admin/users", icon: Users },
  { label: "Cursos", path: "/admin/courses", icon: BookOpen },
  { label: "Logs", path: "/admin/logs", icon: FileText },
  { label: "Perfil", path: "/admin/profile", icon: User },
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
function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ alunos: 0, cursos: 0, atividades: 0, concluidas: 0 });
  const [logs, setLogs] = useState<ApiLog[]>([]);

  useEffect(() => {
    Promise.all([
      usersApi.list(),
      coursesApi.list(),
      activitiesApi.list(),
      logsApi.list(),
    ])
      .then(([users, courses, activities, recentLogs]) => {
        setMetrics({
          alunos: users.filter((u) => u.role === "student").length,
          cursos: courses.length,
          atividades: activities.length,
          concluidas: activities.filter((a) => a.backendStatus === "APROVADO").length,
        });
        setLogs(recentLogs.slice(0, 4));
      })
      .catch(() => toast.error("Erro ao carregar métricas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total de Alunos" value={metrics.alunos} icon={Users} />
        <MetricCard title="Total de Cursos" value={metrics.cursos} icon={BookOpen} />
        <MetricCard title="Atividades Cadastradas" value={metrics.atividades} icon={ClipboardList} variant="accent" />
        <MetricCard title="Atividades Concluídas" value={metrics.concluidas} icon={ClipboardList} />
      </div>
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-3">Atividade Recente</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm py-2 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div>
                  <span>{log.action}</span>
                  <span className="text-xs text-muted-foreground ml-2">{log.user} · {log.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────
function AdminUsers() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [formData, setFormData] = useState({ name: "", email: "", matricula: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await usersApi.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", matricula: "" });
    setSelectedProfile("");
    setModalOpen(true);
  };

  const openEdit = (user: ApiUser) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, matricula: user.matricula });
    setSelectedProfile(user.role);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profileLabel = selectedProfile === "admin" ? "Administrador" : selectedProfile === "coordinator" ? "Coordenador" : "Aluno";
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role:
            selectedProfile === "admin"
              ? "admin"
              : selectedProfile === "coordinator"
              ? "coordinator"
              : "student",
          matricula: selectedProfile === "student" ? formData.matricula : "-",
    });
        toast.success("Usuário atualizado!");
      } else {
        const mapPerfil = (role: string) => {
          switch (role) {
            case "admin":
              return "ADMINISTRADOR";
            case "coordinator":
              return "COORDENADOR";
            case "student":
              return "ALUNO";
          }
        };

        await usersApi.create({
          nome: formData.name,
          email: formData.email,
          perfil: selectedProfile === "admin" ? "ADMINISTRADOR" : selectedProfile === "coordinator" ? "COORDENADOR" : "ALUNO",
          matricula: selectedProfile === "student" ? formData.matricula : null,
});
toast.success("Usuário criado! As credenciais foram enviadas por e-mail.");
        toast.success("Usuário criado! As credenciais foram enviadas por e-mail.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar usuário");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await usersApi.delete(deleteId);
      toast.success("Usuário excluído!");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir usuário");
    }
  };

  const columns: Column<ApiUser>[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    { key: "profile", header: "Perfil", render: (item: ApiUser) => (
      <span className={`badge-status ${item.profile === "Administrador" ? "bg-primary/10 text-primary" : item.profile === "Coordenador" ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}`}>
        {item.profile}
      </span>
    )},
    { key: "matricula", header: "Matrícula" },
    { key: "actions", header: "Ações", render: (item: ApiUser) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(item); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Usuários</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
      </div>

      {loading ? <TableSkeleton columns={4} /> : data.length === 0 ? <EmptyState title="Nenhum usuário" description="Clique em 'Novo Usuário' para começar." /> : <DataTable columns={columns} data={data} />}

      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editingUser ? "Editar Usuário" : "Novo Usuário"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome completo" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@senac.br" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
          <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded p-2">
  ℹ              Uma senha provisória será gerada automaticamente e enviada por e-mail ao usuário.
         </p>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={selectedProfile} onValueChange={(v: string) => setSelectedProfile(v)} required>
              <SelectTrigger><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="coordinator">Coordenador</SelectItem>
                <SelectItem value="student">Aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedProfile === "student" && (
            <div className="space-y-2"><Label>Matrícula</Label><Input placeholder="Ex: 2024001" required value={formData.matricula} onChange={e => setFormData(p => ({ ...p, matricula: e.target.value }))} /></div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingUser ? "Salvar" : "Criar Usuário"}</Button>
          </div>
        </form>
      </ModalForm>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Usuário" description="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita." onConfirm={handleDelete} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Courses ─────────────────────────────────────────────────────
function AdminCourses() {
  const [data, setData] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCourse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", hours: "", coordinatorId: "2" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await coursesApi.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar cursos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData({ name: "", description: "", hours: "", coordinatorId: "2" }); setModalOpen(true); };
  const openEdit = (c: ApiCourse) => { setEditing(c); setFormData({ name: c.name, description: c.description, hours: c.hours, coordinatorId: c.coordinatorId }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, coordinatorName: "—" };
    try {
      if (editing) {
        await coursesApi.update(editing.id, payload);
        toast.success("Curso atualizado!");
      } else {
        await coursesApi.create(payload);
        toast.success("Curso criado!");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar curso");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await coursesApi.delete(deleteId);
      toast.success("Curso excluído!");
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  const columns: Column<ApiCourse>[] = [
    { key: "name", header: "Nome" },
    { key: "description", header: "Descrição" },
    { key: "hours", header: "Carga Horária" },
    { key: "coordinatorName", header: "Coordenador" },
    { key: "studentCount", header: "Alunos" },
    { key: "actions", header: "Ações", render: (item: ApiCourse) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(item); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Cursos</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Curso</Button>
      </div>
      {loading ? <TableSkeleton columns={6} /> : data.length === 0 ? <EmptyState title="Nenhum curso" description="Crie o primeiro curso." /> : <DataTable columns={columns} data={data} />}

      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Curso" : "Novo Curso"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome do curso" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Carga Horária</Label><Input placeholder="Ex: 120h" required value={formData.hours} onChange={e => setFormData(p => ({ ...p, hours: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Criar Curso"}</Button>
          </div>
        </form>
      </ModalForm>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Curso" description="Tem certeza? Atividades vinculadas serão removidas." onConfirm={handleDelete} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Activities ──────────────────────────────────────────────────
const statusAtividadePt: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};

function AdminActivities() {
  const [data, setData] = useState<ApiActivity[]>([]);
  const [coursesList, setCoursesList] = useState<ApiCourse[]>([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiActivity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    tipoAtividadeId: "",
    categoriaId: "",
    points: "",
    horas: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acts, courses, t, cats] = await Promise.all([
        activitiesApi.list(),
        coursesApi.list(),
        tiposAtividadeApi.list(),
        categoriaAtividadeApi.list(),
      ]);
      setData(acts);
      setCoursesList(courses);
      setTipos(t.map((x) => ({ id: x.id, nome: x.nome })));
      setCategorias(cats.map((x) => ({ id: x.id, nome: x.nome })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar atividades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
   setFormData({ title: "", description: "", courseId: "", tipoAtividadeId: "", categoriaId: "", points: "", horas: "" });
    setModalOpen(true);
  };

  const openEdit = (a: ApiActivity) => {
    setEditing(a);
    setFormData({
      title: a.title,
      description: a.description,
      courseId: a.courseId,
      tipoAtividadeId: a.idTipoAtividade ?? "",
      categoriaId: "",
      points: String(a.points),
      horas: a.horasSolicitadas != null ? String(a.horasSolicitadas) : "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = Number(formData.points);
    const horas = formData.horas.trim() ? Number(formData.horas) : undefined;
    const payload = {
      title: formData.title,
      description: formData.description,
      courseId: formData.courseId,
      tipoAtividadeId: formData.tipoAtividadeId,
      points: pts,
      horasSolicitadas: horas,
    };
    try {
      if (editing) {
        await activitiesApi.update(editing.id, payload);
        toast.success("Atividade atualizada!");
      } else {
        await activitiesApi.create(payload);
        toast.success("Atividade criada!");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar atividade");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await activitiesApi.delete(deleteId);
      toast.success("Atividade excluída!");
      setDeleteId(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  };

  const columns: Column<ApiActivity>[] = [
    { key: "title", header: "Nome" },
    { key: "nomeAluno", header: "Aluno", render: (item: ApiActivity) => <span>{item.nomeAluno || "—"}</span> },
    { key: "courseName", header: "Curso" },
    { key: "category", header: "Tipo" },
    { key: "points", header: "Pontos" },
    {
      key: "backendStatus",
      header: "Status",
      render: (item: ApiActivity) => (
        <span>{statusAtividadePt[item.backendStatus ?? ""] ?? item.backendStatus ?? "—"}</span>
      ),
    },
    { key: "actions", header: "Ações", render: (item: ApiActivity) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); openEdit(item); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Atividades</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Atividade</Button>
      </div>
      {loading ? <TableSkeleton columns={7} /> : data.length === 0 ? <EmptyState title="Nenhuma atividade" /> : <DataTable columns={columns} data={data} />}

      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Atividade" : "Nova Atividade"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Título</Label><Input placeholder="Título" required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
       <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded p-2">
          O aluno seleciona esta atividade ao enviar o comprovante. Aqui você cadastra o modelo disponível para o curso.
        </p>
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={formData.courseId} onValueChange={(v: string) => setFormData(p => ({ ...p, courseId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{coursesList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de atividade</Label>
            <Select value={formData.tipoAtividadeId} onValueChange={(v: string) => setFormData(p => ({ ...p, tipoAtividadeId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo (cadastre em /tipos-atividade)" /></SelectTrigger>
              <SelectContent>{tipos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={formData.categoriaId} onValueChange={(v: string) => setFormData(p => ({ ...p, categoriaId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione a categoria (opcional)" /></SelectTrigger>
              <SelectContent>{categorias.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Horas solicitadas (opcional)</Label><Input type="number" min={0} placeholder="Ex: 8" value={formData.horas} onChange={e => setFormData(p => ({ ...p, horas: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Pontos</Label><Input type="number" min={0} placeholder="Ex: 10" required value={formData.points} onChange={e => setFormData(p => ({ ...p, points: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Criar Atividade"}</Button>
          </div>
        </form>
      </ModalForm>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Atividade" description="Tem certeza que deseja excluir esta atividade?" onConfirm={handleDelete} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────
function AdminNotifications() {
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
      .then((list) => {
        setNotifications(list);
      })
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

  if (loading) return <TableSkeleton columns={1} />;

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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{n.time}</span>
                {!n.read && (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAsRead(n.id)}>Marcar como lida</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Logs ────────────────────────────────────────────────────────
function AdminLogs() {
  const [data, setData] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logsApi
      .list()
      .then((d) => setData(d))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar logs"))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<ApiLog>[] = [
    { key: "action", header: "Ação" },
    { key: "user", header: "Usuário" },
    { key: "date", header: "Data/Hora" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Logs do Sistema</h2>
      {loading ? <TableSkeleton columns={3} /> : data.length === 0 ? <EmptyState title="Nenhum log" /> : <DataTable columns={columns} data={data} />}
    </div>
  );
}

// ─── Profile Component (Reaproveitado do Aluno) ───────
function AdminProfile() {
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
            <p className="text-xs text-muted-foreground">Perfil: Administrador</p>
          </div>
        </div>
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t">
            <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Nova Senha (opcional)</Label><Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
          </form>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)} className="w-full">Editar Perfil</Button>
        )}
      </div>
    </div>
  );
}

// ─── Router & Title Map ────────────────────────
const titleMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Usuários",
  "/admin/courses": "Cursos",
  "/admin/activities": "Atividades",
  "/admin/notifications": "Notificações",
  "/admin/logs": "Logs do Sistema",
  "/admin/profile": "Perfil",
};

export default function AdminDashboardPage() {
  const location = useLocation();
  const title = titleMap[location.pathname] || "Dashboard";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout navItems={navItems} title={title}>
        <div className="pb-24 lg:pb-8 px-4">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="profile" element={<AdminProfile />} />
          </Routes>
        </div>
      </DashboardLayout>
      <BottomNav />
    </div>
  );
}