import { lazy } from 'react'
import { es } from '../i18n/es'
import { recoverChunkLoad } from './lazyImport'

export const HomePage = lazy(() =>
  recoverChunkLoad(
  import('../pages/public/HomePage').then((module) => ({
    default: module.HomePage,
  })),
  ),
)
export const LoginPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
  ),
)
export const RegisterPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/auth/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  })),
  ),
)
export const ForgotPasswordPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/auth/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
  ),
)
export const EmailSentPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/auth/EmailSentPage').then((module) => ({
    default: module.EmailSentPage,
  })),
  ),
)
export const VerifyEmailPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/auth/VerifyEmailPage').then((module) => ({
    default: module.VerifyEmailPage,
  })),
  ),
)
export const ResetPasswordPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/auth/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
  ),
)
export const WelcomePage = lazy(() =>
  recoverChunkLoad(
  import('../pages/onboarding/WelcomePage').then((module) => ({
    default: module.WelcomePage,
  })),
  ),
)
export const PreferencesPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/onboarding/PreferencesPage').then((module) => ({
    default: module.PreferencesPage,
  })),
  ),
)
export const OnboardingGoalsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/onboarding/GoalsPage').then((module) => ({
    default: module.GoalsPage,
  })),
  ),
)
export const AccountPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/onboarding/AccountPage').then((module) => ({
    default: module.AccountPage,
  })),
  ),
)
export const PlanningPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/PlanningPage').then((module) => ({
    default: module.PlanningPage,
  })),
  ),
)
export const AgendaPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/AgendaPage').then((module) => ({
    default: module.AgendaPage,
  })),
  ),
)
export const DashboardPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
  ),
)
export const CoachPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/CoachPage').then((module) => ({
    default: module.CoachPage,
  })),
  ),
)
export const AccountsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/AccountsPage').then((module) => ({
    default: module.AccountsPage,
  })),
  ),
)
export const TransactionsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/TransactionsPage').then((module) => ({
    default: module.TransactionsPage,
  })),
  ),
)
export const TransactionsHubPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/TransactionsHubPage').then((module) => ({
    default: module.TransactionsHubPage,
  })),
  ),
)
export const AnalyticsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/AnalyticsPage').then((module) => ({
    default: module.AnalyticsPage,
  })),
  ),
)
export const CalendarPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/CalendarPage').then((module) => ({
    default: module.CalendarPage,
  })),
  ),
)
export const RecurringPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/RecurringPage').then((module) => ({
    default: module.RecurringPage,
  })),
  ),
)
export const CategoriesPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  })),
  ),
)
export const BudgetsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/BudgetsPage').then((module) => ({
    default: module.BudgetsPage,
  })),
  ),
)
export const AppGoalsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/GoalsPage').then((module) => ({
    default: module.GoalsPage,
  })),
  ),
)
export const GroupsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/GroupsPage').then((module) => ({
    default: module.GroupsPage,
  })),
  ),
)
export const SettingsPage = lazy(() =>
  recoverChunkLoad(
  import('../pages/app/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
  ),
)

export function PageLoader() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center px-4 text-sm font-semibold text-emerald-700">
      {es.common.loading}
    </div>
  )
}
