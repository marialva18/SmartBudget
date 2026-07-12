import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#eef6f1] text-[#191c1e]">
      <Outlet />
    </main>
  )
}
