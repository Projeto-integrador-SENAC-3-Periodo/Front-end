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
  if (!res.ok) {
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204 || !text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

// ─── Types ───────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  profile: string;
  role: UserRole;
  matricula: string;
  createdAt: string;
}

export interface ApiCourse {
  id: string;
  name: string;
  description: string;
  hours: string;
  coordinatorId: string;
  coordinatorName: string;
  studentCount: number;
}

export interface ApiActivity {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  category: string;
  points: number;
  proofType: "certificate" | "photo" | "document";
  /** Metadados do backend */
  idAluno?: string;
  idTipoAtividade?: string;
  nomeAluno?: string;
  horasSolicitadas?: number | null;
  backendStatus?: string;
}

export interface ApiProof {
  id: string;
  studentId: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  fileName?: string;
}

export interface ApiNotification {
  id: number;
  titulo: string;
  mensagem: string;
  time: string;
  read: boolean;
}

export interface ApiCertificate {
  id: string;
  activityTitle: string;
  studentName: string;
  date: string;
  downloadUrl: string;
}

export interface ApiLog {
  action: string;
  user: string;
  date: string;
}

export interface TipoAtividade {
  id: string;
  nome: string;
  descricao?: string;
}

export interface PontuacaoAluno {
  totalPontos: number;
  atividadesConcluidas: number;
}

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

function mapAtividadeStatus(s: string | undefined): ApiActivity["proofType"] {
  return "document";
}

function mapAtividadeRow(a: Record<string, unknown>): ApiActivity {
  const status = String(a.status ?? "");
  return {
    id: String(a.id ?? ""),
    title: String(a.titulo ?? ""),
    description: String(a.descricao ?? ""),
    courseId: String(a.idCurso ?? ""),
    courseName: String(a.nomeCurso ?? ""),
    category: String(a.nomeTipoAtividade ?? ""),
    points: Number(a.pontos ?? 0),
    proofType: mapAtividadeStatus(status),
    idAluno: a.idAluno != null ? String(a.idAluno) : undefined,
    idTipoAtividade: a.idTipoAtividade != null ? String(a.idTipoAtividade) : undefined,
    nomeAluno: String(a.nomeAluno ?? ""),
    horasSolicitadas: a.horasSolicitadas != null ? Number(a.horasSolicitadas) : null,
    backendStatus: status,
  };
}

