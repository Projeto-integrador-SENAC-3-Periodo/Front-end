// Mock API service layer — ready for REST integration
// Replace mock implementations with actual fetch calls when backend is available

import type { UserRole } from "@/contexts/AuthContext";

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
  msg: string;
  time: string;
  read: boolean;
  type?: string;
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

// ─── Mock Data ───────────────────────────────────────────────────
let users: ApiUser[] = [
  { id: "1", name: "Carlos Admin", email: "admin@senac.br", profile: "Administrador", role: "admin", matricula: "-", createdAt: "2024-01-10" },
  { id: "2", name: "Maria Coordenadora", email: "coord@senac.br", profile: "Coordenador", role: "coordinator", matricula: "-", createdAt: "2024-02-15" },
  { id: "3", name: "João Pedro", email: "joao@senac.br", profile: "Aluno", role: "student", matricula: "2024001", createdAt: "2024-03-01" },
  { id: "4", name: "Ana Silva", email: "ana@senac.br", profile: "Aluno", role: "student", matricula: "2024002", createdAt: "2024-03-05" },
  { id: "5", name: "Pedro Santos", email: "pedro@senac.br", profile: "Aluno", role: "student", matricula: "2024003", createdAt: "2024-03-10" },
];

let courses: ApiCourse[] = [
  { id: "1", name: "Desenvolvimento Web", description: "Curso completo de dev web", hours: "120h", coordinatorId: "2", coordinatorName: "Maria Coordenadora", studentCount: 25 },
  { id: "2", name: "Análise de Dados", description: "Fundamentos de análise", hours: "80h", coordinatorId: "2", coordinatorName: "Maria Coordenadora", studentCount: 18 },
  { id: "3", name: "Design Gráfico", description: "Design visual e UX", hours: "100h", coordinatorId: "2", coordinatorName: "Maria Coordenadora", studentCount: 21 },
];

let activities: ApiActivity[] = [
  { id: "1", title: "Palestra de IA", description: "Palestra sobre inteligência artificial", courseId: "1", courseName: "Desenvolvimento Web", category: "Palestra", points: 10, proofType: "certificate" },
  { id: "2", title: "Workshop React", description: "Workshop prático de React", courseId: "1", courseName: "Desenvolvimento Web", category: "Workshop", points: 20, proofType: "photo" },
  { id: "3", title: "Seminário UX", description: "Seminário sobre UX Design", courseId: "3", courseName: "Design Gráfico", category: "Seminário", points: 15, proofType: "document" },
  { id: "4", title: "Hackathon 2024", description: "Competição de programação", courseId: "1", courseName: "Desenvolvimento Web", category: "Hackathon", points: 30, proofType: "certificate" },
];

let proofs: ApiProof[] = [
  { id: "1", studentId: "3", studentName: "João Pedro", activityId: "1", activityTitle: "Palestra de IA", date: "2024-03-10", status: "approved", fileName: "certificado_ia.pdf" },
  { id: "2", studentId: "4", studentName: "Ana Silva", activityId: "2", activityTitle: "Workshop React", date: "2024-03-08", status: "pending", fileName: "foto_workshop.jpg" },
  { id: "3", studentId: "5", studentName: "Pedro Santos", activityId: "3", activityTitle: "Seminário UX", date: "2024-03-07", status: "rejected", fileName: "doc_ux.pdf" },
  { id: "4", studentId: "3", studentName: "Maria Oliveira", activityId: "2", activityTitle: "Workshop React", date: "2024-03-12", status: "pending", fileName: "react_proof.png" },
];

// ─── Simulate network delay ─────────────────────────────────────
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── Users API ───────────────────────────────────────────────────
export const usersApi = {
  list: async (): Promise<ApiUser[]> => { await delay(); return [...users]; },
  create: async (data: Omit<ApiUser, "id" | "createdAt">): Promise<ApiUser> => {
    await delay();
    const newUser: ApiUser = { ...data, id: String(Date.now()), createdAt: new Date().toISOString().slice(0, 10) };
    users = [...users, newUser];
    return newUser;
  },
  update: async (id: string, data: Partial<ApiUser>): Promise<ApiUser> => {
    await delay();
    users = users.map(u => u.id === id ? { ...u, ...data } : u);
    return users.find(u => u.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); users = users.filter(u => u.id !== id); },
};

// ─── Courses API ─────────────────────────────────────────────────
export const coursesApi = {
  list: async (): Promise<ApiCourse[]> => { await delay(); return [...courses]; },
  listByCoordinator: async (coordId: string): Promise<ApiCourse[]> => {
    await delay();
    return courses.filter(c => c.coordinatorId === coordId);
  },
  create: async (data: Omit<ApiCourse, "id" | "studentCount">): Promise<ApiCourse> => {
    await delay();
    const newCourse: ApiCourse = { ...data, id: String(Date.now()), studentCount: 0 };
    courses = [...courses, newCourse];
    return newCourse;
  },
  update: async (id: string, data: Partial<ApiCourse>): Promise<ApiCourse> => {
    await delay();
    courses = courses.map(c => c.id === id ? { ...c, ...data } : c);
    return courses.find(c => c.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); courses = courses.filter(c => c.id !== id); },
};

// ─── Activities API ──────────────────────────────────────────────
export const activitiesApi = {
  list: async (): Promise<ApiActivity[]> => { await delay(); return [...activities]; },
  listByCourse: async (courseId: string): Promise<ApiActivity[]> => {
    await delay();
    return activities.filter(a => a.courseId === courseId);
  },
  create: async (data: Omit<ApiActivity, "id">): Promise<ApiActivity> => {
    await delay();
    const newAct: ApiActivity = { ...data, id: String(Date.now()) };
    activities = [...activities, newAct];
    return newAct;
  },
  update: async (id: string, data: Partial<ApiActivity>): Promise<ApiActivity> => {
    await delay();
    activities = activities.map(a => a.id === id ? { ...a, ...data } : a);
    return activities.find(a => a.id === id)!;
  },
  delete: async (id: string): Promise<void> => { await delay(); activities = activities.filter(a => a.id !== id); },
};

// ─── Proofs API ──────────────────────────────────────────────────
export const proofsApi = {
  list: async (): Promise<ApiProof[]> => { await delay(); return [...proofs]; },
  listByStudent: async (studentId: string): Promise<ApiProof[]> => {
    await delay();
    return proofs.filter(p => p.studentId === studentId);
  },
  submit: async (data: Omit<ApiProof, "id" | "status" | "date">): Promise<ApiProof> => {
    await delay();
    const newProof: ApiProof = { ...data, id: String(Date.now()), status: "pending", date: new Date().toISOString().slice(0, 10) };
    proofs = [...proofs, newProof];
    return newProof;
  },
  approve: async (id: string): Promise<void> => {
    await delay();
    proofs = proofs.map(p => p.id === id ? { ...p, status: "approved" as const } : p);
  },
  reject: async (id: string): Promise<void> => {
    await delay();
    proofs = proofs.map(p => p.id === id ? { ...p, status: "rejected" as const } : p);
  },
};

// ─── Logs API ────────────────────────────────────────────────────
export const logsApi = {
  list: async (): Promise<ApiLog[]> => {
    await delay();
    return [
      { action: "Usuário criado", user: "Carlos Admin", date: "2024-03-15 14:32" },
      { action: "Curso editado", user: "Maria Coordenadora", date: "2024-03-15 11:20" },
      { action: "Comprovante aprovado", user: "Maria Coordenadora", date: "2024-03-14 16:45" },
      { action: "Login realizado", user: "João Pedro", date: "2024-03-14 09:10" },
    ];
  },
};
