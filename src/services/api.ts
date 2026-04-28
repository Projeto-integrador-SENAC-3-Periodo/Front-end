import type { UserRole } from "@/contexts/AuthContext";
 
const BASE_URL = import.meta.env.VITE_API_URL;
 
function getToken(): string | null {
  return localStorage.getItem("senac_token");
}
 
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init?.headers as Record<string, string>),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
  if (res.status === 204 || !text) return undefined as T;
  try { return JSON.parse(text) as T; } catch { return undefined as T; }
}
 
export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
  } catch { return iso; }
}
 
// ─── Tipos base ───────────────────────────────────────────────────
 
export type CategoriaFixa = "ENSINO" | "PESQUISA" | "EXTENSAO";
export type StatusAtividade = "PENDENTE" | "APROVADO" | "REPROVADO";
 
export interface ApiUser {
  id: string; name: string; email: string;
  profile: string; role: UserRole; matricula: string; createdAt: string;
}
 
export interface ApiCourse {
  id: string; name: string; description: string;
  /** Ex: "120h" */
  hours: string;
  /** Valor numérico do teto de horas complementares */
  horasComplementares: number;
  coordinatorId: string; coordinatorName: string; studentCount: number;
}
 
/** Atividade no novo modelo: submetida pelo aluno, avaliada pelo coordenador */
export interface ApiActivity {
  id: string;
  idAluno: string;
  nomeAluno: string;
  idCurso: string;
  nomeCurso: string;
  categoriaFixa: CategoriaFixa;
  idTipoAtividade?: string;
  tipoAtividade: string;
  descricao: string;
  horasSolicitadas: number;
  horasAprovadas: number | null;
  comprovanteUrl: string | null;
  status: StatusAtividade;
  motivoReprovacao: string | null;
  tentativas: number;
  dataSubmissao: string;
  dataValidacao: string | null;
}
 
export interface ApiHorasAluno {
  idAluno: number; nomeAluno: string;
  horasAprovadas: number; horasLimite: number; horasRestantes: number;
  atividadesPendentes: number; atividadesAprovadas: number; atividadesReprovadas: number;
}
 
export interface ApiNotification {
  id: number; titulo: string; mensagem: string; time: string; read: boolean;
}
 
export interface ApiCertificate {
  id: string; activityTitle: string; studentName: string; date: string; downloadUrl: string;
}
 
export interface ApiLog { action: string; user: string; date: string; }
 
export interface TipoAtividade {
  id: string;
  nome: string;
  categoriaFixa: CategoriaFixa;
  horasMaximas: number;
  requisito?: string;
  ativo: boolean;
}
 
export interface UserCursoVinculo {
  id: string; nome: string; email: string; matricula?: string;
  idCurso: string; nomeCurso: string; papel: string;
}
 
// ─── Helpers privados ─────────────────────────────────────────────
 
