import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { AppProvider, useApp } from './contexts/AppContext'
import { GlobalStyles, theme } from './styles/GlobalStyles'
import Login from './components/auth/Login'
import AdminDashboard from './components/admin/AdminDashboard'
import PlayerDashboard from './components/player/PlayerDashboard'
import { PageLoading } from './components/common/Loading'

// Componente para rotas protegidas
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, currentUser, userRole, loading } = useApp()
  
  if (loading) {
    return <PageLoading />
  }
  
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && userRole !== requiredRole) {
    // Redirecionar para o dashboard apropriado baseado no papel do usuário
    const redirectPath = userRole === 'admin' ? '/admin' : '/player'
    return <Navigate to={redirectPath} replace />
  }
  
  return children
}

// Componente principal da aplicação
function AppContent() {
  const { isAuthenticated, userRole, loading } = useApp()
  
  if (loading) {
    return <PageLoading />
  }
  
  return (
    <Router>
      <Routes>
        {/* Rota de login */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'admin' ? '/admin' : '/player'} replace />
            ) : (
              <Login />
            )
          } 
        />
        
        {/* Dashboard do Admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard do Jogador */}
        <Route 
          path="/player" 
          element={
            <ProtectedRoute requiredRole="player">
              <PlayerDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota raiz - redireciona baseado na autenticação */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'admin' ? '/admin' : '/player'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Rota catch-all - redireciona para login ou dashboard apropriado */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? (
              <Navigate to={userRole === 'admin' ? '/admin' : '/player'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  )
}

export default App
