import {Navigate, useLocation} from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PrivateRoute({children}) {
    const {user, loading} = useAuth
    const location = useLocation()

    if(loading) {
        return (
            <div style = {{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                fontSize: '0.95rem',
                color: '#6b7280'
            }}>
                Carregando...
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{from: location}} replace/>
    }

    return children
}