function mapPerfilToRole(perfil: string): UserRole {
  if (perfil === "ADMINISTRADOR") return "admin";
  if (perfil === "COORDENADOR") return "coordinator";
  return "student";
}
function profileLabel(perfil: string): string {
  if (perfil === "ADMINISTRADOR") return "Administrador";
  if (perfil === "COORDENADOR") return "Coordenador";
  return "Aluno";
}
function parseHorasToInt(hours: string): number {
  const n = parseInt(String(hours).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}
 
function mapUserRow(u: Record<string, unknown>): ApiUser {
  return {
    id: String(u.id ?? ""),
    name: String(u.nome ?? ""),
    email: String(u.email ?? ""),
    profile: profileLabel(String(u.perfil ?? "")),
    role: mapPerfilToRole(String(u.perfil ?? "")),
    matricula: u.matricula != null && String(u.matricula) !== "" ? String(u.matricula) : "-",
    createdAt: "-",
  };
}
 
function mapCurso(c: Record<string, unknown>): ApiCourse {
  // Backend agora usa horasComplementares (teto), não cargaHorariaMinima
  const hc = c.horasComplementares ?? c.cargaHorariaMinima;
  const num = hc != null ? Number(hc) : 0;
  return {
    id: String(c.id ?? ""),
    name: String(c.nome ?? ""),
    description: String(c.descricao ?? ""),
    hours: num > 0 ? `${num}h` : "0h",
    horasComplementares: num,
    coordinatorId: "",
    coordinatorName: "—",
    studentCount: 0,
  };
}
 
function mapAtividadeRow(a: Record<string, unknown>): ApiActivity {
  return {
    id: String(a.id ?? ""),
    idAluno: a.idAluno != null ? String(a.idAluno) : "",
    nomeAluno: String(a.nomeAluno ?? ""),
    idCurso: String(a.idCurso ?? ""),
    nomeCurso: String(a.nomeCurso ?? ""),
    categoriaFixa: (String(a.categoriaFixa ?? "EXTENSAO")) as CategoriaFixa,
    tipoAtividade: a.nomeTipoAtividade != null ? String(a.nomeTipoAtividade) : String(a.tipoAtividade ?? ""),
    idTipoAtividade: a.idTipoAtividade != null ? String(a.idTipoAtividade) : undefined,
    descricao: String(a.descricao ?? ""),
    horasSolicitadas: Number(a.horasSolicitadas ?? 0),
    horasAprovadas: a.horasAprovadas != null ? Number(a.horasAprovadas) : null,
    comprovanteUrl: a.comprovanteUrl != null ? String(a.comprovanteUrl) : null,
    status: (String(a.status ?? "PENDENTE")) as StatusAtividade,
    motivoReprovacao: a.motivoReprovacao != null ? String(a.motivoReprovacao) : null,
    tentativas: Number(a.tentativas ?? 0),
    dataSubmissao: formatDate(String(a.dataSubmissao ?? "")),
    dataValidacao: a.dataValidacao != null ? formatDate(String(a.dataValidacao)) : null,
  };
}
 
// ─── Users API ────────────────────────────────────────────────────
 
export const usersApi = {
  list: async (): Promise<ApiUser[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/usuarios");
    if (!Array.isArray(raw)) return [];
    return raw.map(mapUserRow);
  },
  search: async (q: string, perfil?: string): Promise<ApiUser[]> => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (perfil) params.set("perfil", perfil);
    const raw = await apiFetch<Record<string, unknown>[]>(`/usuarios/busca?${params.toString()}`);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapUserRow);
  },
  listAlunos: async (): Promise<ApiUser[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/usuarios/alunos");
    if (!Array.isArray(raw)) return [];
    return raw.map(mapUserRow);
  },
  create: async (data: { nome: string; email: string; perfil: "ADMINISTRADOR" | "COORDENADOR" | "ALUNO"; matricula?: string | null }): Promise<ApiUser> => {
    await apiFetch<string>("/usuarios/cadastro", { method: "POST", body: JSON.stringify(data) });
    const list = await usersApi.list();
    return list.find((x) => x.email === data.email) ?? {
      id: "", name: data.nome, email: data.email,
      profile: profileLabel(data.perfil), role: mapPerfilToRole(data.perfil),
      matricula: data.matricula ?? "-", createdAt: "-",
    };
  },
  update: async (id: string, data: Partial<ApiUser>): Promise<ApiUser> => {
    const perfil = data.role === "admin" ? "ADMINISTRADOR" : data.role === "coordinator" ? "COORDENADOR" : "ALUNO";
    const body: Record<string, unknown> = { nome: data.name, email: data.email, perfil };
    if (data.matricula && data.matricula !== "-") body.matricula = data.matricula;
    await apiFetch<unknown>(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) });
    const list = await usersApi.list();
    return list.find((x) => x.id === id) ?? { id, name: data.name ?? "", email: data.email ?? "", profile: data.profile ?? "", role: data.role ?? "student", matricula: data.matricula ?? "-", createdAt: "-" };
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/usuarios/${id}`, { method: "DELETE" });
  },
};
 
// ─── Courses API ──────────────────────────────────────────────────
 
async function countAlunosCurso(cursoId: string): Promise<number> {
  try {
    const list = await apiFetch<Record<string, unknown>[]>(`/cursos/${cursoId}/alunos`);
    if (!Array.isArray(list)) return 0;
    return list.filter((r) => String(r.papel ?? "") === "ALUNO").length;
  } catch { return 0; }
}
 
async function findCoordinatorForCourse(cursoId: string): Promise<{ name: string; id: string } | null> {
  try {
    const list = await apiFetch<Record<string, unknown>[]>(`/cursos/${cursoId}/alunos`);
    if (!Array.isArray(list)) return null;
    const coord = list.find((r) => String(r.papel ?? "") === "COORDENADOR");
    if (!coord) return null;
    return { name: String(coord.nomeUser ?? "—"), id: String(coord.idUser ?? "") };
  } catch { return null; }
}
 
export const coursesApi = {
  list: async (): Promise<ApiCourse[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/cursos");
    if (!Array.isArray(raw)) return [];
    const mapped = raw.map(mapCurso);
    return Promise.all(mapped.map(async (course) => {
      const [studentCount, coord] = await Promise.all([
        countAlunosCurso(course.id),
        findCoordinatorForCourse(course.id),
      ]);
      return { ...course, studentCount, coordinatorId: coord?.id ?? "", coordinatorName: coord?.name ?? "—" };
    }));
  },
  getById: async (id: string): Promise<ApiCourse> => {
    const raw = await apiFetch<Record<string, unknown>>(`/cursos/${id}`);
    return mapCurso(raw ?? {});
  },
  /** Apenas ADMINISTRADOR pode criar cursos no backend */
  create: async (data: { name: string; description: string; horasComplementares: number }): Promise<ApiCourse> => {
    const body = { nome: data.name, descricao: data.description, horasComplementares: data.horasComplementares };
    const created = await apiFetch<Record<string, unknown>>("/cursos", { method: "POST", body: JSON.stringify(body) });
    return { ...mapCurso(created ?? {}), studentCount: 0 };
  },
  /** Apenas ADMINISTRADOR pode editar cursos */
  update: async (id: string, data: { name: string; description: string; horasComplementares: number }): Promise<ApiCourse> => {
    const body = { nome: data.name, descricao: data.description, horasComplementares: data.horasComplementares };
    const updated = await apiFetch<Record<string, unknown>>(`/cursos/${id}`, { method: "PUT", body: JSON.stringify(body) });
    const m = mapCurso(updated ?? {});
    const [sc, coord] = await Promise.all([countAlunosCurso(id), findCoordinatorForCourse(id)]);
    return { ...m, studentCount: sc, coordinatorId: coord?.id ?? "", coordinatorName: coord?.name ?? "—" };
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/cursos/${id}`, { method: "DELETE" });
  },
};
 
