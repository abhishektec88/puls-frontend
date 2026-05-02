import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Hi, {user?.name}</h1>
        <button className="btn border border-slate-700" onClick={logout}>Logout</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Link className="card hover:border-indigo-500" to="/rooms/create">Create Room</Link>
        <Link className="card hover:border-indigo-500" to="/rooms/join">Join Room</Link>
        <Link className="card hover:border-indigo-500" to="/profile">Profile</Link>
      </div>
    </div>
  );
}
