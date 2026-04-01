import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
 
export default function PrivateRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
 
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
 
  return children
}