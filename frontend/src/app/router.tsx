import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AppLayout } from '../components/layout/AppLayout'
import { OnboardingLayout } from '../components/layout/OnboardingLayout'
import { RequireAuth } from '../features/auth/components/RequireAuth'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import {
  AccountPage,
  AccountsPage,
  AgendaPage,
  AnalyticsPage,
  AppGoalsPage,
  BudgetsPage,
  CalendarPage,
  CategoriesPage,
  CoachPage,
  DashboardPage,
  EmailSentPage,
  ForgotPasswordPage,
  GroupsPage,
  HomePage,
  LoginPage,
  OnboardingGoalsPage,
  PageLoader,
  PlanningPage,
  PreferencesPage,
  RecurringPage,
  RegisterPage,
  ResetPasswordPage,
  SettingsPage,
  TransactionsHubPage,
  TransactionsPage,
  VerifyEmailPage,
  WelcomePage,
} from './lazyPages'

function routePage(page: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{page}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: routePage(<HomePage />),
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
            element: routePage(<WelcomePage />),
          },
          {
            path: 'preferences',
            element: routePage(<PreferencesPage />),
          },
          {
            path: 'goals',
            element: routePage(<OnboardingGoalsPage />),
          },
          {
            path: 'account',
            element: routePage(<AccountPage />),
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
        element: routePage(<LoginPage />),
      },
      {
        path: '/register',
        element: routePage(<RegisterPage />),
      },
      {
        path: '/forgot-password',
        element: routePage(<ForgotPasswordPage />),
      },
      {
        path: '/email-sent',
        element: routePage(<EmailSentPage />),
        errorElement: <RouteErrorPage />,
      },
      {
        path: '/verify-email',
        element: routePage(<VerifyEmailPage />),
        errorElement: <RouteErrorPage />,
      },
      {
        path: '/reset-password',
        element: routePage(<ResetPasswordPage />),
        errorElement: <RouteErrorPage />,
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
            element: routePage(<DashboardPage />),
          },
          {
            path: 'accounts',
            element: routePage(<AccountsPage />),
          },
          {
            path: 'transactions',
            element: routePage(<TransactionsHubPage />),
            children: [
              {
                index: true,
                element: <Navigate to="/app/transactions/movements" replace />,
              },
              {
                path: 'movements',
                element: routePage(<TransactionsPage />),
              },
              {
                path: 'categories',
                element: routePage(<CategoriesPage />),
              },
            ],
          },
          {
            path: 'planning',
            element: routePage(<PlanningPage />),
            children: [
              {
                index: true,
                element: <Navigate to="/app/planning/budgets" replace />,
              },
              {
                path: 'budgets',
                element: routePage(<BudgetsPage />),
              },
              {
                path: 'goals',
                element: routePage(<AppGoalsPage />),
              },
            ],
          },
          {
            path: 'agenda',
            element: routePage(<AgendaPage />),
            children: [
              {
                index: true,
                element: <Navigate to="/app/agenda/calendar" replace />,
              },
              {
                path: 'calendar',
                element: routePage(<CalendarPage />),
              },
              {
                path: 'recurring',
                element: routePage(<RecurringPage />),
              },
            ],
          },
          {
            path: 'calendar',
            element: <Navigate to="/app/agenda/calendar" replace />,
          },
          {
            path: 'recurring',
            element: <Navigate to="/app/agenda/recurring" replace />,
          },
          {
            path: 'budgets',
            element: <Navigate to="/app/planning/budgets" replace />,
          },
          {
            path: 'goals',
            element: <Navigate to="/app/planning/goals" replace />,
          },
          {
            path: 'groups',
            element: routePage(<GroupsPage />),
          },
          {
            path: 'categories',
            element: <Navigate to="/app/transactions/categories" replace />,
          },
          {
            path: 'analytics',
            element: routePage(<AnalyticsPage />),
          },
          {
            path: 'coach',
            element: routePage(<CoachPage />),
          },
          {
            path: 'settings',
            element: routePage(<SettingsPage />),
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
