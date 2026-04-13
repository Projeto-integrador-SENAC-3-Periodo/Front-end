import { useState, useEffect, useCallback } from "react";
import { DashboardLayout, type NavItem } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ModalForm } from "@/components/shared/ModalForm";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { CardSkeleton } from "@/components/shared/CardSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
 LayoutDashboard, BookOpen, Users, ClipboardList, FileCheck, Award, Bell, Plus, Pencil, Trash2, Eye, Check, X, User, Download,
} from "lucide-react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  coursesApi,
  activitiesApi,
  proofsApi,
  usersApi,
  tiposAtividadeApi,
  userCursoApi,
  categoriaAtividadeApi,
  certificadosApi,
  type ApiNotification,
  notificacoesApi,
  type ApiCourse,
  type ApiActivity,
  type ApiProof,
  type ApiUser,
  type ApiCertificate,
} from "@/services/api";

// ─── Nav Items (Sidebar) ─────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Dashboard", path: "/coordinator", icon: LayoutDashboard },
  { label: "Cursos", path: "/coordinator/courses", icon: BookOpen },
  { label: "Alunos", path: "/coordinator/students", icon: Users },
  { label: "Atividades", path: "/coordinator/activities", icon: ClipboardList },
  { label: "Comprovações", path: "/coordinator/proofs", icon: FileCheck },
  { label: "Certificados", path: "/coordinator/certificates", icon: Award },
  { label: "Notificações", path: "/coordinator/notifications", icon: Bell },
  { label: "Perfil", path: "/coordinator/profile", icon: User },
];

