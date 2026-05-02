import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4">WatchTogether</h1>
        <p className="text-slate-300 mb-6">Create private rooms, sync playback, and chat in real time with friends.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/register" className="btn-primary">Get Started</Link>
          <Link to="/login" className="btn border border-slate-700">Login</Link>
        </div>
      </div>
    </div>
  );
}
