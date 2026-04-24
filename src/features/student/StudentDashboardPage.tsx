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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard, BookOpen, ClipboardList, Upload, Trophy, Award,
  Bell, User, Download, AlertCircle, RefreshCw, Clock, CheckCircle,
} from "lucide-react";
import { Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import {
    activitiesApi,
  certificadosApi,
  userCursoApi,
  notificacoesApi,
  type ApiActivity,
  type ApiCertificate,
  type ApiNotification,
  type CategoriaFixa,
  type ApiHorasAluno,
} from "@/services/api";

// ─── Helpers ─────────────────────────────────────────────────────
function statusUI(s: string): "pending" | "approved" | "rejected" {
  if (s === "APROVADO") return "approved";
  if (s === "REPROVADO") return "rejected";
  return "pending";
}
const CATEGORIAS: { value: CategoriaFixa; label: string }[] = [
  { value: "ENSINO",   label: "Ensino" },
  { value: "PESQUISA", label: "Pesquisa" },
  { value: "EXTENSAO", label: "Extensão" },
];

// ─── Nav ──────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Dashboard",        path: "/student",               icon: LayoutDashboard },
  { label: "Meus Cursos",      path: "/student/courses",       icon: BookOpen },
  { label: "Minhas Atividades",path: "/student/activities",    icon: ClipboardList },
  { label: "Enviar Atividade", path: "/student/submit",        icon: Upload },
  { label: "Horas",            path: "/student/hours",         icon: Trophy },
  { label: "Certificados",     path: "/student/certificates",  icon: Award },
  { label: "Notificações",     path: "/student/notifications", icon: Bell },
  { label: "Perfil",           path: "/student/profile",       icon: User },
];
const bottomNavItems = [
  { label: "Dashboard",  path: "/student",            icon: LayoutDashboard },
  { label: "Atividades", path: "/student/activities", icon: ClipboardList },
  { label: "Enviar",     path: "/student/submit",     icon: Upload },
  { label: "Horas",      path: "/student/hours",      icon: Trophy },
  { label: "Perfil",     path: "/student/profile",    icon: User },
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
function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [horas, setHoras] = useState<ApiHorasAluno | null>(null);
  const [recent, setRecent] = useState<ApiActivity[]>([]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [acts, cursos] = await Promise.all([
          activitiesApi.listByStudent(user.id),
          userCursoApi.listarCursosDoAluno(user.id),
        ]);
        if (cancelled) return;
        setRecent(acts.slice(0, 5));
        if (cursos.length > 0) {
          const h = await activitiesApi.horasAluno(user.id, cursos[0].id).catch(() => null);
          if (!cancelled) setHoras(h);
        }
      } catch { toast.error("Erro ao carregar dados"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) return <CardSkeleton count={3} />;
  const pct = horas ? Math.min(100, Math.round((horas.horasAprovadas / horas.horasLimite) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Horas aprovadas" value={horas ? `${horas.horasAprovadas}h / ${horas.horasLimite}h` : "—"} icon={Trophy} variant="accent" />
        <MetricCard title="Pendentes" value={horas?.atividadesPendentes ?? 0} icon={Clock} />
        <MetricCard title="Reprovadas" value={horas?.atividadesReprovadas ?? 0} icon={AlertCircle} />
      </div>
      {horas && (
        <div className="bg-card border rounded-md p-5 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Progresso de horas complementares</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
          <p className="text-xs text-muted-foreground">{horas.horasAprovadas}h aprovadas de {horas.horasLimite}h exigidas</p>
        </div>
      )}
      <div className="bg-card border rounded-md p-5">
        <h3 className="font-display font-semibold mb-3">Últimas atividades</h3>
        {recent.length === 0
          ? <p className="text-sm text-muted-foreground">Nenhuma atividade ainda. <Link to="/student/submit" className="text-senac-blue underline">Envie a primeira</Link>.</p>
          : recent.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-xs text-muted-foreground">{a.categoriaFixa} · {a.tipoAtividade} · {a.horasSolicitadas}h</p>
              </div>
              <StatusBadge status={statusUI(a.status)} />
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Courses ──────────────────────────────────────────────────────
function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<{ id: string; nome: string; horasComplementares: number; dataMatricula: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    userCursoApi.listarCursosDoAluno(user.id)
      .then(setCourses)
      .catch(() => toast.error("Erro ao carregar cursos"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <CardSkeleton count={2} />;
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Meus Cursos</h2>
      {courses.length === 0
        ? <EmptyState title="Nenhum curso" description="Você ainda não foi vinculado a nenhum curso." />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <div key={c.id} className="bg-card border rounded-md p-5">
                <h3 className="font-display font-semibold">{c.nome}</h3>
                <p className="text-sm text-muted-foreground mt-1">Teto de horas: {c.horasComplementares}h</p>
                <p className="text-xs text-muted-foreground mt-1">Matriculado em: {c.dataMatricula}</p>
              </div>
            ))}
          </div>}
    </div>
  );
}

// ─── Activities ───────────────────────────────────────────────────
function StudentActivities() {
  const { user } = useAuth();
  const [list, setList] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"TODOS" | "PENDENTE" | "APROVADO" | "REPROVADO">("TODOS");
  const [reenviarId, setReenviarId] = useState<string | null>(null);
  const [reenviarFile, setReenviarFile] = useState<File | null>(null);
  const [reenviarDescricao, setReenviarDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try { setList(await activitiesApi.listByStudent(user.id)); }
    catch { toast.error("Erro ao carregar atividades"); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleReenviar = async () => {
    if (!reenviarId || !user?.id) return;
    setSubmitting(true);
    try {
      await activitiesApi.reenviar({ atividadeId: reenviarId, idAluno: user.id, descricao: reenviarDescricao || undefined, comprovante: reenviarFile ?? undefined });
      toast.success("Atividade reenviada para avaliação!");
      setReenviarId(null); setReenviarFile(null); setReenviarDescricao(""); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao reenviar"); }
    finally { setSubmitting(false); }
  };

  const filtered = filter === "TODOS" ? list : list.filter((a) => a.status === filter);
  if (loading) return <CardSkeleton count={3} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2 className="font-display font-semibold text-lg">Minhas Atividades</h2>
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
        ? <EmptyState title="Nenhuma atividade" description={filter === "TODOS" ? "Envie sua primeira atividade." : `Nenhuma com status ${filter}.`}>
            {filter === "TODOS" && <Link to="/student/submit"><Button size="sm" className="mt-3 gap-2"><Upload className="h-4 w-4" /> Enviar</Button></Link>}
          </EmptyState>
        : filtered.map((a) => (
          <div key={a.id} className="bg-card border rounded-md p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{a.descricao}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded">{a.categoriaFixa}</span>
                  <span className="bg-muted px-2 py-0.5 rounded">{a.tipoAtividade}</span>
                  <span>{a.horasSolicitadas}h solicitadas</span>
                  {a.horasAprovadas != null && <span className="text-green-600 font-medium">{a.horasAprovadas}h aprovadas</span>}
                  <span className="text-muted-foreground">{a.dataSubmissao}</span>
                </div>
              </div>
              <StatusBadge status={statusUI(a.status)} />
            </div>
            {a.status === "REPROVADO" && a.motivoReprovacao && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                <p className="font-medium text-red-700 flex items-center gap-1 mb-1"><AlertCircle className="h-4 w-4" /> Motivo da reprovação:</p>
                <p className="text-red-600">{a.motivoReprovacao}</p>
              </div>
            )}
            {a.comprovanteUrl && (
              <a href={a.comprovanteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-senac-blue underline flex items-center gap-1 w-fit">
                <Download className="h-3 w-3" /> Ver comprovante
              </a>
            )}
            {a.status === "REPROVADO" && (
              reenviarId === a.id
                ? <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                    <Label>Novo comprovante (opcional)</Label>
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png,image/*" onChange={(e) => setReenviarFile(e.target.files?.[0] ?? null)} />
                    <Label>Observação (opcional)</Label>
                    <Textarea placeholder="Explique as correções feitas..." value={reenviarDescricao} onChange={(e) => setReenviarDescricao(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setReenviarId(null)}>Cancelar</Button>
                      <Button size="sm" onClick={handleReenviar} disabled={submitting} className="gap-1">
                        <RefreshCw className="h-3 w-3" /> {submitting ? "Reenviando..." : "Reenviar"}
                      </Button>
                    </div>
                  </div>
                : <Button size="sm" variant="outline" onClick={() => setReenviarId(a.id)} className="gap-1 w-fit">
                    <RefreshCw className="h-3 w-3" /> Corrigir e reenviar
                  </Button>
            )}
          </div>
        ))}
    </div>
  );
}

// ─── Submit (nova atividade) ──────────────────────────────────────
function StudentSubmit() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [cursos, setCursos] = useState<{ id: string; nome: string; horasComplementares: number; dataMatricula: string }[]>([]);
  const [form, setForm] = useState({
    idCurso: "",
    categoriaFixa: "" as CategoriaFixa | "",
    tipoAtividade: "",
    descricao: "",
    horasSolicitadas: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    userCursoApi.listarCursosDoAluno(user.id).then((c) => {
      setCursos(c);
      // Se só tiver um curso, preenche automaticamente
      if (c.length === 1) setForm((p) => ({ ...p, idCurso: c[0].id }));
    }).catch(() => toast.error("Erro ao carregar seus cursos"));
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !file || !form.categoriaFixa || !form.tipoAtividade.trim()) return;

    // Curso: usa o único disponível ou o selecionado
    const cursoId = form.idCurso || (cursos.length === 1 ? cursos[0].id : "");
    if (!cursoId) { toast.error("Selecione um curso"); return; }

    setSubmitting(true);
    try {
        await activitiesApi.submeter({
          idAluno: user.id,
          categoriaFixa: form.categoriaFixa,
          tipoAtividade: form.tipoAtividade,
          descricao: form.descricao,
          horasSolicitadas: Number(form.horasSolicitadas),
          idCurso: form.idCurso,
          comprovante: file,
       });
      toast.success("Atividade enviada! Aguarde a avaliação do coordenador.");
      setForm((p) => ({ ...p, categoriaFixa: "",tipoAtividade: "", descricao: "",horasSolicitadas: "", }));
      setFile(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao enviar"); }
    finally { setSubmitting(false); }
  };

  const cursosMultiplos = cursos.length > 1;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="bg-card border rounded-md p-5 space-y-4">

        {/* Seletor de curso — só aparece se o aluno tiver mais de 1 curso */}
        {cursosMultiplos && (
          <div className="space-y-2">
            <Label>Curso *</Label>
            <Select value={form.idCurso} onValueChange={(v) => setForm(p => ({ ...p, idCurso: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
              <SelectContent>{cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Categoria *</Label>
          <Select value={form.categoriaFixa} onValueChange={(v) => setForm(p => ({ ...p, categoriaFixa: v as CategoriaFixa }))}>
            <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
            <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Atividade *</Label>
          <Input
            placeholder="Ex: Palestra, Curso, Workshop..."
            required
            value={form.tipoAtividade}
            onChange={(e) =>
              setForm((p) => ({ ...p, tipoAtividade: e.target.value }))
            }
          />
      </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea placeholder="Informações adicionais sobre a atividade (opcional)" value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label>Quantidade de horas *</Label>
          <Input type="number" min="1" placeholder="Ex: 20" required value={form.horasSolicitadas} onChange={(e) => setForm(p => ({ ...p, horasSolicitadas: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label>Comprovante / Certificado *</Label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png,image/*" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="text-xs text-muted-foreground">Aceito: PDF, JPG, PNG — máximo 10MB. No celular você pode tirar foto diretamente.</p>
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={submitting || !form.categoriaFixa || !form.tipoAtividade.trim() || !form.horasSolicitadas || !file || (cursosMultiplos && !form.idCurso)}>
          {submitting
            ? <><span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Enviando...</>
            : <><Upload className="h-4 w-4" /> Enviar Atividade</>}
        </Button>
      </form>
    </div>
  );
}

// ─── Hours ────────────────────────────────────────────────────────
function StudentHours() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cursos, setCursos] = useState<{ id: string; nome: string }[]>([]);
  const [selectedCurso, setSelectedCurso] = useState("");
  const [horas, setHoras] = useState<ApiHorasAluno | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    userCursoApi.listarCursosDoAluno(user.id).then((c) => {
      setCursos(c); if (c.length > 0) setSelectedCurso(c[0].id);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selectedCurso) return;
    activitiesApi.horasAluno(user.id, selectedCurso).then(setHoras).catch(() => setHoras(null));
  }, [user?.id, selectedCurso]);

  if (loading) return <CardSkeleton count={2} />;
  const pct = horas ? Math.min(100, Math.round((horas.horasAprovadas / horas.horasLimite) * 100)) : 0;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Horas Complementares</h2>
      {cursos.length > 1 && (
        <Select value={selectedCurso} onValueChange={setSelectedCurso}>
          <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
          <SelectContent>{cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {horas ? (
        <div className="space-y-4">
          <div className="bg-card border rounded-md p-5 space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>Progresso</span><span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-4" />
            <p className="text-xs text-muted-foreground">{horas.horasAprovadas}h de {horas.horasLimite}h exigidas · {horas.horasRestantes}h restantes</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{horas.atividadesAprovadas}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> Aprovadas</p>
            </div>
            <div className="bg-card border rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{horas.atividadesPendentes}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Pendentes</p>
            </div>
            <div className="bg-card border rounded-md p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{horas.atividadesReprovadas}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><AlertCircle className="h-3 w-3" /> Reprovadas</p>
            </div>
          </div>
        </div>
      ) : <EmptyState title="Sem dados de horas" description="Vincule-se a um curso e envie atividades." />}
    </div>
  );
}

// ─── Certificates ─────────────────────────────────────────────────
function StudentCertificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [horasInfo, setHorasInfo] = useState<{ aprovadas: number; limite: number } | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    // Carrega certificados e horas em paralelo
    Promise.all([
      certificadosApi.listByAluno(user.id),
      userCursoApi.listarCursosDoAluno(user.id).then(async (cursos) => {
        if (cursos.length === 0) return null;
        const h = await activitiesApi.horasAluno(user.id, cursos[0].id).catch(() => null);
        return h ? { aprovadas: h.horasAprovadas, limite: h.horasLimite } : null;
      }),
    ])
      .then(([c, h]) => { setCerts(c); setHorasInfo(h); })
      .catch(() => toast.error("Erro ao carregar certificados"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <CardSkeleton count={2} />;

  const atingiuHoras = horasInfo != null && horasInfo.aprovadas >= horasInfo.limite;

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Certificados</h2>
      {certs.length === 0 ? (
        <EmptyState
          title="Nenhum certificado disponível"
          description={
            atingiuHoras
              ? "Você atingiu as horas exigidas! Seu certificado será emitido em breve."
              : horasInfo
                ? `Após atingir as ${horasInfo.limite}h totais que o curso exige, o seu certificado aparecerá aqui. Você tem ${horasInfo.aprovadas}h aprovadas.`
                : "Após atingir as horas totais que o curso exige, o seu certificado aparecerá aqui."
          }
        />
      ) : (
        certs.map((c) => (
          <div key={c.id} className="bg-card border rounded-md p-4 flex items-center justify-between">
            <div><p className="font-medium">{c.activityTitle}</p><p className="text-xs text-muted-foreground">{c.date}</p></div>
            <a href={c.downloadUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" /> Baixar</Button>
            </a>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────
function StudentNotifications() {
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
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch { toast.error("Não foi possível atualizar"); }
  };

  if (loading) return <CardSkeleton count={2} />;
  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-lg">Notificações</h2>
      {notifications.length === 0
        ? <EmptyState title="Nenhuma notificação" description="Você está em dia!" />
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

// ─── Profile ─────────────────────────────────────────────────────
function StudentProfile() {
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
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmacao) { toast.error("As senhas não coincidem"); return; }
    if (novaSenha.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    setSubmittingPw(true);
    try {
      const { authApi } = await import("@/services/api");
      await authApi.changePassword(senhaAtual, novaSenha, confirmacao);
      toast.success("Senha alterada!"); setChangingPassword(false); setSenhaAtual(""); setNovaSenha(""); setConfirmacao("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao alterar senha"); }
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
            {user?.matricula && <p className="text-xs text-muted-foreground">Matrícula: {user.matricula}</p>}
          </div>
        </div>
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t">
            <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button><Button type="submit">Salvar</Button></div>
          </form>
        ) : (
          <div className="space-y-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditing(true)} className="w-full">Editar Perfil</Button>
            <Button variant="outline" onClick={() => setChangingPassword(true)} className="w-full">Alterar Senha</Button>
          </div>
        )}
        {changingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t">
            <h3 className="font-display font-semibold">Alterar Senha</h3>
            <div className="space-y-2"><Label>Senha Atual</Label><Input type="password" required value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} /></div>
            <div className="space-y-2"><Label>Nova Senha</Label><Input type="password" placeholder="Mínimo 8 caracteres" required value={novaSenha} onChange={e => setNovaSenha(e.target.value)} /></div>
            <div className="space-y-2"><Label>Confirmar Nova Senha</Label><Input type="password" required value={confirmacao} onChange={e => setConfirmacao(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setChangingPassword(false); setSenhaAtual(""); setNovaSenha(""); setConfirmacao(""); }}>Cancelar</Button>
              <Button type="submit" disabled={submittingPw}>{submittingPw ? "Salvando..." : "Alterar Senha"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────
const titleMap: Record<string, string> = {
  "/student": "Dashboard",
  "/student/courses": "Meus Cursos",
  "/student/activities": "Minhas Atividades",
  "/student/submit": "Enviar Atividade",
  "/student/hours": "Horas Complementares",
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
            <Route path="submit" element={<StudentSubmit />} />
            <Route path="hours" element={<StudentHours />} />
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
