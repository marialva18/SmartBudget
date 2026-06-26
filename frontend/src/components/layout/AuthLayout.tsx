import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      <Outlet />
    </main>
  )
}
