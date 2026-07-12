import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <main className="qori-auth-entry-surface min-h-screen text-[#191c1e]">
      <Outlet />
    </main>
  )
}
