import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4">Profile</h2>
        <div className="space-y-2">
          <p><span className="text-slate-400">Name:</span> {user?.name}</p>
          <p><span className="text-slate-400">Email:</span> {user?.email}</p>
          <p><span className="text-slate-400">User ID:</span> {user?.id}</p>
        </div>
      </div>
    </div>
  );
}
