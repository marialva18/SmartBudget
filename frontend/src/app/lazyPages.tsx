import { lazy } from 'react'
import { es } from '../i18n/es'

export const HomePage = lazy(() =>
  import('../pages/public/HomePage').then((module) => ({
    default: module.HomePage,
  })),
)
export const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)
export const RegisterPage = lazy(() =>
  import('../pages/auth/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  })),
)
export const ForgotPasswordPage = lazy(() =>
  import('../pages/auth/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
export const EmailSentPage = lazy(() =>
  import('../pages/auth/EmailSentPage').then((module) => ({
    default: module.EmailSentPage,
  })),
)
export const VerifyEmailPage = lazy(() =>
  import('../pages/auth/VerifyEmailPage').then((module) => ({
    default: module.VerifyEmailPage,
  })),
)
export const ResetPasswordPage = lazy(() =>
  import('../pages/auth/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
export const WelcomePage = lazy(() =>
  import('../pages/onboarding/WelcomePage').then((module) => ({
    default: module.WelcomePage,
  })),
)
export const PreferencesPage = lazy(() =>
  import('../pages/onboarding/PreferencesPage').then((module) => ({
    default: module.PreferencesPage,
  })),
)
export const OnboardingGoalsPage = lazy(() =>
  import('../pages/onboarding/GoalsPage').then((module) => ({
    default: module.GoalsPage,
  })),
)
export const AccountPage = lazy(() =>
  import('../pages/onboarding/AccountPage').then((module) => ({
    default: module.AccountPage,
  })),
)
export const DashboardPage = lazy(() =>
  import('../pages/app/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
export const CoachPage = lazy(() =>
  import('../pages/app/CoachPage').then((module) => ({
    default: module.CoachPage,
  })),
)
export const AccountsPage = lazy(() =>
  import('../pages/app/AccountsPage').then((module) => ({
    default: module.AccountsPage,
  })),
)
export const TransactionsPage = lazy(() =>
  import('../pages/app/TransactionsPage').then((module) => ({
    default: module.TransactionsPage,
  })),
)
export const AnalyticsPage = lazy(() =>
  import('../pages/app/AnalyticsPage').then((module) => ({
    default: module.AnalyticsPage,
  })),
)
export const CalendarPage = lazy(() =>
  import('../pages/app/CalendarPage').then((module) => ({
    default: module.CalendarPage,
  })),
)
export const RecurringPage = lazy(() =>
  import('../pages/app/RecurringPage').then((module) => ({
    default: module.RecurringPage,
  })),
)
export const CategoriesPage = lazy(() =>
  import('../pages/app/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  })),
)
export const BudgetsPage = lazy(() =>
  import('../pages/app/BudgetsPage').then((module) => ({
    default: module.BudgetsPage,
  })),
)
export const AppGoalsPage = lazy(() =>
  import('../pages/app/GoalsPage').then((module) => ({
    default: module.GoalsPage,
  })),
)
export const GroupsPage = lazy(() =>
  import('../pages/app/GroupsPage').then((module) => ({
    default: module.GroupsPage,
  })),
)
export const SettingsPage = lazy(() =>
  import('../pages/app/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)

export function PageLoader() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center px-4 text-sm font-semibold text-emerald-700">
      {es.common.loading}
    </div>
  )
}
