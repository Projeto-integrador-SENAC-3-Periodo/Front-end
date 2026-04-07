import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

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
      setError("Credenciais inválidas. Tente os e-mails de teste abaixo.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-senac-blue p-6">
      <div className="mb-6 w-full max-w-sm flex justify-center">
        <img 
          src="/marca_senac.png"
          alt="Senac"
          className="w-40 h-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-white text-md font-medium tracking-wide">Portal Acadêmico</p>
      </div>

      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h2 className="font-display font-bold text-2xl mb-6 text-gray-800">Entrar</h2>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-600 text-[11px] p-3 rounded-md mb-6 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-semibold">Email ou Matrícula</Label>
            <Input
              id="email"
              type="text"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-gray-50 border-gray-200 focus:border-senac-orange focus:ring-senac-orange"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-semibold">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-gray-50 border-gray-200 focus:border-senac-orange focus:ring-senac-orange"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-senac-orange hover:bg-orange-600 text-white font-bold h-12 text-lg transition-all shadow-md"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
           <div className="text-gray-400 space-y-1">
              <p className="font-bold uppercase tracking-tighter text-[11px]">Credenciais de teste:</p>
              <p className="text-sm font-bold text-gray-700">
                admin@senac.br · coord@senac.br · aluno@senac.br
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}