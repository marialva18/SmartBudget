import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#f7f1e4] text-[#191c1e]">
      <Outlet />
    </main>
  )
}
