import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import Spinner from './components/common/Spinner';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center dark:bg-wa-d-bg bg-wa-l-bg">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="dark:text-wa-d-text-secondary text-wa-l-text-secondary text-sm animate-pulse">
            Loading WhatsApp...
          </p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center dark:bg-wa-d-bg bg-wa-l-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