// ─── Tipos de atividade ───────────────────────────────────────────
 
function mapTipoAtividade(t: Record<string, unknown>): TipoAtividade {
  return {
    id: String(t.id ?? t.idTA ?? ""),
    nome: String(t.nome ?? ""),
    categoriaFixa: String(t.categoriaFixa ?? t.categoriaF ?? "EXTENSAO") as CategoriaFixa,
    horasMaximas: Number(t.horasMaximas ?? 0),
    requisito: t.requisito != null ? String(t.requisito) : undefined,
    ativo: Boolean(t.ativo ?? true),
  };
}
 
export const tiposAtividadeApi = {
  list: async (): Promise<TipoAtividade[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/tipos-atividade");
    if (!Array.isArray(raw)) return [];
    return raw.map(mapTipoAtividade);
  },
  listTodos: async (): Promise<TipoAtividade[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/tipos-atividade/todos");
    if (!Array.isArray(raw)) return [];
    return raw.map(mapTipoAtividade);
  },
  listByCategoria: async (categoria: CategoriaFixa): Promise<TipoAtividade[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/tipos-atividade/categoria/${categoria}`);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapTipoAtividade);
  },
  create: async (data: { nome: string; categoriaFixa: CategoriaFixa; horasMaximas: number; requisito?: string }): Promise<TipoAtividade> => {
    const raw = await apiFetch<Record<string, unknown>>("/tipos-atividade", { method: "POST", body: JSON.stringify(data) });
    return mapTipoAtividade(raw ?? {});
  },
  update: async (id: string, data: { nome: string; categoriaFixa: CategoriaFixa; horasMaximas: number; requisito?: string }): Promise<TipoAtividade> => {
    const raw = await apiFetch<Record<string, unknown>>(`/tipos-atividade/${id}`, { method: "PUT", body: JSON.stringify(data) });
    return mapTipoAtividade(raw ?? {});
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/tipos-atividade/${id}`, { method: "DELETE" });
  },
  reativar: async (id: string): Promise<TipoAtividade> => {
    const raw = await apiFetch<Record<string, unknown>>(`/tipos-atividade/${id}/reativar`, { method: "PATCH" });
    return mapTipoAtividade(raw ?? {});
  },
};
 