function mapComprovacaoStatus(s: string): ApiProof["status"] {
  if (s === "APROVADO") return "approved";
  if (s === "REJEITADO") return "rejected";
  return "pending";
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

// ─── Users API ───────────────────────────────────────────────────
export const usersApi = {
  list: async (): Promise<ApiUser[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/usuarios");
    if (!Array.isArray(raw)) return [];
    return raw.map((u) => ({
      id: String(u.id ?? ""),
      name: String(u.nome ?? ""),
      email: String(u.email ?? ""),
      profile: profileLabel(String(u.perfil ?? "")),
      role: mapPerfilToRole(String(u.perfil ?? "")),
      matricula: u.matricula != null && String(u.matricula) !== "" ? String(u.matricula) : "-",
      createdAt: "-",
    }));
  },

  create: async (data: {
  nome: string;
  email: string;
  perfil: "ADMINISTRADOR" | "COORDENADOR" | "ALUNO";
  matricula?: string | null;
}): Promise<ApiUser> => {
  await apiFetch<string>("/usuarios/cadastro", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const list = await usersApi.list();
  const found = list.find((x) => x.email === data.email);
  if (found) return found;
  return {
    id: "",
    name: data.nome,
    email: data.email,
    profile: data.perfil === "ADMINISTRADOR" ? "Administrador" : data.perfil === "COORDENADOR" ? "Coordenador" : "Aluno",
    role: data.perfil === "ADMINISTRADOR" ? "admin" : data.perfil === "COORDENADOR" ? "coordinator" : "student",
    matricula: data.matricula ?? "-",
    createdAt: "-",
  };
},

  update: async (id: string, data: Partial<ApiUser>): Promise<ApiUser> => {
    const perfil =
      data.role === "admin" ? "ADMINISTRADOR"
      : data.role === "coordinator" ? "COORDENADOR"
      : "ALUNO";
    const body: Record<string, unknown> = {
      nome: data.name,
      email: data.email,
      perfil,
    };
    if (data.matricula && data.matricula !== "-") body.matricula = data.matricula;
    await apiFetch<unknown>(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) });
    const list = await usersApi.list();
    return list.find((x) => x.id === id) ?? { id, name: data.name ?? "", email: data.email ?? "", profile: data.profile ?? "", role: data.role ?? "student", matricula: data.matricula ?? "-", createdAt: "-" };
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/usuarios/${id}`, { method: "DELETE" });
  },
};

// ─── Courses API ─────────────────────────────────────────────────
async function countAlunosCurso(cursoId: string): Promise<number> {
  try {
    const list = await apiFetch<unknown[]>(`/cursos/${cursoId}/alunos`);
    return Array.isArray(list) ? list.length : 0;
  } catch {
    return 0;
  }
}

function mapCurso(c: Record<string, unknown>): ApiCourse {
  const ch = c.cargaHorariaMinima;
  const hours = ch != null ? `${ch}h` : "0h";
  return {
    id: String(c.id ?? ""),
    name: String(c.nome ?? ""),
    description: String(c.descricao ?? ""),
    hours,
    coordinatorId: "",
    coordinatorName: "—",
    studentCount: 0,
  };
}

export const coursesApi = {
  list: async (): Promise<ApiCourse[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/cursos");
    if (!Array.isArray(raw)) return [];
    const mapped = raw.map(mapCurso);
    const withCounts = await Promise.all(
      mapped.map(async (course) => ({
        ...course,
        studentCount: await countAlunosCurso(course.id),
      }))
    );
    return withCounts;
  },

  listByCoordinator: async (_coordId: string): Promise<ApiCourse[]> => {
    return coursesApi.list();
  },

  create: async (data: Omit<ApiCourse, "id" | "studentCount">): Promise<ApiCourse> => {
    const body = {
      nome: data.name,
      descricao: data.description,
      cargaHorariaMinima: parseHorasToInt(data.hours),
    };
    const created = await apiFetch<Record<string, unknown>>("/cursos", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const m = mapCurso(created ?? {});
    return { ...m, studentCount: 0 };
  },

  update: async (id: string, data: Partial<ApiCourse>): Promise<ApiCourse> => {
    const body = {
      nome: data.name ?? "",
      descricao: data.description ?? "",
      cargaHorariaMinima: data.hours != null ? parseHorasToInt(data.hours) : 0,
    };
    const updated = await apiFetch<Record<string, unknown>>(`/cursos/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const m = mapCurso(updated ?? {});
    return { ...m, studentCount: await countAlunosCurso(id) };
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/cursos/${id}`, { method: "DELETE" });
  },
};

// ─── Tipos de atividade ───────────────────────────────────────────
export const tiposAtividadeApi = {
  list: async (): Promise<TipoAtividade[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/tipos-atividade");
    if (!Array.isArray(raw)) return [];
    return raw.map((t) => ({
      id: String(t.id ?? ""),
      nome: String(t.nome ?? ""),
      descricao: t.descricao != null ? String(t.descricao) : undefined,
    }));
  },
};

// ─── Activities API ─────────────────────────────────────────────
export type ActivityMutateInput = {
  title: string;
  description: string;
  courseId: string;
  tipoAtividadeId: string;
  points: number;
  horasSolicitadas?: number;
};

export const activitiesApi = {
  list: async (): Promise<ApiActivity[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/atividades");
    if (!Array.isArray(raw)) return [];
    return raw.map(mapAtividadeRow);
  },

  listByCourse: async (courseId: string): Promise<ApiActivity[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/atividades/curso/${courseId}`);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapAtividadeRow);
  },

  listByStudent: async (studentId: string): Promise<ApiActivity[]> => {
    const cursos = await userCursoApi.listarCursosDoAluno(studentId);
    if (!cursos.length) return [];
    const porCurso = await Promise.all(
      cursos.map((c) => activitiesApi.listByCourse(c.id).catch((): ApiActivity[] => []))
    );
    return porCurso.flat();
  },

  create: async (data: ActivityMutateInput): Promise<ApiActivity> => {
    const body = {
      idCurso: Number(data.courseId),
      idTipoAtividade: Number(data.tipoAtividadeId),
      titulo: data.title,
      descricao: data.description,
      horasSolicitadas: data.horasSolicitadas ?? null,
      pontos: data.points,
    };
    const created = await apiFetch<Record<string, unknown>>("/atividades", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return mapAtividadeRow(created ?? {});
  },

  update: async (id: string, data: ActivityMutateInput): Promise<ApiActivity> => {
    const body = {
      idCurso: Number(data.courseId),
      idTipoAtividade: Number(data.tipoAtividadeId),
      titulo: data.title,
      descricao: data.description,
      horasSolicitadas: data.horasSolicitadas ?? null,
      pontos: data.points,
    };
    const updated = await apiFetch<Record<string, unknown>>(`/atividades/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return mapAtividadeRow(updated ?? {});
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/atividades/${id}`, { method: "DELETE" });
  },
};

