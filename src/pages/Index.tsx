import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to dashboard as the main landing page
  return <Navigate to="/dashboard" replace />;
};

export default Index;
