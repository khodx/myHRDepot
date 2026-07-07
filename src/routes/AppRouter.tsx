import { Routes, Route, Navigate } from 'react-router-dom'

const Dashboard = () => <div className="p-8"><h1 className="text-4xl font-bold">Welcome to My HR Depot</h1></div>
const Tasks = () => <div className="p-8"><h1 className="text-2xl">Tasks</h1></div>
const Approvals = () => <div className="p-8"><h1 className="text-2xl">Approvals</h1></div>
const Forms = () => <div className="p-8"><h1 className="text-2xl">Forms</h1></div>
const Reports = () => <div className="p-8"><h1 className="text-2xl">Reports</h1></div>
const Audit = () => <div className="p-8"><h1 className="text-2xl">Audit Log</h1></div>

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/forms" element={<Forms />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
