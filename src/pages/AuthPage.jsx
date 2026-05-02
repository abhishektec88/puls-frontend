import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const isLogin = mode === "login";

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form);
      navigate("/dashboard");
    } catch {
      toast.error("Authentication failed");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <h2 className="text-2xl font-semibold">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        {!isLogin && <input className="input" placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
        <input className="input" placeholder="Email" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="btn-primary w-full">{isLogin ? "Login" : "Register"}</button>
        <p className="text-sm text-slate-400">
          {isLogin ? "No account?" : "Have an account?"}{" "}
          <Link to={isLogin ? "/register" : "/login"} className="text-indigo-400">
            {isLogin ? "Register" : "Login"}
          </Link>
        </p>
      </form>
    </div>
  );
}
