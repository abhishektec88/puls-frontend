import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import ReactPlayer from "react-player";
import api from "../services/api";
import { wsUrl } from "../config/runtime";
import { useAuth } from "../context/AuthContext";

const WS_URL = wsUrl();

/** Only http(s) URLs can be shared; blob: file URLs are local to one browser. */
function sharableHttpUrl(url) {
  const u = (url || "").trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "";
}

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const playerRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaUploading, setMediaUploading] = useState(false);
  const clientRef = useRef(null);
  const videoUrlRef = useRef("");
  const isHostRef = useRef(false);
  /** Only the first SYNC_STATE after mount sets play state; later SYNC_STATE broadcasts (e.g. others joining) must not overwrite PLAY/PAUSE. */
  const appliedInitialSyncRef = useRef(false);
  /** Guests: browsers often block unmuted autoplay — start muted so remote PLAY can start the iframe. */
  const [muted, setMuted] = useState(true);

  const isHost = useMemo(() => room?.hostUserId === user?.id, [room, user]);

  useEffect(() => {
    videoUrlRef.current = videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    if (isHost) setMuted(false);
  }, [isHost]);

  useEffect(() => {
    const init = async () => {
      const roomData = await api.get(`/rooms/${code}`);
      const msgData = await api.get(`/rooms/${code}/messages`);
      setRoom(roomData.data);
      setMessages(msgData.data);
    };
    init();
  }, [code]);

  useEffect(() => {
    if (!isHost || !code) return;
    const t = setTimeout(() => {
      const u = sharableHttpUrl(videoUrl);
      if (!u) return;
      clientRef.current?.publish({
        destination: `/app/rooms/${code}/event`,
        body: JSON.stringify({ type: "VIDEO_URL", videoUrl: u })
      });
    }, 450);
    return () => clearTimeout(t);
  }, [videoUrl, isHost, code]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {}
    });
    client.onConnect = () => {
      const u = sharableHttpUrl(videoUrlRef.current);
      if (u && isHostRef.current) {
        client.publish({
          destination: `/app/rooms/${code}/event`,
          body: JSON.stringify({ type: "VIDEO_URL", videoUrl: u })
        });
      }
      client.subscribe(`/topic/rooms/${code}`, (frame) => {
        const event = JSON.parse(frame.body);
        if (event.type === "CHAT_MESSAGE") setMessages((prev) => [...prev, event.payload]);
        const sharedUrl = event.videoUrl || event.payload?.videoUrl;
        if (sharedUrl) setVideoUrl(String(sharedUrl));

        if (event.type === "PLAY") {
          setIsPlaying(true);
          return;
        }
        if (event.type === "PAUSE") {
          setIsPlaying(false);
          return;
        }
        if (event.type === "SEEK") {
          const t = Number(event.currentTime ?? event.payload?.currentTime ?? 0);
          playerRef.current?.seekTo(t, "seconds");
          setCurrentTime(t);
          setIsPlaying(String(event.isPlaying ?? event.payload?.isPlaying) === "true");
          return;
        }
        if (event.type === "SYNC_STATE") {
          const p = event.payload || {};
          if (p.videoUrl) setVideoUrl(String(p.videoUrl));
          const t = Number(p.currentTime ?? 0);
          playerRef.current?.seekTo(t, "seconds");
          setCurrentTime(t);
          if (!appliedInitialSyncRef.current) {
            setIsPlaying(String(p.isPlaying) === "true");
            appliedInitialSyncRef.current = true;
          }
        }
      });
      client.publish({ destination: `/app/rooms/${code}/sync-state-request`, body: "{}" });
    };
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, [code]);

  const emit = (type, payload = {}) => {
    const u = sharableHttpUrl(videoUrl);
    const body = u ? { type, videoUrl: u, ...payload } : { type, ...payload };
    clientRef.current?.publish({
      destination: `/app/rooms/${code}/event`,
      body: JSON.stringify(body)
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    emit("CHAT_MESSAGE", { message });
    setMessage("");
  };

  const leaveRoom = async () => {
    await api.post(`/rooms/${code}/leave`);
    navigate("/dashboard");
  };

  const activeUrl = videoUrl;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="card mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{room?.roomName || "Room"}</h1>
          <p className="text-sm text-slate-400">{room?.members?.length || 0} online</p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="btn border border-slate-700" to="/dashboard">Dashboard</Link>
          <button className="btn border border-rose-500 text-rose-300" onClick={leaveRoom}>Leave</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="flex gap-2 mb-3">
            <input
              className="input"
              placeholder="YouTube or MP4 URL"
              value={videoUrl}
              readOnly={!isHost}
              title={!isHost ? "Only the host can set the shared video URL" : undefined}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            {isHost && (
              <input
                type="file"
                accept="video/*"
                disabled={mediaUploading}
                className="text-sm disabled:opacity-50"
                title="Upload streams from the server so others can watch (blob URLs stay local to your browser)."
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  const input = e.target;
                  if (!file || !code) return;
                  setMediaUploading(true);
                  try {
                    const form = new FormData();
                    form.append("file", file);
                    const { data } = await api.post(`/rooms/${code}/media`, form, {
                      timeout: 0,
                      maxBodyLength: Infinity,
                      maxContentLength: Infinity
                    });
                    if (data?.playbackUrl) setVideoUrl(String(data.playbackUrl));
                  } catch (err) {
                    console.error(err);
                    let attempted = "";
                    try {
                      if (err.config) {
                        const rel = axios.getUri(err.config);
                        attempted =
                          rel.startsWith("http") || !window?.location?.origin
                            ? rel
                            : `${window.location.origin}${rel.startsWith("/") ? rel : `/${rel}`}`;
                      }
                    } catch (_) {
                      /* ignore */
                    }
                    const msg =
                      err.response?.data?.message
                      || (err.code === "ERR_NETWORK" || err.message === "Network Error"
                        ? `No response from API${attempted ? ` (${attempted})` : ""}. Start Spring Boot, match its port to VITE_DEV_PROXY_TARGET in .env (default 8080), restart Vite, and use "npm run dev" or "vite preview" (both proxy /api).`
                        : err.message);
                    window.alert(msg || "Upload failed");
                  } finally {
                    setMediaUploading(false);
                    input.value = "";
                  }
                }}
              />
            )}
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <ReactPlayer
              ref={playerRef}
              url={activeUrl}
              controls
              width="100%"
              height="420px"
              playing={isPlaying}
              muted={muted}
              volume={muted ? 0 : 0.9}
              config={{
                youtube: {
                  playerVars: { playsinline: 1 }
                }
              }}
            />
          </div>
          {!isHost && (
            <button type="button" className="text-xs text-slate-400 mt-1 underline" onClick={() => setMuted((m) => !m)}>
              {muted ? "Unmute (required for autoplay in some browsers)" : "Mute"}
            </button>
          )}
          <div className="flex gap-2 mt-3">
            <button disabled={!isHost} className="btn-primary disabled:opacity-50" onClick={() => { setIsPlaying(true); emit("PLAY", { currentTime, isPlaying: true }); }}>Play</button>
            <button disabled={!isHost} className="btn border border-slate-700 disabled:opacity-50" onClick={() => { setIsPlaying(false); emit("PAUSE", { currentTime, isPlaying: false }); }}>Pause</button>
            <button disabled={!isHost} className="btn border border-slate-700 disabled:opacity-50" onClick={() => { const t = playerRef.current?.getCurrentTime() || 0; emit("SEEK", { currentTime: t, isPlaying }); }}>Sync Seek</button>
          </div>
        </div>

        <div className="card flex flex-col h-[calc(100vh-170px)]">
          <h3 className="font-semibold mb-2">Chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3">
            {messages.map((m, idx) => (
              <div key={m.id || `${m.senderId}-${idx}`} className="rounded-lg bg-slate-800 p-2 text-sm">
                <span className="text-indigo-300">{m.senderName}: </span>{m.message}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2">
            <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message..." required />
            <button className="btn-primary">Send</button>
          </form>
          <div className="mt-4">
            <h4 className="text-sm text-slate-400 mb-1">Members</h4>
            <div className="flex flex-wrap gap-2">
              {room?.members?.map((m) => <span key={m.id} className="text-xs bg-slate-800 px-2 py-1 rounded-full">{m.name}</span>)}
            </div>
            <p className="text-xs mt-3 text-slate-500">Invite: {window.location.href}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