// ─── Activities API (novo modelo) ────────────────────────────────
 
export interface SubmeterAtividadeInput {
  idAluno: string;
  categoriaFixa: CategoriaFixa;
  idTipoAtividade: string;
  descricao?: string;
  horasSolicitadas: number;
  idCurso: string;
  comprovante: File;
}
 
export interface ReenviarAtividadeInput {
  atividadeId: string;
  idAluno: string;
  categoriaFixa?: CategoriaFixa;
  tipoAtividade?: string;
  descricao?: string;
  horasSolicitadas?: number;
  comprovante?: File;
}
 
export interface AvaliarAtividadeInput {
  idTipoAtividade: any;
  atividadeId: string;
  status: "APROVADO" | "REPROVADO";
  horasAprovadas?: number;
  categoriaFixa?: CategoriaFixa;
  motivoReprovacao?: string;
}
 
export const activitiesApi = {
  /** Lista atividades do aluno pelo endpoint correto */
  listByStudent: async (alunoId: string): Promise<ApiActivity[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/atividades/aluno/${alunoId}`);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapAtividadeRow);
  },
 
  /** Lista atividades PENDENTES de um curso (fila do coordenador) */
  listPendingByCourse: async (cursoId: string): Promise<ApiActivity[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/atividades/pendentes/curso/${cursoId}`);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapAtividadeRow);
  },
 
  /** Lista todas as atividades de um curso (qualquer status) */
  listByCourse: async (cursoId: string): Promise<ApiActivity[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/atividades/curso/${cursoId}`);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapAtividadeRow);
  },
 
  getById: async (id: string): Promise<ApiActivity> => {
    const raw = await apiFetch<Record<string, unknown>>(`/atividades/${id}`);
    return mapAtividadeRow(raw ?? {});
  },
 
  /** Aluno submete nova atividade com comprovante — POST /atividades/submeter */
  submeter: async (input: SubmeterAtividadeInput): Promise<ApiActivity> => {
    const fd = new FormData();
    fd.append("idAluno", input.idAluno);
    fd.append("categoriaFixa", input.categoriaFixa);
    fd.append("tipoAtividade", input.idTipoAtividade);
    if (input.descricao) fd.append("descricao", input.descricao);
    fd.append("horasSolicitadas", String(input.horasSolicitadas));
    fd.append("idCurso", input.idCurso);
    fd.append("comprovante", input.comprovante);
    const raw = await apiFetch<Record<string, unknown>>("/atividades/submeter", { method: "POST", body: fd });
    return mapAtividadeRow(raw ?? {});
  },
 
  /** Aluno reenvia atividade reprovada — PUT /atividades/{id}/reenviar */
  reenviar: async (input: ReenviarAtividadeInput): Promise<ApiActivity> => {
    const fd = new FormData();
    fd.append("idAluno", input.idAluno);
    if (input.categoriaFixa) fd.append("categoriaFixa", input.categoriaFixa);
    if (input.tipoAtividade) fd.append("tipoAtividade", input.tipoAtividade);
    if (input.descricao) fd.append("descricao", input.descricao);
    if (input.horasSolicitadas) fd.append("horasSolicitadas", String(input.horasSolicitadas));
    if (input.comprovante) fd.append("comprovante", input.comprovante);
    const raw = await apiFetch<Record<string, unknown>>(`/atividades/${input.atividadeId}/reenviar`, { method: "PUT", body: fd });
    return mapAtividadeRow(raw ?? {});
  },
 
  /** Coordenador avalia atividade — PUT /atividades/{id}/avaliar */
  avaliar: async (input: AvaliarAtividadeInput): Promise<ApiActivity> => {
    const body: Record<string, unknown> = { status: input.status };
    if (input.horasAprovadas != null) body.horasAprovadas = input.horasAprovadas;
    if (input.categoriaFixa) body.categoriaFixa = input.categoriaFixa;
    if (input.idTipoAtividade) body.idTipoAtividade = Number(input.idTipoAtividade);
    if (input.motivoReprovacao) body.motivoReprovacao = input.motivoReprovacao;
    const raw = await apiFetch<Record<string, unknown>>(`/atividades/${input.atividadeId}/avaliar`, { method: "PUT", body: JSON.stringify(body) });
    return mapAtividadeRow(raw ?? {});
  },
 
  /** Resumo de horas complementares do aluno em um curso */
  horasAluno: async (alunoId: string, cursoId: string): Promise<ApiHorasAluno> => {
    const raw = await apiFetch<Record<string, unknown>>(`/atividades/horas/aluno/${alunoId}/curso/${cursoId}`);
    return {
      idAluno: Number(raw?.idAluno ?? 0),
      nomeAluno: String(raw?.nomeAluno ?? ""),
      horasAprovadas: Number(raw?.horasAprovadas ?? 0),
      horasLimite: Number(raw?.horasLimite ?? 100),
      horasRestantes: Number(raw?.horasRestantes ?? 100),
      atividadesPendentes: Number(raw?.atividadesPendentes ?? 0),
      atividadesAprovadas: Number(raw?.atividadesAprovadas ?? 0),
      atividadesReprovadas: Number(raw?.atividadesReprovadas ?? 0),
    };
  },
};
 
// ─── Logs API ─────────────────────────────────────────────────────
 
export const logsApi = {
  list: async (): Promise<ApiLog[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/logs");
    if (!Array.isArray(raw)) return [];
    return raw.map((row) => {
      const userObj = row.user as Record<string, unknown> | undefined;
      const nome = userObj && typeof userObj === "object" && "nome" in userObj ? String((userObj as { nome?: string }).nome ?? "") : "";
      return { action: String(row.acao ?? ""), user: nome || "—", date: formatDate(String(row.createdAt ?? "")) };
    });
  },
};
 
// ─── Notificações ─────────────────────────────────────────────────
 
export const notificacoesApi = {
  list: async (userId: string): Promise<ApiNotification[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/notificacoes?userId=${encodeURIComponent(userId)}`);
    if (!Array.isArray(raw)) return [];
    return raw.map((n) => ({
      id: Number(n.idN ?? n.id ?? 0),
      titulo: String(n.titulo ?? ""),
      mensagem: String(n.mensagem ?? ""),
      time: formatDate(String(n.createdAt ?? "")),
      read: String(n.status ?? "") === "LIDA",
    }));
  },
  marcarLida: async (id: number): Promise<void> => {
    await apiFetch(`/notificacoes/${id}/lida`, { method: "PUT" });
  },
};
 