const bottomNavItems = [
  { label: "Dashboard", path: "/coordinator", icon: LayoutDashboard },
  { label: "Cursos", path: "/coordinator/courses", icon: BookOpen },
  { label: "Comprovações", path: "/coordinator/proofs", icon: FileCheck },
  { label: "Notificações", path: "/coordinator/notifications", icon: Bell },
  { label: "Perfil", path: "/coordinator/profile", icon: User },
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
function CoordDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ cursos: 0, alunos: 0, pendentes: 0, certificados: 0 });

  useEffect(() => {
    if (!user?.id) return;
    coursesApi.list()
      .then(async (courses) => {
        const alunosPorCurso = await Promise.all(courses.map((c) => userCursoApi.listarAlunos(c.id).catch(() => [])));
        const alunos = alunosPorCurso.flat();
        const ids = [...new Set(alunos.map((a) => a.id))];
        const [proofs, certs] = await Promise.all([
          proofsApi.list(),
          Promise.all(ids.map((id) => certificadosApi.listByAluno(id).catch((): ApiCertificate[] => []))),
        ]);
        setMetrics({
          cursos: courses.length,
          alunos: ids.length,
          pendentes: proofs.filter((p) => p.status === "pending").length,
          certificados: certs.flat().length,
        });
      })
      .catch(() => toast.error("Erro ao carregar métricas"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Cursos ativos" value={metrics.cursos} icon={BookOpen} />
        <MetricCard title="Alunos vinculados" value={metrics.alunos} icon={Users} />
        <MetricCard title="Comprovantes pendentes" value={metrics.pendentes} icon={FileCheck} variant="accent" />
        <MetricCard title="Certificados emitidos" value={metrics.certificados} icon={Award} />
      </div>
    </div>
  );
}

// ─── Courses ─────────────────────────────────────────────────────
function CoordCourses() {
  const { user } = useAuth();
  const [data, setData] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCourse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", hours: "" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await coursesApi.listByCoordinator(user.id);
      setData(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar cursos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData({ name: "", description: "", hours: "" }); setModalOpen(true); };
  const openEdit = (c: ApiCourse) => { setEditing(c); setFormData({ name: c.name, description: c.description, hours: c.hours }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editing) {
        await coursesApi.update(editing.id, formData);
        toast.success("Curso atualizado!");
      } else {
        await coursesApi.create({ ...formData, coordinatorId: user.id, coordinatorName: user.name });
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
    { key: "studentCount", header: "Alunos" },
    { key: "actions", header: "Ações", render: (item: ApiCourse) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Meus Cursos</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Novo Curso</Button>
      </div>
      {loading ? <TableSkeleton columns={5} /> : data.length === 0 ? <EmptyState title="Nenhum curso" description="Crie seu primeiro curso." /> : <DataTable columns={columns} data={data} />}
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Curso" : "Novo Curso"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome do curso" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Carga Horária</Label><Input placeholder="Ex: 120h" required value={formData.hours} onChange={e => setFormData(p => ({ ...p, hours: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="submit">{editing ? "Salvar" : "Criar Curso"}</Button></div>
        </form>
      </ModalForm>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Curso" description="Tem certeza? Atividades vinculadas serão removidas." onConfirm={handleDelete} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Students ────────────────────────────────────────────────────
interface StudentRow { id: string; alunoId: string; cursoId: string; name: string; email: string; matricula: string; course: string }
function CoordStudents() {
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [selAluno, setSelAluno] = useState("");
  const [selCurso, setSelCurso] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseList, userList] = await Promise.all([coursesApi.list(), usersApi.list()]);
      setCourses(courseList);
      setAllUsers(userList.filter((u) => u.role === "student"));
      const byId = new Map(userList.map((u) => [u.id, u]));
      const parts = await Promise.all(
        courseList.map(async (c) => {
          const alunos = await userCursoApi.listarAlunos(c.id);
          return alunos.map((a) => {
            const u = byId.get(a.id);
            return {
              id: `${a.id}-${c.id}`,
              alunoId: a.id,
              cursoId: c.id,
              name: a.nome,
              email: a.email,
              matricula: u?.matricula && u.matricula !== "-" ? u.matricula : "—",
              course: c.name,
            };
          });
        })
      );
      setStudents(parts.flat());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns: Column<StudentRow>[] = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    { key: "matricula", header: "Matrícula" },
    { key: "course", header: "Curso" },
    { key: "actions", header: "Ações", render: (item: StudentRow) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Desvincular aluno"
        onClick={() => handleDesvincular(item.alunoId, item.cursoId)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    )},
  ];

  const handleDesvincular = async (alunoId: string, cursoId: string) => {
    try {
      await userCursoApi.desvincular(cursoId, alunoId);
      toast.success("Aluno desvinculado do curso!");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao desvincular");
    }
  };

  const vincular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selAluno || !selCurso) return;
    try {
      await userCursoApi.vincular(selCurso, selAluno);
      toast.success("Aluno vinculado ao curso!");
      setModalOpen(false);
      setSelAluno("");
      setSelCurso("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao vincular");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Alunos vinculados</h2>
        <Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Vincular aluno</Button>
      </div>
      {loading ? <TableSkeleton columns={4} /> : <DataTable columns={columns} data={students} />}
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title="Vincular aluno ao curso">
        <form onSubmit={vincular} className="space-y-4">
          <div className="space-y-2">
            <Label>Aluno</Label>
            <Select value={selAluno} onValueChange={setSelAluno}>
              <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {allUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={selCurso} onValueChange={setSelCurso}>
              <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Vincular</Button>
          </div>
        </form>
      </ModalForm>
    </div>
  );
}

const coordStatusPt: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
};

// ─── Activities ──────────────────────────────────────────────────
function CoordActivities() {
  const [data, setData] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiActivity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [coursesList, setCoursesList] = useState<ApiCourse[]>([]);
  const [tipos, setTipos] = useState<{ id: string; nome: string }[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
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
      toast.error(e instanceof Error ? e.message : "Erro ao carregar");
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
      if (editing) await activitiesApi.update(editing.id, payload);
      else await activitiesApi.create(payload);
      toast.success(editing ? "Atividade atualizada!" : "Atividade criada!");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
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
    { key: "nomeAluno", header: "Aluno", render: (item) => <span>{item.nomeAluno || "—"}</span> },
    { key: "courseName", header: "Curso" },
    { key: "category", header: "Tipo" },
    { key: "points", header: "Pontos" },
    {
      key: "backendStatus",
      header: "Status",
      render: (item) => <span>{coordStatusPt[item.backendStatus ?? ""] ?? item.backendStatus ?? "—"}</span>,
    },
    { key: "actions", header: "Ações", render: (item) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Atividades</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova atividade</Button>
      </div>
      {loading ? <TableSkeleton columns={7} /> : data.length === 0 ? <EmptyState title="Nenhuma atividade" /> : <DataTable columns={columns} data={data} />}
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar atividade" : "Nova atividade"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Título</Label><Input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
          <p className="text-xs text-muted-foreground bg-muted rounded p-2">
            ℹ️ O aluno seleciona esta atividade ao enviar o comprovante.
          </p>
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={formData.courseId} onValueChange={v => setFormData(p => ({ ...p, courseId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{coursesList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de atividade</Label>
            <Select value={formData.tipoAtividadeId} onValueChange={v => setFormData(p => ({ ...p, tipoAtividadeId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={formData.categoriaId} onValueChange={(v) => setFormData(p => ({ ...p, categoriaId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione a categoria (opcional)" /></SelectTrigger>
              <SelectContent>{categorias.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Horas (opcional)</Label><Input type="number" min={0} value={formData.horas} onChange={e => setFormData(p => ({ ...p, horas: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Pontos</Label><Input type="number" required value={formData.points} onChange={e => setFormData(p => ({ ...p, points: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
          </div>
        </form>
      </ModalForm>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir atividade" description="Tem certeza?" onConfirm={handleDelete} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Proofs ──────────────────────────────────────────────────────
function CoordProofs() {
  const [data, setData] = useState<ApiProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<ApiProof | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await proofsApi.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar comprovações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!selectedProof) return;
    try {
      await proofsApi.approve(selectedProof.id);
      toast.success("Comprovante aprovado!");
      setSelectedProof(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao aprovar");
    }
  };

  const handleReject = async () => {
    if (!selectedProof) return;
    try {
      await proofsApi.reject(selectedProof.id);
      toast.error("Comprovante rejeitado");
      setSelectedProof(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao rejeitar");
    }
  };

  const columns: Column<ApiProof>[] = [
    { key: "studentName", header: "Aluno" }, { key: "activityTitle", header: "Atividade" }, { key: "date", header: "Data Envio" },
    { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
    { key: "actions", header: "Ações", render: (item) => <Button variant="ghost" size="icon" onClick={() => setSelectedProof(item)}><Eye className="h-4 w-4" /></Button> },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Comprovações</h2>
      {loading ? <TableSkeleton columns={5} /> : data.length === 0 ? <EmptyState title="Nenhuma comprovação" /> : <DataTable columns={columns} data={data} />}
      <ModalForm open={!!selectedProof} onOpenChange={() => setSelectedProof(null)} title="Avaliar Comprovante">
        {selectedProof && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Aluno</p><p className="font-medium">{selectedProof.studentName}</p></div>
              <div><p className="text-muted-foreground">Atividade</p><p className="font-medium">{selectedProof.activityTitle}</p></div>
              <div><p className="text-muted-foreground">Data</p><p className="font-medium">{selectedProof.date}</p></div>
              <div><p className="text-muted-foreground">Status</p><StatusBadge status={selectedProof.status} /></div>
            </div>
            <div className="bg-muted rounded-md p-8 text-center text-sm text-muted-foreground">[Visualização do documento]</div>
            {selectedProof.status === "pending" && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="text-destructive" onClick={handleReject}><X className="h-4 w-4" /> Rejeitar</Button>
                <Button onClick={handleApprove}><Check className="h-4 w-4" /> Aprovar</Button>
              </div>
            )}
          </div>
        )}
      </ModalForm>
    </div>
  );
}

// ─── Certificates ────────────────────────────────────────────────

function CoordCertificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    // Busca todos os alunos dos cursos do coord, depois os certificados de cada um
    coursesApi.list()
      .then((courses) =>
        Promise.all(courses.map((c) => userCursoApi.listarAlunos(c.id)))
      )
      .then((porCurso) => {
        const alunos = porCurso.flat();
        const ids = [...new Set(alunos.map((a) => a.id))];
        return Promise.all(ids.map((id) => certificadosApi.listByAluno(id).catch((): ApiCertificate[] => [])));
      })
      .then((todos) => setCerts(todos.flat()))
      .catch(() => toast.error("Erro ao carregar certificados"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const columns: Column<ApiCertificate>[] = [
    { key: "studentName", header: "Aluno" },
    { key: "activityTitle", header: "Atividade" },
    { key: "date", header: "Data de emissão" },
    {
      key: "downloadUrl",
      header: "Arquivo",
      render: (item: ApiCertificate) => (
        <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-3 w-3" /> Baixar
          </Button>
        </a>
      ),
    },
  ];

  if (loading) return <TableSkeleton columns={4} />;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Certificados emitidos</h2>
      {certs.length === 0 ? (
        <EmptyState title="Nenhum certificado" description="Certificados aparecem após aprovação de comprovantes." />
      ) : (
        <DataTable columns={columns} data={certs} />
      )}
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────
function CoordNotifications() {
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
      .then((list) =>
        setNotifications(list)
      )
      .catch(() => toast.error("Erro ao carregar notificações"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const markAsRead = async (id: number) => {
    try {
      await notificacoesApi.marcarLida(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      toast.success("Notificação lida");
    } catch {
      toast.error("Não foi possível atualizar");
    }
  };

  if (loading) return <TableSkeleton columns={1} />;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Notificações</h2>
      {notifications.length === 0 ? (
        <EmptyState title="Nenhuma notificação" />
      ) : (
        <div className="bg-card border rounded-md divide-y">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-center justify-between p-4 ${!n.read ? "bg-primary/5" : ""}`}>
              <div className="flex items-center gap-3">
                {!n.read && <div className="w-2 h-2 rounded-full bg-accent" />}
                <div>
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="text-xs text-muted-foreground">{n.mensagem}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{n.time}</span>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>Marcar como lida</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────
function CoordProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); updateProfile({ name }); toast.success("Perfil atualizado!"); setEditing(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-display font-semibold text-lg mb-4">Meu Perfil</h2>
      <div className="bg-card border rounded-md p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-senac-blue flex items-center justify-center text-white text-xl font-bold">{user?.name?.charAt(0)}</div>
          <div><p className="font-display font-semibold">{user?.name}</p><p className="text-sm text-muted-foreground">{user?.email}</p><p className="text-xs text-muted-foreground">Coordenador</p></div>
        </div>
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t">
            <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
          </form>
        ) : <Button variant="outline" onClick={() => setEditing(true)} className="w-full">Editar Perfil</Button>}
      </div>
    </div>
  );
}

const titleMap: Record<string, string> = {
  "/coordinator": "Dashboard", "/coordinator/courses": "Cursos", "/coordinator/students": "Alunos", "/coordinator/activities": "Atividades",
  "/coordinator/proofs": "Comprovações", "/coordinator/certificates": "Certificados", "/coordinator/notifications": "Notificações", "/coordinator/profile": "Perfil",
};

export default function CoordinatorDashboardPage() {
  const location = useLocation();
  const title = titleMap[location.pathname] || "Dashboard";
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout navItems={navItems} title={title}>
        <div className="pb-24 lg:pb-8 px-4">
          <Routes>
            <Route index element={<CoordDashboard />} />
            <Route path="courses" element={<CoordCourses />} />
            <Route path="students" element={<CoordStudents />} />
            <Route path="activities" element={<CoordActivities />} />
            <Route path="proofs" element={<CoordProofs />} />
            <Route path="certificates" element={<CoordCertificates />} />
            <Route path="notifications" element={<CoordNotifications />} />
            <Route path="profile" element={<CoordProfile />} />
          </Routes>
        </div>
      </DashboardLayout>
      <BottomNav />
    </div>
  );
}