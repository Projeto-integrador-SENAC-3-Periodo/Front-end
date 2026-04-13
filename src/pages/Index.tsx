//Importa um componente do React Router que serve para redirecionar o usuário.
import { Navigate } from "react-router-dom";

//Navigate é o componente que muda a rota automaticamente e ele atualmente está indo para o login
// O replace substitui a rota atual no histórico
const Index = () => <Navigate to="/login" replace />;

//Permite que esse componente seja usado na sua rota "/""
export default Index;
