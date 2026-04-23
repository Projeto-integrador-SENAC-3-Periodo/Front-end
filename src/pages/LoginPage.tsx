import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, BookOpen, Award, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      const saved = JSON.parse(localStorage.getItem("senac_user") || "{}");
      if (saved.role === "admin") navigate("/admin");
      else if (saved.role === "coordinator") navigate("/coordinator");
      else navigate("/student");
    } else {
      setError("Credenciais inválidas. Tente os botões de acesso rápido.");
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("123456");
    toast.success("Credenciais preenchidas!");
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
      {/* LADO ESQUERDO: Design Institucional Original */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#002d5e] text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-[28rem] h-[28rem] rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full h-full">
          <div className="flex items-center gap-3">
            <img src="/marca_senac.png" alt="Senac" className="h-10 brightness-0 invert" />
          </div>

          <div className="space-y-8 max-w-md">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest mb-5">
                Atividades Complementares
              </div>
              <h2 className="font-bold text-4xl xl:text-5xl leading-tight tracking-tight">
                Construa sua trajetória <span className="text-orange-500">acadêmica</span> com excelência.
              </h2>
              <p className="text-white/70 mt-5 text-base leading-relaxed">
                Gerencie cursos, envie comprovantes e acompanhe sua evolução em uma plataforma feita para impulsionar seu aprendizado.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { icon: BookOpen, label: "Cursos" },
                { icon: Award, label: "Certificados" },
                { icon: Users, label: "Comunidade" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-orange-500" />
                  <span className="text-xs text-white/80 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div /> 
        </div>
      </div>

      {/* LADO DIREITO: Ajustado para alinhamento perfeito */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 lg:p-12">
        {/* Container que limita a largura do formulário e centraliza */}
        <div className="w-full max-w-[400px] flex flex-col h-full py-8">
          
          {/* Seção Centralizada Verticalmente */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-10 text-left">
              <h2 className="font-bold text-4xl text-slate-900 tracking-tight">Entrar</h2>
              <p className="text-slate-500 mt-2 font-medium">Insira suas informações de acesso abaixo.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email ou Matrícula</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all shadow-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all shadow-sm"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all group mt-2"
                disabled={loading}
              >
                {loading ? "Entrando..." : (
                  <div className="flex items-center justify-center gap-2">
                    Entrar no Sistema
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>

            {/* Acesso Rápido */}
            <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-[0.2em] text-center">Acesso rápido (demo)</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "ADMIN", email: "admin@senac.br" },
                  { label: "COORD", email: "coord@senac.br" },
                  { label: "ALUNO", email: "aluno@senac.br" },
                ].map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => fillDemo(d.email)}
                    className="text-[11px] py-3 rounded-xl border border-slate-100 bg-white hover:border-orange-500 hover:text-orange-500 transition-all font-bold text-slate-400 uppercase tracking-tighter shadow-sm"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rodapé fixado embaixo e alinhado */}
          <div className="pt-8 text-center">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">
              © 2026 SENAC · Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}