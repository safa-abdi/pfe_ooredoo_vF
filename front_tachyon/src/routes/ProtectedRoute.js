import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { token, role } = useSelector((state) => state.auth);

  // Handle the loading state or redirect if not authenticated
  if (token === null) {
    return <div>Loading...</div>;  // Show a loading state while waiting for token
  }

  if (!token) {
    return <Navigate to="/" />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
