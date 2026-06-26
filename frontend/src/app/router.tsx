import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { EmailSentPage } from '../pages/auth/EmailSentPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { DashboardPage } from '../pages/app/DashboardPage'
import { AccountsPage } from '../pages/app/AccountsPage'
import { TransactionsPage } from '../pages/app/TransactionsPage'
import { OnboardingLayout } from '../components/layout/OnboardingLayout'
import { WelcomePage } from '../pages/onboarding/WelcomePage'
import { PreferencesPage } from '../pages/onboarding/PreferencesPage'
import { GoalsPage } from '../pages/onboarding/GoalsPage'
import { AccountPage } from '../pages/onboarding/AccountPage'
import { CategoriesPage } from '../pages/app/CategoriesPage'
import { BudgetsPage } from '../pages/app/BudgetsPage'
import { RequireAuth } from '../features/auth/components/RequireAuth'
import { SettingsPage } from '../pages/app/SettingsPage'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { GoalsPage as AppGoalsPage } from '../pages/app/GoalsPage'
import { GroupsPage } from '../pages/app/GroupsPage'
import { CalendarPage } from '../pages/app/CalendarPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/onboarding',
    element: <RequireAuth onboarding="incomplete" />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <OnboardingLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/onboarding/welcome" replace />,
          },
          {
            path: 'welcome',
            element: <WelcomePage />,
          },
          {
            path: 'preferences',
            element: <PreferencesPage />,
          },
          {
            path: 'goals',
            element: <GoalsPage />,
          },
          {
            path: 'account',
            element: <AccountPage />,
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/email-sent',
        element: <EmailSentPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: '/app',
    element: <RequireAuth onboarding="complete" />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'accounts',
            element: <AccountsPage />,
          },
          {
            path: 'transactions',
            element: <TransactionsPage />,
          },
          {
            path: 'calendar',
            element: <CalendarPage />,
          },
          {
            path: 'categories',
            element: <CategoriesPage />,
          },
          {
            path: 'budgets',
            element: <BudgetsPage />,
          },
          {
            path: 'goals',
            element: <AppGoalsPage />,
          },
          {
            path: 'groups',
            element: <GroupsPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <RouteErrorPage />,
  },
])
