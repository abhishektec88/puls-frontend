import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function JoinRoomPage() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const join = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/rooms/${code}/join`);
      navigate(`/rooms/${code}`);
    } catch {
      toast.error("Unable to join room");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form className="card w-full max-w-lg space-y-4" onSubmit={join}>
        <h2 className="text-2xl font-semibold">Join Room</h2>
        <input className="input uppercase" placeholder="Invite code" onChange={(e) => setCode(e.target.value.toUpperCase())} required />
        <button className="btn-primary">Join</button>
      </form>
    </div>
  );
}