// ─── Certificados ─────────────────────────────────────────────────
 
export const certificadosApi = {
  listByAluno: async (alunoId: string): Promise<ApiCertificate[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/certificados/aluno/${alunoId}`);
    if (!Array.isArray(raw)) return [];
    return raw.map((c) => ({
      id: String(c.id ?? ""),
      activityTitle: String(c.tituloAtividade ?? ""),
      studentName: String(c.nomeAluno ?? ""),
      date: formatDate(String(c.dataEmissao ?? "")),
      downloadUrl: String(c.arquivoUrl ?? ""),
    }));
  },
};
 
// ─── Auth ─────────────────────────────────────────────────────────
 
export const authApi = {
  changePassword: async (senhaAtual: string, novaSenha: string, confirmacaoNovaSenha: string): Promise<void> => {
    await apiFetch<string>("/auth/alterar-senha", { method: "PUT", body: JSON.stringify({ senhaAtual, novaSenha, confirmacaoNovaSenha }) });
  },
};
 
// ─── Vínculo aluno–curso ──────────────────────────────────────────
 
export const userCursoApi = {
  vincular: async (cursoId: string, idUser: string): Promise<void> => {
    await apiFetch(`/cursos/${cursoId}/alunos`, { method: "POST", body: JSON.stringify({ idUser: Number(idUser), papel: "ALUNO" }) });
  },
  vincularCoordenador: async (cursoId: string, idUser: string): Promise<void> => {
    await apiFetch(`/cursos/${cursoId}/alunos`, { method: "POST", body: JSON.stringify({ idUser: Number(idUser), papel: "COORDENADOR" }) });
  },
  listarTodos: async (cursoId: string): Promise<UserCursoVinculo[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/cursos/${cursoId}/alunos`);
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => ({
      id: String(r.idUser ?? ""),
      nome: String(r.nomeUser ?? ""),
      email: String(r.emailUser ?? ""),
      matricula: r.matricula != null ? String(r.matricula) : undefined,
      idCurso: String(r.idCurso ?? ""),
      nomeCurso: String(r.nomeCurso ?? ""),
      papel: String(r.papel ?? ""),
    }));
  },
  listarAlunos: async (cursoId: string) => {
    const all = await userCursoApi.listarTodos(cursoId);
    return all.filter((r) => r.papel === "ALUNO");
  },
  listarCursosDoAluno: async (alunoId: string): Promise<{ id: string; nome: string; horasComplementares: number; dataMatricula: string }[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/cursos/aluno/${alunoId}`);
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => ({
      id: String(r.idCurso ?? ""),
      nome: String(r.nomeCurso ?? ""),
      horasComplementares: Number(r.horasComplementares ?? 100),
      dataMatricula: formatDate(String(r.dataMatricula ?? "")),
    }));
  },
  desvincular: async (cursoId: string, alunoId: string): Promise<void> => {
    await apiFetch<void>(`/cursos/${cursoId}/alunos/${alunoId}`, { method: "DELETE" });
  },
};
 
// ─── Categoria de atividade ───────────────────────────────────────
 
export interface CategoriaAtividade { id: string; nome: string; descricao?: string; }
export const categoriaAtividadeApi = {
  list: async (): Promise<CategoriaAtividade[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/categoriaAtiv");
    if (!Array.isArray(raw)) return [];
    return raw.map((c) => ({ id: String(c.idCatA ?? c.id ?? ""), nome: String(c.nome ?? ""), descricao: c.descricao != null ? String(c.descricao) : undefined }));
  },
  create: async (data: { nome: string; descricao?: string }): Promise<CategoriaAtividade> => {
    const raw = await apiFetch<Record<string, unknown>>("/categoriaAtiv", { method: "POST", body: JSON.stringify(data) });
    return { id: String(raw.idCatA ?? raw.id ?? ""), nome: String(raw.nome ?? ""), descricao: raw.descricao != null ? String(raw.descricao) : undefined };
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/categoriaAtiv/${id}`, { method: "DELETE" });
  },
};