import { useState, useEffect, useCallback } from "react";
import { DashboardLayout, type NavItem } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/shared/MetricCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ModalForm } from "@/components/shared/ModalForm";
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
  LayoutDashboard, Users, ClipboardList, FileCheck, Bell, Check, X, Eye, User, Pencil, Clock, AlertCircle, CheckCircle,
} from "lucide-react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  activitiesApi, userCursoApi, notificacoesApi, tiposAtividadeApi,
  type ApiActivity, type ApiNotification, type TipoAtividade, type CategoriaFixa, type UserCursoVinculo,
} from "@/services/api";

// ─── Nav ──────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Dashboard",    path: "/coordinator",              icon: LayoutDashboard },
  { label: "Alunos",       path: "/coordinator/students",     icon: Users },
  { label: "Atividades",   path: "/coordinator/activities",   icon: ClipboardList },
  { label: "Avaliar",      path: "/coordinator/proofs",       icon: FileCheck },
  { label: "Notificações", path: "/coordinator/notifications",icon: Bell },
  { label: "Perfil",       path: "/coordinator/profile",      icon: User },
];
const bottomNavItems = [
  { label: "Dashboard",    path: "/coordinator",               icon: LayoutDashboard },
  { label: "Avaliar",      path: "/coordinator/proofs",        icon: FileCheck },
  { label: "Notificações", path: "/coordinator/notifications", icon: Bell },
  { label: "Perfil",       path: "/coordinator/profile",       icon: User },
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

// ─── Hook: cursos do coordenador ──────────────────────────────────
function useMeusCursos(userId: string | undefined) {
  const [cursoIds, setCursoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    userCursoApi.listarCursosDoAluno(userId)
      .then((c) => setCursoIds(c.map((x) => x.id)))
      .finally(() => setLoading(false));
  }, [userId]);
  return { cursoIds, loading };
}

// ─── Dashboard ────────────────────────────────────────────────────
function CoordDashboard() {
  const { user } = useAuth();
  const { cursoIds } = useMeusCursos(user?.id);
  const [loading, setLoading] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const [alunos, setAlunos] = useState(0);
  const [recent, setRecent] = useState<ApiActivity[]>([]);

  useEffect(() => {
    if (!cursoIds.length) { setLoading(false); return; }
    (async () => {
      try {
        const [pendArr, alunosArr] = await Promise.all([
          Promise.all(cursoIds.map((id) => activitiesApi.listPendingByCourse(id).catch(() => [] as ApiActivity[]))),
          Promise.all(cursoIds.map((id) => userCursoApi.listarAlunos(id).catch(() => [] as UserCursoVinculo[]))),
        ]);
        const allPend = pendArr.flat();
        setPendentes(allPend.length);
        setAlunos(new Set(alunosArr.flat().map((a) => a.id)).size);
        setRecent(allPend.slice(0, 5));
      } finally { setLoading(false); }
    })();
  }, [cursoIds]);

  if (loading) return <CardSkeleton count={3} />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard title="Alunos vinculados" value={alunos} icon={Users} />
        <MetricCard title="Atividades pendentes" value={pendentes} icon={FileCheck} variant="accent" />
      </div>
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-3">Atividades aguardando avaliação</h3>
        {recent.length === 0
          ? <p className="text-sm text-muted-foreground">Nenhuma atividade pendente.</p>
          : recent.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{a.tipoAtividade}</p>
                <p className="text-xs text-muted-foreground">{a.nomeAluno} · {a.nomeCurso} · {a.horasSolicitadas}h</p>
              </div>
              <Link to="/coordinator/proofs"><Button size="sm" variant="outline">Avaliar</Button></Link>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Students ─────────────────────────────────────────────────────
function CoordStudents() {
  const { user } = useAuth();
  const { cursoIds, loading: loadingCursos } = useMeusCursos(user?.id);
  const [alunos, setAlunos] = useState<(UserCursoVinculo & { cursoNome: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cursoIds.length) { setLoading(false); return; }
    (async () => {
      try {
        const por_curso = await Promise.all(
          cursoIds.map(async (id) => {
            const list = await userCursoApi.listarAlunos(id).catch(() => []);
            // busca nome do curso
            const cursoNome = list[0]?.nomeCurso ?? id;
            return list.map((a) => ({ ...a, cursoNome }));
          })
        );
        setAlunos(por_curso.flat());
      } finally { setLoading(false); }
    })();
  }, [cursoIds]);

  type Row = UserCursoVinculo & { cursoNome: string };
  const columns: Column<Row>[] = [
    { key: "nome", header: "Nome" },
    { key: "email", header: "Email" },
    { key: "matricula", header: "Matrícula", render: (r) => <span>{r.matricula ?? "—"}</span> },
    { key: "cursoNome", header: "Curso" },
  ];

  if (loading || loadingCursos) return <TableSkeleton columns={4} />;
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Alunos dos Meus Cursos</h2>
      {alunos.length === 0
        ? <EmptyState title="Nenhum aluno vinculado" description="Peça ao administrador para vincular alunos ao seu curso." />
        : <DataTable columns={columns} data={alunos} />}
    </div>
  );
}

