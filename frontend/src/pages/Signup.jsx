import { Link } from 'react-router-dom';

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        <p className="text-center mb-4">Create a NetSec Monitor account</p>
        <Link to="/dashboard" className="block w-full text-center bg-teal-400 text-white py-3 rounded-xl font-bold">
          Mock Signup
        </Link>
      </div>
    </div>
  );
};

export default Signup;
