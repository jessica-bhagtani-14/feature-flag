import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import CreateApplication from './pages/CreateApplication';
import EditApplication from './pages/EditApplication';
import Flags from './pages/Flags';
import CreateFlag from './pages/CreateFlag';
import EditFlag from './pages/EditFlag';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CreateRule from './pages/CreateRule';
import EditRule from './pages/EditRule';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/applications" element={<Applications />} />
                        <Route path="/applications/new" element={<CreateApplication />} />
                        <Route path="/applications/:id/edit" element={<EditApplication />} />
                        <Route path="/flags" element={<Flags />} />
                        <Route path="/apps/:app_id/flags/new" element={<CreateFlag />} />
                        <Route path="/apps/:app_id/flags/:flag_id/edit" element={<EditFlag />} />
                        <Route path="/apps/:app_id/flags/:flag_id/new" element={<CreateRule/>}/>
                        <Route path="/apps/:app_id/flags/:flag_id/rules/:rule_id/edit" element={<EditRule/>}/>
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;