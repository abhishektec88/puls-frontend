import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-slate-400 mb-4">Page not found.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
