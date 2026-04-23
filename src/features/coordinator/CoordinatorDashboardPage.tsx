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
  { label: "Alunos", path: "/coordinator/students", icon: Users },
  { label: "Atividades", path: "/coordinator/activities", icon: ClipboardList },
  { label: "Comprovações", path: "/coordinator/proofs", icon: FileCheck },
  { label: "Certificados", path: "/coordinator/certificates", icon: Award },
  { label: "Notificações", path: "/coordinator/notifications", icon: Bell },
  { label: "Perfil", path: "/coordinator/profile", icon: User },
];

const bottomNavItems = [
  { label: "Dashboard", path: "/coordinator", icon: LayoutDashboard },
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
  
  const [formData, setFormData] = useState({ 
    title: "", 
    description: "", 
    courseId: "", 
    category: "", 
    points: "", 
    proofType: "" 
  });

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

  const columns: Column<ApiActivity>[] = [
    { key: "title", header: "Título" }, 
    { key: "category", header: "Categoria" }, 
    { key: "points", header: "Horas" },
    { key: "actions", header: "Ações", render: (item) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-display font-semibold text-lg">Gerenciar Atividades</h2><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nova Atividade</Button></div>
      {loading ? <TableSkeleton columns={4} /> : <DataTable columns={columns} data={data} />}
      
      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Editar Atividade" : "Enviar Atividade"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Ex: Curso de Python" required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Tipo da atividade</Label>
            <Select value={formData.proofType} onValueChange={v => setFormData(p => ({ ...p, proofType: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="certificate">Certificado</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ensino">Ensino</SelectItem>
                <SelectItem value="Extensão">Extensão</SelectItem>
                <SelectItem value="Pesquisa">Pesquisa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea placeholder="Breve descrição da atividade" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Horas do certificado</Label>
            <Input type="number" placeholder="Ex: 10" required value={formData.points} onChange={e => setFormData(p => ({ ...p, points: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Comprovante (PDF ou img)</Label>
            <Input type="file" accept="application/pdf,image/*" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Enviar Comprovante</Button>
          </div>
        </form>
      </ModalForm>
    </div>
  );
}

// ─── Proofs ──────────────────────────────────────────────────────
function CoordProofs() {
  const [data, setData] = useState<ApiProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<ApiProof | null>(null);
  const [editData, setEditData] = useState({ points: 0, category: "", activityTitle: "", rejectionReason: "" });

  const load = useCallback(async () => {
    setLoading(true); setData(await proofsApi.list()); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenReview = (proof: ApiProof) => {
    setSelectedProof(proof);
    setEditData({ 
      points: proof.points || 0, 
      category: proof.category || "Ensino", 
      activityTitle: proof.activityTitle,
      rejectionReason: "" 
    });
  };

  const handleApprove = async () => {
    if (!selectedProof) return;
    await proofsApi.approve(selectedProof.id, { 
      points: editData.points, 
      category: editData.category,
      activityTitle: editData.activityTitle 
    });
    toast.success("Comprovante aprovado!");
    setSelectedProof(null); load();
  };

  const handleReject = async () => {
    if (!selectedProof) return;
    if (!editData.rejectionReason) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    await proofsApi.reject(selectedProof.id, editData.rejectionReason);
    toast.error("Comprovante rejeitado");
    setSelectedProof(null); load();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Comprovações Pendentes</h2>
      {loading ? <TableSkeleton columns={5} /> : <DataTable 
        columns={[
          { key: "studentName", header: "Aluno" }, { key: "activityTitle", header: "Atividade" },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
          { key: "actions", header: "Ações", render: (item) => <Button variant="ghost" size="icon" onClick={() => handleOpenReview(item)}><Eye className="h-4 w-4" /></Button> },
        ]} 
        data={data} 
      />}

      <ModalForm open={!!selectedProof} onOpenChange={() => setSelectedProof(null)} title="Validar Comprovante">
        {selectedProof && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Editar Título</Label>
              <Input value={editData.activityTitle} onChange={e => setEditData(p => ({...p, activityTitle: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Editar Horas</Label>
                <Input type="number" value={editData.points} onChange={e => setEditData(p => ({...p, points: Number(e.target.value)}))} />
              </div>
              <div className="space-y-2">
                <Label>Editar Categoria</Label>
                <Select value={editData.category} onValueChange={v => setEditData(p => ({...p, category: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ensino">Ensino</SelectItem>
                    <SelectItem value="Extensão">Extensão</SelectItem>
                    <SelectItem value="Pesquisa">Pesquisa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-destructive">Observação da Rejeição</Label>
              <Textarea 
                placeholder="Descreva o motivo caso for rejeitar..." 
                value={editData.rejectionReason}
                onChange={e => setEditData(p => ({...p, rejectionReason: e.target.value}))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" className="text-destructive" onClick={handleReject}><X className="h-4 w-4" /> Rejeitar</Button>
              <Button onClick={handleApprove} className="bg-success text-white hover:bg-success/90"><Check className="h-4 w-4" /> Aprovar</Button>
            </div>
          </div>
        )}
      </ModalForm>
    </div>
  );
}

// ─── Certificates ────────────────────────────────────────────────
function CoordCertificates() {
  return <div className="space-y-4"><h2 className="font-display font-semibold text-lg">Certificados</h2><EmptyState title="Nenhum certificado" /></div>;
}

// ─── Notifications ───────────────────────────────────────────────
function CoordNotifications() {
  return <div className="space-y-4"><h2 className="font-display font-semibold text-lg">Notificações</h2><EmptyState title="Sem notificações" /></div>;
}

// ─── Profile (EDITÁVEL) ──────────────────────────────────────────
function CoordProfile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (updateProfile) {
        await updateProfile({ name });
        toast.success("Perfil atualizado com sucesso!");
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-display font-semibold text-lg mb-4">Meu Perfil</h2>
      <div className="bg-card border rounded-md p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-senac-blue flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-display font-semibold text-xl">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mt-1">
              Coordenadora
            </span>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Seu nome"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        ) : (
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full gap-2">
              <Pencil className="h-4 w-4" /> Editar Perfil
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoordinatorDashboardPage() {
  const location = useLocation();
  const title = {
    "/coordinator": "Dashboard", "/coordinator/students": "Alunos",
    "/coordinator/activities": "Atividades", "/coordinator/proofs": "Comprovações", "/coordinator/profile": "Perfil"
  }[location.pathname] || "Dashboard";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout navItems={navItems} title={title}>
        <div className="pb-24 lg:pb-8 px-4">
          <Routes>
            <Route index element={<CoordDashboard />} />
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