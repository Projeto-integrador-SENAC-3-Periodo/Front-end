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
  LayoutDashboard, BookOpen, Users, ClipboardList, FileCheck, Award, Bell, Plus, Pencil, Trash2, Eye, Check, X, User,
} from "lucide-react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { coursesApi, activitiesApi, proofsApi, type ApiCourse, type ApiActivity, type ApiProof } from "@/services/api";

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
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);
  if (loading) return <CardSkeleton />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Cursos Ativos" value={3} icon={BookOpen} />
        <MetricCard title="Alunos Vinculados" value={64} icon={Users} />
        <MetricCard title="Comprovantes Pendentes" value={2} icon={FileCheck} variant="accent" />
        <MetricCard title="Certificados Emitidos" value={89} icon={Award} />
      </div>
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-3">Atividade Recente</h3>
        <div className="space-y-3">
          {["João enviou comprovante - Palestra de IA", "Ana Silva completou Workshop React", "Novo aluno vinculado ao curso Design Gráfico"].map((msg, i) => (
            <div key={i} className="flex items-start gap-3 text-sm py-2 border-b last:border-0">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
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
    const list = await coursesApi.listByCoordinator(user.id);
    setData(list);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData({ name: "", description: "", hours: "" }); setModalOpen(true); };
  const openEdit = (c: ApiCourse) => { setEditing(c); setFormData({ name: c.name, description: c.description, hours: c.hours }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editing) {
      await coursesApi.update(editing.id, formData);
      toast.success("Curso atualizado!");
    } else {
      await coursesApi.create({ ...formData, coordinatorId: user.id, coordinatorName: user.name });
      toast.success("Curso criado!");
    }
    setModalOpen(false); load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await coursesApi.delete(deleteId);
    toast.success("Curso excluído!");
    setDeleteId(null); load();
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
interface Student { name: string; email: string; matricula: string; course: string; points: number; }
function CoordStudents() {
  const [modalOpen, setModalOpen] = useState(false);
  const students: Student[] = [
    { name: "João Pedro", email: "joao@senac.br", matricula: "2024001", course: "Desenvolvimento Web", points: 45 },
    { name: "Ana Silva", email: "ana@senac.br", matricula: "2024002", course: "Análise de Dados", points: 85 },
    { name: "Pedro Santos", email: "pedro@senac.br", matricula: "2024003", course: "Design Gráfico", points: 60 },
  ];
  const columns: Column<Student>[] = [
    { key: "name", header: "Nome" }, { key: "email", header: "Email" }, { key: "matricula", header: "Matrícula" }, { key: "course", header: "Curso" },
    { key: "points", header: "Pontos", render: (item) => <span className="font-display font-bold">{item.points}</span> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-display font-semibold text-lg">Alunos Vinculados</h2><Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Vincular Aluno</Button></div>
      <DataTable columns={columns} data={students} />
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title="Vincular Aluno ao Curso">
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Aluno vinculado!"); setModalOpen(false); }} className="space-y-4">
          <div className="space-y-2"><Label>Aluno</Label><Select><SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger><SelectContent><SelectItem value="3">João Pedro</SelectItem><SelectItem value="4">Ana Silva</SelectItem><SelectItem value="5">Pedro Santos</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Curso</Label><Select><SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger><SelectContent><SelectItem value="1">Desenvolvimento Web</SelectItem><SelectItem value="2">Análise de Dados</SelectItem><SelectItem value="3">Design Gráfico</SelectItem></SelectContent></Select></div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="submit">Vincular</Button></div>
        </form>
      </ModalForm>
    </div>
  );
}

// ─── Activities ──────────────────────────────────────────────────
function CoordActivities() {
  const [data, setData] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ApiActivity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [coursesList, setCoursesList] = useState<ApiCourse[]>([]);
  const [formData, setFormData] = useState({ title: "", description: "", courseId: "", category: "", points: "", proofType: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [acts, courses] = await Promise.all([activitiesApi.list(), coursesApi.list()]);
    setData(acts); setCoursesList(courses); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormData({ title: "", description: "", courseId: "", category: "", points: "", proofType: "" }); setModalOpen(true); };
  const openEdit = (a: ApiActivity) => { setEditing(a); setFormData({ title: a.title, description: a.description, courseId: a.courseId, category: a.category, points: String(a.points), proofType: a.proofType }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const courseName = coursesList.find(c => c.id === formData.courseId)?.name || "";
    const payload = { ...formData, points: Number(formData.points), courseName, proofType: formData.proofType as ApiActivity["proofType"] };
    if (editing) await activitiesApi.update(editing.id, payload);
    else await activitiesApi.create(payload);
    setModalOpen(false); load(); toast.success(editing ? "Atividade atualizada!" : "Atividade criada!");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await activitiesApi.delete(deleteId); toast.success("Atividade excluída!"); setDeleteId(null); load();
  };

  const proofLabels: Record<string, string> = { certificate: "Certificado", photo: "Foto", document: "Documento" };
  const columns: Column<ApiActivity>[] = [
    { key: "title", header: "Nome" }, { key: "courseName", header: "Curso" }, { key: "category", header: "Categoria" }, { key: "points", header: "Pontos" },
    { key: "proofType", header: "Comprovação", render: (item) => <span>{proofLabels[item.proofType as string] || item.proofType}</span> },
    { key: "actions", header: "Ações", render: (item) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-display font-semibold text-lg">Atividades</h2><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Atividade</Button></div>
      {loading ? <TableSkeleton columns={6} /> : data.length === 0 ? <EmptyState title="Nenhuma atividade" /> : <DataTable columns={columns} data={data} />}
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Atividade" : "Nova Atividade"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Título</Label><Input placeholder="Título" required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Curso</Label><Select value={formData.courseId} onValueChange={v => setFormData(p => ({ ...p, courseId: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{coursesList.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Categoria</Label><Input placeholder="Ex: Palestra" required value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Tipo de Comprovação</Label><Select value={formData.proofType} onValueChange={v => setFormData(p => ({ ...p, proofType: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="certificate">Certificado</SelectItem><SelectItem value="photo">Foto</SelectItem><SelectItem value="document">Documento</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Pontos</Label><Input type="number" placeholder="10" required value={formData.points} onChange={e => setFormData(p => ({ ...p, points: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button type="submit">{editing ? "Salvar" : "Criar"}</Button></div>
        </form>
      </ModalForm>
      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Excluir Atividade" description="Tem certeza?" onConfirm={handleDelete} confirmLabel="Excluir" />
    </div>
  );
}

// ─── Proofs ──────────────────────────────────────────────────────
function CoordProofs() {
  const [data, setData] = useState<ApiProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<ApiProof | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setData(await proofsApi.list()); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // CORRIGIDO: Utilizando approve e reject que existem na sua api.ts
  const handleApprove = async () => {
    if (!selectedProof) return;
    await proofsApi.approve(selectedProof.id);
    toast.success("Comprovante aprovado!");
    setSelectedProof(null); load();
  };

  const handleReject = async () => {
    if (!selectedProof) return;
    await proofsApi.reject(selectedProof.id);
    toast.error("Comprovante rejeitado");
    setSelectedProof(null); load();
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
interface Certificate { student: string; activity: string; date: string; }
function CoordCertificates() {
  const certs: Certificate[] = [
    { student: "João Pedro", activity: "Palestra de IA", date: "2024-03-15" },
    { student: "Ana Silva", activity: "Workshop React", date: "2024-03-12" },
  ];
  const columns: Column<Certificate>[] = [{ key: "student", header: "Aluno" }, { key: "activity", header: "Atividade" }, { key: "date", header: "Data" }];
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Certificados Emitidos</h2>
      {certs.length === 0 ? <EmptyState title="Nenhum certificado" /> : <DataTable columns={columns} data={certs} />}
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────
interface Notification { id: number; msg: string; time: string; read: boolean; }
function CoordNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, msg: "João Pedro enviou comprovante para Palestra de IA", time: "Há 10 min", read: false },
    { id: 2, msg: "Novo aluno vinculado ao curso Design Gráfico", time: "Há 2h", read: true },
  ]);
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Notificação lida");
  };
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Notificações</h2>
      {notifications.length === 0 ? <EmptyState title="Vazio" /> : (
        <div className="bg-card border rounded-md divide-y">{notifications.map((n) => (
            <div key={n.id} className={`flex items-center justify-between p-4 ${!n.read ? "bg-primary/5" : ""}`}>
              <div className="flex items-center gap-3">{!n.read && <div className="w-2 h-2 rounded-full bg-accent" />}<span className="text-sm">{n.msg}</span></div>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{n.time}</span>{!n.read && <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>Lido</Button>}</div>
            </div>
          ))}</div>
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