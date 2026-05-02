import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const createRoom = async (e) => {
    e.preventDefault();
    const { data } = await api.post("/rooms", { roomName, isPrivate });
    navigate(`/rooms/${data.roomCode}`);
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form className="card w-full max-w-lg space-y-4" onSubmit={createRoom}>
        <h2 className="text-2xl font-semibold">Create Room</h2>
        <input className="input" placeholder="Room name" onChange={(e) => setRoomName(e.target.value)} required />
        <label className="flex items-center gap-2"><input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Private room</label>
        <button className="btn-primary">Create</button>
      </form>
    </div>
  );
}
