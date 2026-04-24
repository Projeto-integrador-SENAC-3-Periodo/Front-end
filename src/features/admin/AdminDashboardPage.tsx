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
import { LayoutDashboard, Users, BookOpen, Bell, FileText, Plus, Pencil, Trash2, User, Link2 } from "lucide-react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  usersApi, coursesApi, logsApi, notificacoesApi, userCursoApi,
  type ApiUser, type ApiCourse, type ApiLog, type ApiNotification, type UserCursoVinculo,
} from "@/services/api";

// ─── Nav ──────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Dashboard",    path: "/admin",               icon: LayoutDashboard },
  { label: "Usuários",     path: "/admin/users",         icon: Users },
  { label: "Cursos",       path: "/admin/courses",       icon: BookOpen },
  { label: "Vínculos",     path: "/admin/vinculos",      icon: Link2 },
  { label: "Notificações", path: "/admin/notifications", icon: Bell },
  { label: "Logs",         path: "/admin/logs",          icon: FileText },
  { label: "Perfil",       path: "/admin/profile",       icon: User },
];
const bottomNavItems = [
  { label: "Dashboard", path: "/admin",          icon: LayoutDashboard },
  { label: "Usuários",  path: "/admin/users",    icon: Users },
  { label: "Cursos",    path: "/admin/courses",  icon: BookOpen },
  { label: "Vínculos",  path: "/admin/vinculos", icon: Link2 },
  { label: "Perfil",    path: "/admin/profile",  icon: User },
];
function BottomNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-center justify-around h-16 lg:hidden safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {bottomNavItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] transition-colors ${active ? "text-senac-blue font-bold" : "text-muted-foreground"}`}>
            <item.icon className={`h-5 w-5 ${active ? "text-senac-blue" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────
function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ usuarios: 0, cursos: 0 });

  useEffect(() => {
    Promise.all([usersApi.list(), coursesApi.list()])
      .then(([u, c]) => setCounts({ usuarios: u.length, cursos: c.length }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CardSkeleton count={2} />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard title="Total de Usuários" value={counts.usuarios} icon={Users} />
        <MetricCard title="Total de Cursos" value={counts.cursos} icon={BookOpen} variant="accent" />
      </div>
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-2">Ações rápidas</h3>
        <div className="flex gap-3 flex-wrap">
          <Link to="/admin/users"><Button variant="outline" size="sm" className="gap-2"><Users className="h-4 w-4" /> Gerenciar Usuários</Button></Link>
          <Link to="/admin/courses"><Button variant="outline" size="sm" className="gap-2"><BookOpen className="h-4 w-4" /> Gerenciar Cursos</Button></Link>
          <Link to="/admin/logs"><Button variant="outline" size="sm" className="gap-2"><FileText className="h-4 w-4" /> Ver Logs</Button></Link>
        </div>
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────
function AdminUsers() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", matricula: "" });

  const load = useCallback(async () => {
    setLoading(true); setData(await usersApi.list()); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingUser(null); setFormData({ name: "", email: "", matricula: "" }); setSelectedProfile(""); setModalOpen(true); };
  const openEdit = (u: ApiUser) => { setEditingUser(u); setFormData({ name: u.name, email: u.email, matricula: u.matricula }); setSelectedProfile(u.role); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const perfil = selectedProfile === "admin" ? "ADMINISTRADOR" : selectedProfile === "coordinator" ? "COORDENADOR" : "ALUNO";
    if (editingUser) {
      await usersApi.update(editingUser.id, { name: formData.name, email: formData.email, role: selectedProfile as ApiUser["role"], matricula: formData.matricula });
      toast.success("Usuário atualizado!");
    } else {
      await usersApi.create({ nome: formData.name, email: formData.email, perfil, matricula: perfil === "ALUNO" ? formData.matricula : null });
      toast.success("Usuário criado! A senha provisória foi enviada por email.");
    }
    setModalOpen(false); load();
  };

  const columns: Column<ApiUser>[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    { key: "profile", header: "Perfil" },
    { key: "matricula", header: "Matrícula" },
    { key: "actions", header: "Ações", render: (u) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(u); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(u.id); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Usuários</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
      </div>
      {loading ? <TableSkeleton columns={5} /> : data.length === 0 ? <EmptyState title="Nenhum usuário" /> : <DataTable columns={columns} data={data} />}
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editingUser ? "Editar Usuário" : "Novo Usuário"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="coordinator">Coordenador</SelectItem>
                <SelectItem value="student">Aluno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedProfile === "student" && (
            <div className="space-y-2"><Label>Matrícula</Label><Input required value={formData.matricula} onChange={e => setFormData(p => ({ ...p, matricula: e.target.value }))} /></div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingUser ? "Salvar" : "Criar"}</Button>
          </div>
        </form>
      </ModalForm>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Usuário" description="Esta ação não pode ser desfeita." onConfirm={async () => { if (deleteId) { await usersApi.delete(deleteId); toast.success("Excluído!"); setDeleteId(null); load(); } }} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Courses (somente ADMIN cria/edita) ───────────────────────────
function AdminCourses() {
  const [data, setData] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCourse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", horasComplementares: "" });

  const load = useCallback(async () => {
    setLoading(true); setData(await coursesApi.list()); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData({ name: "", description: "", horasComplementares: "" }); setModalOpen(true); };
  const openEdit = (c: ApiCourse) => { setEditing(c); setFormData({ name: c.name, description: c.description, horasComplementares: String(c.horasComplementares) }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: formData.name, description: formData.description, horasComplementares: Number(formData.horasComplementares) };
    if (editing) { await coursesApi.update(editing.id, payload); toast.success("Curso atualizado!"); }
    else { await coursesApi.create(payload); toast.success("Curso criado!"); }
    setModalOpen(false); load();
  };

  const columns: Column<ApiCourse>[] = [
    { key: "name", header: "Nome" },
    { key: "description", header: "Descrição" },
    { key: "horasComplementares", header: "Horas complementares", render: (c) => <span>{c.horasComplementares}h</span> },
    { key: "coordinatorName", header: "Coordenador" },
    { key: "studentCount", header: "Alunos" },
    { key: "actions", header: "Ações", render: (c) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(c); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Cursos</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Curso</Button>
      </div>
      {loading ? <TableSkeleton columns={5} /> : data.length === 0 ? <EmptyState title="Nenhum curso" /> : <DataTable columns={columns} data={data} />}
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Curso" : "Novo Curso"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nome *</Label><Input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="space-y-2">
            <Label>Horas complementares (teto) *</Label>
            <Input type="number" min="1" placeholder="Ex: 100" required value={formData.horasComplementares} onChange={e => setFormData(p => ({ ...p, horasComplementares: e.target.value }))} />
            <p className="text-xs text-muted-foreground">Quantidade máxima de horas que o aluno pode acumular neste curso.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Criar Curso"}</Button>
          </div>
        </form>
      </ModalForm>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Curso" description="Todas as atividades vinculadas serão removidas." onConfirm={async () => { if (deleteId) { await coursesApi.delete(deleteId); toast.success("Excluído!"); setDeleteId(null); load(); } }} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────
function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    notificacoesApi.list(user.id)
      .then(setNotifications).catch(() => toast.error("Erro ao carregar notificações"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const markAsRead = async (id: number) => {
    try { await notificacoesApi.marcarLida(id); setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)); }
    catch { toast.error("Não foi possível atualizar"); }
  };

  if (loading) return <CardSkeleton count={2} />;
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Notificações</h2>
      {notifications.length === 0
        ? <EmptyState title="Nenhuma notificação" />
        : <div className="bg-card border rounded-md divide-y">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-center justify-between p-4 ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  {!n.read && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">{n.titulo}</p>
                    <p className="text-xs text-muted-foreground">{n.mensagem}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
                {!n.read && <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => markAsRead(n.id)}>Marcar lida</Button>}
              </div>
            ))}
          </div>}
    </div>
  );
}

// ─── Logs ─────────────────────────────────────────────────────────
function AdminLogs() {
  const [data, setData] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { logsApi.list().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

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

// ─── Profile ─────────────────────────────────────────────────────
function AdminProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); updateProfile({ name }); toast.success("Perfil atualizado!"); setEditing(false);
  };
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmacao) { toast.error("As senhas não coincidem"); return; }
    setSubmittingPw(true);
    try {
      const { authApi } = await import("@/services/api");
      await authApi.changePassword(senhaAtual, novaSenha, confirmacao);
      toast.success("Senha alterada!"); setChangingPassword(false); setSenhaAtual(""); setNovaSenha(""); setConfirmacao("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSubmittingPw(false); }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-display font-semibold text-lg mb-4">Meu Perfil</h2>
      <div className="bg-card border rounded-md p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-senac-blue flex items-center justify-center text-white text-xl font-bold">{user?.name?.charAt(0)}</div>
          <div>
            <p className="font-display font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Administrador</span>
          </div>
        </div>
        {editing ? (
          <form onSubmit={handleSave} className="space-y-3 pt-4 border-t">
            <div className="space-y-1"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
          </form>
        ) : (
          <div className="space-y-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditing(true)} className="w-full">Editar Perfil</Button>
            <Button variant="outline" onClick={() => setChangingPassword(true)} className="w-full">Alterar Senha</Button>
          </div>
        )}
        {changingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Alterar Senha</h3>
            <div className="space-y-1"><Label>Senha Atual</Label><Input type="password" required value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} /></div>
            <div className="space-y-1"><Label>Nova Senha</Label><Input type="password" placeholder="Mínimo 8 caracteres" required value={novaSenha} onChange={e => setNovaSenha(e.target.value)} /></div>
            <div className="space-y-1"><Label>Confirmar</Label><Input type="password" required value={confirmacao} onChange={e => setConfirmacao(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setChangingPassword(false); setSenhaAtual(""); setNovaSenha(""); setConfirmacao(""); }}>Cancelar</Button>
              <Button type="submit" disabled={submittingPw}>{submittingPw ? "Salvando..." : "Alterar"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Vínculos (Alunos e Coordenadores por Curso) ─────────────────
function AdminVinculos() {
  const [tab, setTab] = useState<"aluno" | "coordenador">("aluno");
  const [cursos, setCursos] = useState<ApiCourse[]>([]);
  const [usuarios, setUsuarios] = useState<ApiUser[]>([]);
  const [membros, setMembros] = useState<UserCursoVinculo[]>([]);
  const [selectedCurso, setSelectedCurso] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMembros, setLoadingMembros] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; nome: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Carrega cursos e usuários na montagem
  useEffect(() => {
    Promise.all([coursesApi.list(), usersApi.list()])
      .then(([c, u]) => { setCursos(c); setUsuarios(u); })
      .catch(() => toast.error("Erro ao carregar dados"));
  }, []);

  // Recarrega membros quando curso ou tab mudam
  useEffect(() => {
    if (!selectedCurso) { setMembros([]); return; }
    setLoadingMembros(true);
    userCursoApi.listarTodos(selectedCurso)
      .then((all) => setMembros(all.filter((m) => m.papel === (tab === "aluno" ? "ALUNO" : "COORDENADOR"))))
      .catch(() => toast.error("Erro ao carregar membros"))
      .finally(() => setLoadingMembros(false));
  }, [selectedCurso, tab]);

  const recarregarMembros = () => {
    if (!selectedCurso) return;
    setLoadingMembros(true);
    userCursoApi.listarTodos(selectedCurso)
      .then((all) => setMembros(all.filter((m) => m.papel === (tab === "aluno" ? "ALUNO" : "COORDENADOR"))))
      .finally(() => setLoadingMembros(false));
  };

  const handleVincular = async () => {
    if (!selectedCurso || !selectedUser) return;
    setSubmitting(true);
    try {
      if (tab === "aluno") {
        await userCursoApi.vincular(selectedCurso, selectedUser);
        toast.success("Aluno vinculado ao curso!");
      } else {
        await userCursoApi.vincularCoordenador(selectedCurso, selectedUser);
        toast.success("Coordenador vinculado ao curso!");
      }
      setModalOpen(false);
      setSelectedUser("");
      recarregarMembros();
      // Recarrega cursos para atualizar nome do coordenador na listagem
      coursesApi.list().then(setCursos).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao vincular");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDesvincular = async () => {
    if (!deleteTarget || !selectedCurso) return;
    try {
      await userCursoApi.desvincular(selectedCurso, deleteTarget.userId);
      toast.success("Vínculo removido!");
      setDeleteTarget(null);
      recarregarMembros();
      coursesApi.list().then(setCursos).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao desvincular");
    }
  };

  // Usuários disponíveis para vincular (filtra quem já está vinculado)
  const membroIds = new Set(membros.map((m) => m.id));
  const papel = tab === "aluno" ? "student" : "coordinator";
  const disponiveis = usuarios.filter((u) => u.role === papel && !membroIds.has(u.id));

  const cursoSelecionado = cursos.find((c) => c.id === selectedCurso);

  type Row = UserCursoVinculo;
  const columns: Column<Row>[] = [
    { key: "nome", header: "Nome" },
    { key: "email", header: "Email" },
    ...(tab === "aluno" ? [{ key: "matricula" as keyof Row, header: "Matrícula", render: (r: Row) => <span>{r.matricula ?? "—"}</span> }] : []),
    { key: "actions", header: "Ações", render: (r: Row) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ userId: r.id, nome: r.nome })}>
        <Trash2 className="h-4 w-4" />
      </Button>
    )},
  ];

  return (
    <div className="space-y-5">
      <h2 className="font-display font-semibold text-lg">Vínculos de Curso</h2>

      {/* Seletor de curso */}
      <div className="space-y-2">
        <Label>Selecione o curso</Label>
        <Select value={selectedCurso} onValueChange={setSelectedCurso}>
          <SelectTrigger className="max-w-sm"><SelectValue placeholder="Escolha um curso..." /></SelectTrigger>
          <SelectContent>
            {cursos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.coordinatorName !== "—" ? `(Coord: ${c.coordinatorName})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCurso && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1 border-b">
            {(["aluno", "coordenador"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? "border-senac-blue text-senac-blue" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "aluno" ? "Alunos" : "Coordenador"}
              </button>
            ))}
          </div>

          {/* Info do curso */}
          {cursoSelecionado && (
            <div className="bg-muted/30 rounded-md px-4 py-2 text-sm flex flex-wrap gap-4">
              <span><strong>{cursoSelecionado.name}</strong></span>
              <span className="text-muted-foreground">{cursoSelecionado.horasComplementares}h complementares</span>
              <span className="text-muted-foreground">Coordenador: {cursoSelecionado.coordinatorName}</span>
              <span className="text-muted-foreground">{cursoSelecionado.studentCount} alunos</span>
            </div>
          )}

          {/* Tabela de membros + botão vincular */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {tab === "aluno" ? `${membros.length} aluno(s) vinculado(s)` : membros.length > 0 ? "Coordenador vinculado" : "Sem coordenador"}
              </p>
              <Button size="sm" className="gap-2" onClick={() => { setSelectedUser(""); setModalOpen(true); }}
                disabled={tab === "coordenador" && membros.length > 0}>
                <Plus className="h-4 w-4" />
                {tab === "aluno" ? "Vincular Aluno" : "Vincular Coordenador"}
              </Button>
            </div>
            {tab === "coordenador" && membros.length > 0 && (
              <p className="text-xs text-amber-600">Para trocar o coordenador, primeiro desvincule o atual.</p>
            )}
            {loadingMembros
              ? <TableSkeleton columns={3} />
              : membros.length === 0
                ? <EmptyState title={tab === "aluno" ? "Nenhum aluno vinculado" : "Sem coordenador"} description={tab === "aluno" ? "Clique em 'Vincular Aluno' para adicionar." : "Clique em 'Vincular Coordenador' para definir."} />
                : <DataTable columns={columns} data={membros} />}
          </div>
        </>
      )}

      {!selectedCurso && (
        <EmptyState title="Selecione um curso" description="Escolha um curso acima para gerenciar os vínculos." />
      )}

      {/* Modal vincular */}
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={tab === "aluno" ? "Vincular Aluno ao Curso" : "Vincular Coordenador ao Curso"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{tab === "aluno" ? "Aluno" : "Coordenador"}</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger><SelectValue placeholder={`Selecione o ${tab === "aluno" ? "aluno" : "coordenador"}`} /></SelectTrigger>
              <SelectContent>
                {disponiveis.length === 0
                  ? <SelectItem value="_empty" disabled>Nenhum disponível</SelectItem>
                  : disponiveis.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.matricula && u.matricula !== "-" ? `(${u.matricula})` : ""} — {u.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {disponiveis.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {tab === "aluno" ? "Todos os alunos já estão vinculados a este curso." : "Todos os coordenadores já estão vinculados."}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleVincular} disabled={!selectedUser || selectedUser === "_empty" || submitting}>
              {submitting ? "Vinculando..." : "Vincular"}
            </Button>
          </div>
        </div>
      </ModalForm>

      {/* Confirmar desvínculo */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={`Desvincular ${tab === "aluno" ? "aluno" : "coordenador"}`}
        description={`Tem certeza que deseja desvincular "${deleteTarget?.nome}" deste curso?`}
        onConfirm={handleDesvincular}
        confirmLabel="Desvincular"
      />
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────
const titleMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Usuários",
  "/admin/courses": "Cursos",
  "/admin/vinculos": "Vínculos",
  "/admin/notifications": "Notificações",
  "/admin/logs": "Logs do Sistema",
  "/admin/profile": "Perfil",
};

export default function AdminDashboardPage() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout navItems={navItems} title={titleMap[location.pathname] || "Dashboard"}>
        <div className="pb-24 lg:pb-8 px-4">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="vinculos" element={<AdminVinculos />} />
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
