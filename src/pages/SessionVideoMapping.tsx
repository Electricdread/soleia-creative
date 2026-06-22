import { Navigate, useParams } from 'react-router-dom';

export default function SessionVideoMapping() {
  const { token } = useParams<{ token: string }>();
  return <Navigate to={`/creative/${token}`} replace />;
}
