import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CategoryRoute from './CategoryRoute'
import {
  CATEGORIA_CONSULTA,
  CATEGORIA_SIMPLIFICADO,
  CATEGORIA_FINANCEIRO,
  CATEGORIA_ADMINISTRADOR,
} from '../../constants/userCategories'

// Mock useAuth so we can control auth state per test
vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock Navigate so we can inspect where it redirects without needing a full
// router setup. Renders a div with a data-to attribute we can assert on.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
    useLocation: () => ({ pathname: '/test', state: null }),
  }
})

import { useAuth } from '../../context/useAuth'

// Helper — wrap in MemoryRouter (needed for any react-router-dom hooks)
function renderRoute({ allow, categoria, user = { uid: '123' }, loading = false }) {
  useAuth.mockReturnValue({ user, categoria, loading })
  return render(
    <MemoryRouter>
      <CategoryRoute allow={allow}>
        <div data-testid="protected-content">Protected</div>
      </CategoryRoute>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Authentication ────────────────────────────────────────────────────────────
describe('CategoryRoute — authentication', () => {
  it('redirects to /login when user is not authenticated', () => {
    renderRoute({ allow: [CATEGORIA_ADMINISTRADOR], user: null, categoria: null })
    const nav = screen.getByTestId('navigate')
    expect(nav).toHaveAttribute('data-to', '/login')
  })

  it('shows loading indicator while auth is resolving', () => {
    renderRoute({ allow: [CATEGORIA_ADMINISTRADOR], user: null, categoria: null, loading: true })
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})

// ── Allowed access ────────────────────────────────────────────────────────────
describe('CategoryRoute — allowed access', () => {
  it('renders children when category is in the allow list', () => {
    renderRoute({ allow: [CATEGORIA_ADMINISTRADOR], categoria: CATEGORIA_ADMINISTRADOR })
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('renders children when one of multiple allowed categories matches', () => {
    renderRoute({
      allow: [CATEGORIA_FINANCEIRO, CATEGORIA_ADMINISTRADOR],
      categoria: CATEGORIA_FINANCEIRO,
    })
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
})

// ── Redirect fallbacks ────────────────────────────────────────────────────────
describe('CategoryRoute — redirect fallbacks', () => {
  it('redirects Consulta to /consulta-simples when not allowed', () => {
    renderRoute({ allow: [CATEGORIA_ADMINISTRADOR], categoria: CATEGORIA_CONSULTA })
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/consulta-simples')
  })

  it('redirects Simplificado to /consulta-simples when not allowed', () => {
    renderRoute({ allow: [CATEGORIA_ADMINISTRADOR], categoria: CATEGORIA_SIMPLIFICADO })
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/consulta-simples')
  })

  it('redirects Financeiro to /projetos when not allowed', () => {
    renderRoute({ allow: [CATEGORIA_ADMINISTRADOR], categoria: CATEGORIA_FINANCEIRO })
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/projetos')
  })

  it('redirects Administrador to /projetos when accessing a disallowed route', () => {
    renderRoute({ allow: [CATEGORIA_CONSULTA], categoria: CATEGORIA_ADMINISTRADOR })
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/projetos')
  })
})
