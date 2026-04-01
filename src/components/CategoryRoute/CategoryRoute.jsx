import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { CATEGORIA_SIMPLES } from '../../constants/userCategories'

export default function CategoryRoute({allow, children}) {
    const {user, categoria, loading} = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div style={{display:'flex', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
                Carregando...
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{from: location}} replace/>
    }

    if(!allow.includes(categoria)) {
        const fallback = categoria === CATEGORIA_SIMPLES ? '/consulta-simples' : '/projetos'
        return <Navigate to={fallback} replace/>
    }

    return children
}