// ─── Activities ──────────────────────────────────────────────────
function CoordActivities() {
  const { user } = useAuth();
  const { cursoIds, loading: loadingCursos } = useMeusCursos(user?.id);
  const [acts, setActs] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"TODOS" | "PENDENTE" | "APROVADO" | "REPROVADO">("TODOS");

  const load = useCallback(async () => {
    if (!cursoIds.length) { setLoading(false); return; }
    setLoading(true);
    try {
      const all = await Promise.all(cursoIds.map((id) => activitiesApi.listByCourse(id).catch(() => [] as ApiActivity[])));
      setActs(all.flat());
    } finally { setLoading(false); }
  }, [cursoIds]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "TODOS" ? acts : acts.filter((a) => a.status === filter);
  const columns: Column<ApiActivity>[] = [
    { key: "nomeAluno", header: "Aluno" },
    { key: "titulo", header: "Atividade" },
    { key: "categoriaFixa", header: "Categoria" },
    { key: "horasSolicitadas", header: "Horas solicitadas" },
    { key: "horasAprovadas", header: "Horas aprovadas", render: (a) => <span>{a.horasAprovadas ?? "—"}</span> },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status === "APROVADO" ? "approved" : a.status === "REPROVADO" ? "rejected" : "pending"} /> },
    { key: "dataSubmissao", header: "Data" },
  ];

  if (loading || loadingCursos) return <TableSkeleton columns={6} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Atividades dos Meus Cursos</h2>
        <div className="flex gap-2 flex-wrap">
          {(["TODOS","PENDENTE","APROVADO","REPROVADO"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === s ? "bg-senac-blue text-white border-senac-blue" : "hover:bg-muted"}`}>
              {s === "TODOS" ? "Todos" : s === "PENDENTE" ? "Pendentes" : s === "APROVADO" ? "Aprovadas" : "Reprovadas"}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0
        ? <EmptyState title="Nenhuma atividade" />
        : <DataTable columns={columns} data={filtered} />}
    </div>
  );
}

// ─── Proofs (Avaliar) ─────────────────────────────────────────────
function CoordProofs() {
  const { user } = useAuth();
  const { cursoIds, loading: loadingCursos } = useMeusCursos(user?.id);
  const [pendentes, setPendentes] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApiActivity | null>(null);
  const [tipos, setTipos] = useState<TipoAtividade[]>([]);
  const [form, setForm] = useState({
    horasAprovadas: "",
    categoriaFixa: "" as CategoriaFixa | "",
    idTipoAtividade: "",
    motivoReprovacao: "",
    showReject: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!cursoIds.length) { setLoading(false); return; }
    setLoading(true);
    try {
      const [pend, tipos_] = await Promise.all([
        Promise.all(cursoIds.map((id) => activitiesApi.listPendingByCourse(id).catch(() => [] as ApiActivity[]))),
        tiposAtividadeApi.list(),
      ]);
      setPendentes(pend.flat());
      setTipos(tipos_);
    } finally { setLoading(false); }
  }, [cursoIds]);

  useEffect(() => { load(); }, [load]);

  const openReview = (a: ApiActivity) => {
    setSelected(a);
    setForm({ horasAprovadas: String(a.horasSolicitadas), categoriaFixa: a.categoriaFixa, idTipoAtividade: a.tipoAtividade, motivoReprovacao: "", showReject: false });
  };

  const handleAprovar = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await activitiesApi.avaliar({
        atividadeId: selected.id,
        status: "APROVADO",
        horasAprovadas: form.horasAprovadas ? Number(form.horasAprovadas) : undefined,
        categoriaFixa: form.categoriaFixa || undefined,
        idTipoAtividade: form.idTipoAtividade || undefined,
      });
      toast.success("Atividade aprovada! O aluno foi notificado por email.");
      setSelected(null); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao aprovar"); }
    finally { setSubmitting(false); }
  };

  const handleReprovar = async () => {
    if (!selected) return;
    if (!form.motivoReprovacao.trim()) { toast.error("Informe o motivo da reprovação"); return; }
    setSubmitting(true);
    try {
      await activitiesApi.avaliar({
        atividadeId: selected.id,
        status: "REPROVADO",
        motivoReprovacao: form.motivoReprovacao.trim(),
        categoriaFixa: form.categoriaFixa || undefined,
        idTipoAtividade: form.idTipoAtividade || undefined,
      });
      toast.success("Atividade reprovada. O aluno foi notificado por email.");
      setSelected(null); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao reprovar"); }
    finally { setSubmitting(false); }
  };

  const columns: Column<ApiActivity>[] = [
    { key: "nomeAluno", header: "Aluno" },
    { key: "titulo", header: "Atividade" },
    { key: "categoriaFixa", header: "Categoria" },
    { key: "horasSolicitadas", header: "Horas", render: (a) => <span>{a.horasSolicitadas}h</span> },
    { key: "dataSubmissao", header: "Enviado em" },
    { key: "actions", header: "Ações", render: (a) => (
      <Button variant="ghost" size="icon" onClick={() => openReview(a)}><Eye className="h-4 w-4" /></Button>
    )},
  ];

  if (loading || loadingCursos) return <TableSkeleton columns={5} />;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Atividades Pendentes de Avaliação</h2>
      {pendentes.length === 0
        ? <EmptyState title="Nenhuma atividade pendente" description="Quando um aluno enviar uma atividade, ela aparecerá aqui." />
        : <DataTable columns={columns} data={pendentes} />}

      <ModalForm open={!!selected} onOpenChange={() => setSelected(null)} title="Avaliar Atividade">
        {selected && (
          <div className="space-y-4">
            {/* Info da atividade */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-md p-3">
              <div><p className="text-muted-foreground">Aluno</p><p className="font-medium">{selected.nomeAluno}</p></div>
              <div><p className="text-muted-foreground">Curso</p><p className="font-medium">{selected.nomeCurso}</p></div>
              <div><p className="text-muted-foreground">Horas solicitadas</p><p className="font-medium">{selected.horasSolicitadas}h</p></div>
              <div><p className="text-muted-foreground">Categoria</p><p className="font-medium">{selected.categoriaFixa}</p></div>
              <div><p className="text-muted-foreground">Tipo</p><p className="font-medium">{selected.tipoAtividade}</p></div>
            </div>
            {selected.descricao && <p className="text-sm text-muted-foreground bg-muted/30 rounded p-2">{selected.descricao}</p>}
            {selected.comprovanteUrl && (
              <a href={selected.comprovanteUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-senac-blue underline">
                👁 Ver comprovante enviado
              </a>
            )}

            {/* Campos editáveis pelo coordenador */}
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ajustes opcionais</p>
              <div className="space-y-1">
                <Label>Horas a aprovar</Label>
                <Input type="number" min="1" value={form.horasAprovadas} onChange={(e) => setForm(p => ({ ...p, horasAprovadas: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Deixe em branco para usar as horas solicitadas ({selected.horasSolicitadas}h)</p>
              </div>
              <div className="space-y-1">
                <Label>Corrigir categoria</Label>
                <Select value={form.categoriaFixa} onValueChange={(v) => setForm(p => ({ ...p, categoriaFixa: v as CategoriaFixa }))}>
                  <SelectTrigger><SelectValue placeholder="Manter original" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENSINO">Ensino</SelectItem>
                    <SelectItem value="PESQUISA">Pesquisa</SelectItem>
                    <SelectItem value="EXTENSAO">Extensão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Corrigir tipo de atividade</Label>
                <Select value={form.idTipoAtividade} onValueChange={(v) => setForm(p => ({ ...p, idTipoAtividade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Manter original" /></SelectTrigger>
                  <SelectContent>{tipos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Motivo de reprovação */}
            {form.showReject && (
              <div className="space-y-1 border border-red-200 bg-red-50 rounded-md p-3">
                <Label className="text-destructive font-medium">Motivo da reprovação *</Label>
                <Textarea placeholder="Explique ao aluno o que precisa corrigir para que ele possa reenviar..." value={form.motivoReprovacao} onChange={(e) => setForm(p => ({ ...p, motivoReprovacao: e.target.value }))} className="min-h-[80px]" />
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2">
              {!form.showReject
                ? <Button variant="outline" className="text-destructive gap-1" onClick={() => setForm(p => ({ ...p, showReject: true }))}><X className="h-4 w-4" /> Reprovar</Button>
                : <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, showReject: false, motivoReprovacao: "" }))}>Cancelar</Button>
                    <Button variant="destructive" size="sm" onClick={handleReprovar} disabled={submitting || !form.motivoReprovacao.trim()}>
                      <X className="h-4 w-4 mr-1" /> Confirmar Reprovação
                    </Button>
                  </div>}
              {!form.showReject && (
                <Button className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleAprovar} disabled={submitting}>
                  <Check className="h-4 w-4" /> {submitting ? "Aprovando..." : "Aprovar"}
                </Button>
              )}
            </div>
          </div>
        )}
      </ModalForm>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────
function CoordNotifications() {
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
    try {
      await notificacoesApi.marcarLida(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { toast.error("Não foi possível atualizar"); }
  };

  if (loading) return <CardSkeleton count={2} />;
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Notificações</h2>
      {notifications.length === 0
        ? <EmptyState title="Sem notificações" description="Você está em dia!" />
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

// ─── Profile (EDITÁVEL) ──────────────────────────────────────────
function CoordProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [changingPassword, setChangingPassword] = useState(false);
const [senhaAtual, setSenhaAtual] = useState("");
const [novaSenha, setNovaSenha] = useState("");
const [confirmacao, setConfirmacao] = useState("");
const [submittingPw, setSubmittingPw] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); updateProfile({ name }); toast.success("Perfil atualizado!"); setEditing(false);
  };
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmacao) { toast.error("As senhas não coincidem"); return; }
    if (novaSenha.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    setSubmittingPw(true);
    try {
      const { authApi } = await import("@/services/api");
      await authApi.changePassword(senhaAtual, novaSenha, confirmacao);
      toast.success("Senha alterada!"); setChangingPassword(false); setSenhaAtual(""); setNovaSenha(""); setConfirmacao("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSubmittingPw(false); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="font-display font-semibold text-lg mb-4">Meu Perfil</h2>
      <div className="bg-card border rounded-md p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-senac-blue flex items-center justify-center text-white text-xl font-bold">{user?.name?.charAt(0)}</div>
          <div>
            <p className="font-display font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Coordenador</span>
          </div>
        </div>
        {editing ? (
          <form onSubmit={handleSave} className="space-y-3 pt-4 border-t">
            <div className="space-y-1"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
          </form>
        ) : (
          <div className="space-y-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditing(true)} className="w-full"><Pencil className="h-4 w-4 mr-2" /> Editar Perfil</Button>
            <Button variant="outline" onClick={() => setChangingPassword(true)} className="w-full">Alterar Senha</Button>
          </div>
        )}
        {changingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold">Alterar Senha</h3>

            <div className="space-y-1">
              <Label>Senha Atual</Label>
              <Input
                type="password"
                required
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Confirmar</Label>
              <Input
                type="password"
                required
                value={confirmacao}
                onChange={e => setConfirmacao(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setChangingPassword(false);
                  setSenhaAtual("");
                  setNovaSenha("");
                  setConfirmacao("");
                }}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={submittingPw}>
                {submittingPw ? "Salvando..." : "Alterar"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────
export default function CoordinatorDashboardPage() {
  const location = useLocation();
  const title: Record<string, string> = {
    "/coordinator": "Dashboard",
    "/coordinator/students": "Alunos",
    "/coordinator/activities": "Atividades",
    "/coordinator/proofs": "Avaliar Atividades",
    "/coordinator/notifications": "Notificações",
    "/coordinator/profile": "Perfil",
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout navItems={navItems} title={title[location.pathname] || "Dashboard"}>
        <div className="pb-24 lg:pb-8 px-4">
          <Routes>
            <Route index element={<CoordDashboard />} />
            <Route path="students" element={<CoordStudents />} />
            <Route path="activities" element={<CoordActivities />} />
            <Route path="proofs" element={<CoordProofs />} />
            <Route path="notifications" element={<CoordNotifications />} />
            <Route path="profile" element={<CoordProfile />} />
          </Routes>
        </div>
      </DashboardLayout>
      <BottomNav />
    </div>
  );
}