// ─── Proofs (comprovações) API ───────────────────────────────────
export const proofsApi = {
  list: async (): Promise<ApiProof[]> => {
    const atividades = await apiFetch<Record<string, unknown>[]>("/atividades");
    if (!Array.isArray(atividades)) return [];
    const nested = await Promise.all(
      atividades.map(async (at) => {
        const aid = String(at.id ?? "");
        if (!aid) return [] as ApiProof[];
        try {
          const comps = await apiFetch<Record<string, unknown>[]>(
            `/atividades/${aid}/comprovacoes`
          );
          if (!Array.isArray(comps)) return [];
          return comps.map((c) => ({
            id: String(c.id ?? ""),
            studentId: String(c.idAluno ?? ""),
            studentName: String(c.nomeAluno ?? ""),
            activityId: String(c.idAtividade ?? aid),
            activityTitle: String(c.tituloAtividade ?? at.titulo ?? ""),
            date: formatDate(String(c.dataEnvio ?? "")),
            status: mapComprovacaoStatus(String(c.status ?? "")),
            fileName: c.arquivo != null ? String(c.arquivo).split("/").pop() : undefined,
          }));
        } catch {
          return [];
        }
      })
    );
    return nested.flat();
  },

  listByStudent: async (studentId: string): Promise<ApiProof[]> => {
    const all = await proofsApi.list();
    return all.filter((p) => p.studentId === studentId);
  },

  submit: async (params: {
    atividadeId: string;
    idAluno: string;
    file: File;
  }): Promise<void> => {
    const fd = new FormData();
    fd.append("file", params.file);
    const q = new URLSearchParams({ idAluno: params.idAluno });
    await apiFetch<string>(
      `/atividades/${params.atividadeId}/comprovacao?${q.toString()}`,
      { method: "POST", body: fd }
    );
  },

  approve: async (comprovacaoId: string): Promise<void> => {
    await apiFetch(`/comprovacoes/${comprovacaoId}/avaliar`, {
      method: "PUT",
      body: JSON.stringify({ status: "APROVADO", observacao: "" }),
    });
  },

  reject: async (comprovacaoId: string): Promise<void> => {
    await apiFetch(`/comprovacoes/${comprovacaoId}/avaliar`, {
      method: "PUT",
      body: JSON.stringify({ status: "REJEITADO", observacao: "" }),
    });
  },
};

