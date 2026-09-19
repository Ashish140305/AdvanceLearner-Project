import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>
        <p className="text-center mb-4">Login to NetSec Monitor</p>
        <Link to="/dashboard" className="block w-full text-center bg-teal-400 text-white py-3 rounded-xl font-bold">
          Mock Login
        </Link>
      </div>
    </div>
  );
};

export default Login;
