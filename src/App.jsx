import { BrowserRouter, Routes, Route } from 'react-router-dom'

import PublicLayout from './layouts/PublicLayout'
import UserLayout from './layouts/UserLayout'
import AttendantLayout from './layouts/AttendantLayout'
import AdminLayout from './layouts/AdminLayout'

import ProtectedRoute from './routes/ProtectedRoute'

// =====================================================
// PÁGINAS PÚBLICAS
// =====================================================

import Home from './pages/public/Home'
import Register from './pages/public/Register'
import Login from './pages/public/Login'
import RecuperarPassword from './pages/public/RecuperarPassword'
import RestablecerPassword from './pages/public/RestablecerPassword'
import ComoFunciona from './pages/public/ComoFunciona'
import PublicPuntosAcopio from './pages/public/PuntosAcopio'
import EcoTienda from './pages/public/EcoTienda'
import Producto from './pages/public/Producto'
import Beneficios from './pages/public/Beneficios'

// =====================================================
// PÁGINAS DE USUARIO
// =====================================================

import UserDashboard from './pages/user/Dashboard'
import UserQR from './pages/user/QR'
import UserPuntos from './pages/user/Puntos'
import UserReciclajes from './pages/user/Reciclajes'
import UserPuntosAcopio from './pages/user/PuntosAcopio'
import UserBeneficios from './pages/user/Beneficios'
import Cupones from './pages/user/Cupones'
import Tienda from './pages/user/Tienda'
import Carrito from './pages/user/Carrito'
import Checkout from './pages/user/Checkout'
import Perfil from './pages/user/Perfil'
import MisPedidos from './pages/user/MisPedidos'
import Notificaciones from './pages/user/Notificaciones'

// =====================================================
// PÁGINAS DE ENCARGADO
// =====================================================

import AttendantDashboard from './pages/attendant/Dashboard'
import Escanear from './pages/attendant/Escanear'
import RegistrarReciclaje from './pages/attendant/RegistrarReciclaje'
import AttendantReciclajes from './pages/attendant/Reciclajes'

// =====================================================
// PÁGINAS DE ADMINISTRADOR
// =====================================================

import AdminDashboard from './pages/admin/Dashboard'
import Usuarios from './pages/admin/Usuarios'
import Productos from './pages/admin/Productos'
import Categorias from './pages/admin/Categorias'
import AdminBeneficios from './pages/admin/Beneficios'
import Materiales from './pages/admin/Materiales'
import AdminPuntosAcopio from './pages/admin/PuntosAcopio'
import Pedidos from './pages/admin/Pedidos'
import Reciclajes from './pages/admin/Reciclajes'


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            PÁGINAS PÚBLICAS
        ===================================================== */}

        <Route element={<PublicLayout />}>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/registro"
            element={<Register />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/recuperar-password"
            element={<RecuperarPassword />}
          />

          <Route
            path="/restablecer-password"
            element={<RestablecerPassword />}
          />

          <Route
            path="/como-funciona"
            element={<ComoFunciona />}
          />

          {/* PÁGINA PÚBLICA DE PUNTOS DE ACOPIO */}

          <Route
            path="/puntos-acopio"
            element={<PublicPuntosAcopio />}
          />

          <Route
            path="/eco-tienda"
            element={<EcoTienda />}
          />

          <Route
            path="/eco-tienda/producto/:id"
            element={<Producto />}
          />

          <Route
            path="/beneficios"
            element={<Beneficios />}
          />

        </Route>


        {/* =====================================================
            PANEL DEL USUARIO
        ===================================================== */}

        {/* INICIO */}

        <Route
          path="/usuario"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* MI QR */}

        <Route
          path="/usuario/qr"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <UserQR />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* MIS PUNTOS */}

        <Route
          path="/usuario/puntos"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <UserPuntos />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* MIS RECICLAJES */}

        <Route
          path="/usuario/reciclajes"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <UserReciclajes />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            PUNTOS DE ACOPIO DEL USUARIO

            ESTA ES LA RUTA QUE DEBE USAR EL MENÚ DEL USUARIO:

            /usuario/puntos-acopio
        ===================================================== */}

        <Route
          path="/usuario/puntos-acopio"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <UserPuntosAcopio />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* BENEFICIOS */}

        <Route
          path="/usuario/beneficios"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <UserBeneficios />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* CUPONES */}

        <Route
          path="/usuario/cupones"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <Cupones />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* TIENDA */}

        <Route
          path="/usuario/tienda"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <Tienda />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* CARRITO */}

        <Route
          path="/usuario/carrito"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <Carrito />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* CHECKOUT */}

        <Route
          path="/usuario/checkout"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <Checkout />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* PERFIL */}

        <Route
          path="/usuario/perfil"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <Perfil />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* PEDIDOS */}

        <Route
          path="/usuario/pedidos"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <MisPedidos />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* NOTIFICACIONES */}

        <Route
          path="/usuario/notificaciones"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UserLayout>
                <Notificaciones />
              </UserLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            PANEL DEL ENCARGADO
        ===================================================== */}

        <Route
          path="/encargado"
          element={
            <ProtectedRoute allowedRoles={['encargado']}>
              <AttendantLayout>
                <AttendantDashboard />
              </AttendantLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/encargado/escanear"
          element={
            <ProtectedRoute allowedRoles={['encargado']}>
              <AttendantLayout>
                <Escanear />
              </AttendantLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/encargado/registrar-reciclaje"
          element={
            <ProtectedRoute allowedRoles={['encargado']}>
              <AttendantLayout>
                <RegistrarReciclaje />
              </AttendantLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/encargado/reciclajes"
          element={
            <ProtectedRoute allowedRoles={['encargado']}>
              <AttendantLayout>
                <AttendantReciclajes />
              </AttendantLayout>
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            PANEL DEL ADMINISTRADOR
        ===================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <Usuarios />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/productos"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <Productos />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/categorias"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <Categorias />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/beneficios"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <AdminBeneficios />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/materiales"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <Materiales />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/puntos-acopio"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <AdminPuntosAcopio />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/pedidos"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <Pedidos />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin/reciclajes"
          element={
            <ProtectedRoute allowedRoles={['administrador']}>
              <AdminLayout>
                <Reciclajes />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App