// ─── Logs API ────────────────────────────────────────────────────
export const logsApi = {
  list: async (): Promise<ApiLog[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/logs");
    if (!Array.isArray(raw)) return [];
    return raw.map((row) => {
      const userObj = row.user as Record<string, unknown> | undefined;
      const nome =
        userObj && typeof userObj === "object" && "nome" in userObj
          ? String((userObj as { nome?: string }).nome ?? "")
          : "";
      return {
        action: String(row.acao ?? ""),
        user: nome || "—",
        date: formatDate(String(row.createdAt ?? "")),
      };
    });
  },
};

// ─── Notificações ────────────────────────────────────────────────
export const notificacoesApi = {
  list: async (userId: string): Promise<ApiNotification[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(
      `/notificacoes?userId=${encodeURIComponent(userId)}`
    );
    if (!Array.isArray(raw)) return [];
      return raw.map((n) => ({
        id: Number(n.id ?? 0),
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

// ─── Certificados (aluno) ────────────────────────────────────────
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

// ─── Pontuação (aluno) ───────────────────────────────────────────
export const pontuacaoApi = {
  get: async (alunoId: string): Promise<PontuacaoAluno> => {
    const p = await apiFetch<Record<string, unknown>>(`/usuarios/${alunoId}/pontuacao`);
    return {
      totalPontos: Number(p?.totalPontos ?? 0),
      atividadesConcluidas: Number(p?.atividadesConcluidas ?? 0),
    };
  },
};

// ─── Categoria de atividade ─────────────────────────────────────
export interface CategoriaAtividade {
  id: string;
  nome: string;
  descricao?: string;
}

export const categoriaAtividadeApi = {
  list: async (): Promise<CategoriaAtividade[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>("/categoriaAtiv");
    if (!Array.isArray(raw)) return [];
    return raw.map((c) => ({
      id: String(c.idCatA ?? c.id ?? ""),
      nome: String(c.nome ?? ""),
      descricao: c.descricao != null ? String(c.descricao) : undefined,
    }));
  },

  create: async (data: { nome: string; descricao?: string }): Promise<CategoriaAtividade> => {
    const raw = await apiFetch<Record<string, unknown>>("/categoriaAtiv", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { id: String(raw.idCatA ?? raw.id ?? ""), nome: String(raw.nome ?? ""), descricao: raw.descricao != null ? String(raw.descricao) : undefined };
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch<void>(`/categoriaAtiv/${id}`, { method: "DELETE" });
  },
};

// ─── Vínculo aluno–curso ─────────────────────────────────────────
export const userCursoApi = {
  vincular: async (cursoId: string, idUser: string): Promise<void> => {
    await apiFetch(`/cursos/${cursoId}/alunos`, {
      method: "POST",
      body: JSON.stringify({
        idUser: Number(idUser),
        papel: "ALUNO",
      }),
    });
  },

  listarAlunos: async (cursoId: string) => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/cursos/${cursoId}/alunos`);
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => ({
      id: String(r.idUser ?? ""),
      nome: String(r.nomeUser ?? ""),
      email: String(r.emailUser ?? ""),
      idCurso: String(r.idCurso ?? ""),
      nomeCurso: String(r.nomeCurso ?? ""),
    }));
  },

  listarCursosDoAluno: async (alunoId: string): Promise<{ id: string; nome: string; hours: string; dataMatricula: string }[]> => {
    const raw = await apiFetch<Record<string, unknown>[]>(`/cursos/aluno/${alunoId}`);
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => ({
      id: String(r.idCurso ?? ""),
      nome: String(r.nomeCurso ?? ""),
      hours: "",
      dataMatricula: formatDate(String(r.dataMatricula ?? "")),
    }));
  },

  desvincular: async (cursoId: string, alunoId: string): Promise<void> => {
    await apiFetch<void>(`/cursos/${cursoId}/alunos/${alunoId}`, { method: "DELETE" });
  },
};
