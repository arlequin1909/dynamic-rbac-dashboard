import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { AuditPage } from './pages/AuditPage'
import { DashboardPage } from './pages/DashboardPage'

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="p-6">{children}</main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/admin/audit" element={<AuditPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
