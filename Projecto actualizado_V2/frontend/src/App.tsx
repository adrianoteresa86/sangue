import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sanguinha } from './components/chatbot/Sanguinha';
import { AdminLayout } from './layouts/admin/AdminLayout';
import { DoadorLayout } from './layouts/doador/DoadorLayout';
import { ReceptorLayout } from './layouts/receptor/ReceptorLayout';

// Páginas públicas
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { EstoquePublico } from './pages/EstoquePublico';
import { Sobre } from './pages/Sobre';
import { Contacto } from './pages/Contacto';

// Páginas do Admin
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminEstoque } from './pages/admin/Estoque';
import { AdminDoadores } from './pages/admin/Doadores';
import { AdminHemocentros } from './pages/admin/Hemocentros';
import { AdminCampanhas } from './pages/admin/Campanhas';
import { AdminUsuarios } from './pages/admin/Usuarios';
import { AdminPedidosTransfusao } from './pages/admin/PedidosTransfusao';
import {Agendamentos } from './pages/admin/Agendamentos';
import { AdminNotificacoes } from './pages/admin/Notificacoes';

//Páginas do Doador
import { DoadorDashboard } from './pages/doador/Dashboard';
import { DoadorAgendar } from './pages/doador/Agendar';
import { DoadorCampanhas } from './pages/doador/Campanhas';
import { DoadorHemocentros } from './pages/doador/Hemocentros';
import { DoadorHistorico } from './pages/doador/Historico';
import { DoadorPerfil } from './pages/doador/Perfil';
import { DoadorNotificacoes } from './pages/doador/Notificacoes';

// Páginas do Receptor
import { ReceptorDashboard } from './pages/receptor/Dashboard';
import { ReceptorTransfusao } from './pages/receptor/Transfusao';
import { ReceptorRequisicoes } from './pages/receptor/Requisicoes';
import { ReceptorHistorico } from './pages/receptor/Historico';
import { ReceptorPerfil } from './pages/receptor/Perfil';
import { ReceptorNotificacoes } from './pages/receptor/Notificacoes';
import { ReceptorPedidoDetalhe } from './pages/receptor/PedidoDetalhe';
import { ReceptorHemocentros } from './pages/receptor/Hemocentros';

const queryClient = new QueryClient();

// Rota principla para as paginas publicas
function AppRoutes() {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/estoque-publico" element={<EstoquePublico />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  const userRole = auth.usuario?.perfil;

  // rotas de admin
  if (userRole === 'ADMIN') {
    return (
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/estoque"
          element={
            <AdminLayout>
              <AdminEstoque />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/doadores"
          element={
            <AdminLayout>
              <AdminDoadores />
            </AdminLayout>
          }
        />

        <Route 
         path='/admin/agendamentos'
         element={
          <AdminLayout>
            <Agendamentos />
          </AdminLayout>
         }
        />
        <Route
          path="/admin/hemocentros"
          element={
            <AdminLayout>
              <AdminHemocentros />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/campanhas"
          element={
            <AdminLayout>
              <AdminCampanhas />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <AdminLayout>
              <AdminUsuarios />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/pedidos-transfusao"
          element={
            <AdminLayout>
              <AdminPedidosTransfusao />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/notificacoes"
          element={
            <AdminLayout>
              <AdminNotificacoes />
            </AdminLayout>
          }
        />
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    );
  }

  // Rotas do Doador
  if (userRole === 'DOADOR') {
    return (
      <Routes>
        <Route
          path="/doador"
          element={
            <DoadorLayout>
              <DoadorDashboard />
            </DoadorLayout>
          }
        />
        <Route
          path="/doador/agendar"
          element={
            <DoadorLayout>
              <DoadorAgendar />
            </DoadorLayout>
          }
        />
        <Route
          path="/doador/campanhas"
          element={
            <DoadorLayout>
              <DoadorCampanhas />
            </DoadorLayout>
          }
        />
        <Route
          path="/doador/hemocentros"
          element={
            <DoadorLayout>
              <DoadorHemocentros />
            </DoadorLayout>
          }
        />
        <Route
          path="/doador/historico"
          element={
            <DoadorLayout>
              <DoadorHistorico />
            </DoadorLayout>
          }
        />
        <Route
          path="/doador/perfil"
          element={
            <DoadorLayout>
              <DoadorPerfil />
            </DoadorLayout>
          }
        />
        <Route
          path="/doador/notificacoes"
          element={
            <DoadorLayout>
              <DoadorNotificacoes />
            </DoadorLayout>
          }
        />
        <Route path="/" element={<Navigate to="/doador" />} />
        <Route path="*" element={<Navigate to="/doador" />} />
      </Routes>
    );
  }

  // Rotas do Receptor
  if (userRole === 'RECEPTOR') {
    return (
      <Routes>
        <Route
          path="/receptor"
          element={
            <ReceptorLayout>
              <ReceptorDashboard />
            </ReceptorLayout>
          }
        />
        <Route
          path="/receptor/transfusao"
          element={
            <ReceptorLayout>
              <ReceptorTransfusao />
            </ReceptorLayout>
          }
        />
        <Route
          path="/receptor/requisicoes"
          element={
            <ReceptorLayout>
              <ReceptorRequisicoes />
            </ReceptorLayout>
          }
        />
        <Route
          path="/receptor/historico"
          element={
            <ReceptorLayout>
              <ReceptorHistorico />
            </ReceptorLayout>
          }
        />
        <Route
          path="/receptor/perfil"
          element={
            <ReceptorLayout>
              <ReceptorPerfil />
            </ReceptorLayout>
          }
        />
        <Route
          path="/receptor/notificacoes"
          element={
            <ReceptorLayout>
              <ReceptorNotificacoes />
            </ReceptorLayout>
          }
        />
        <Route
          path="/receptor/hemocentros"
          element={
            <ReceptorLayout>
              <ReceptorHemocentros />
            </ReceptorLayout>
          }
        />
        <Route
          path="/receptor/pedidos/:id"
          element={
            <ReceptorLayout>
              <ReceptorPedidoDetalhe />
            </ReceptorLayout>
          }
        />
        <Route path="/" element={<Navigate to="/receptor" />} />
        <Route path="*" element={<Navigate to="/receptor" />} />
      </Routes>
    );
  }

  // Fallback
  return <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Sanguinha />
          <Toaster richColors position="top-right" duration={4000} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
