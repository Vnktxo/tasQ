import { useEffect, useState } from "react";
import { Activity, CheckCircle, Clock, XCircle, Play } from "lucide-react";

interface Stats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastUpdated, setlastUpdated] = useState<Date>(new Date());
  const [isSending, setIsSending] = useState(false);

  const fetchStats = async () => {
    try {
      const result = await fetch("http://localhost:3000/stats");
      const data = await result.json();
      setStats(data.stats);
      setlastUpdated(new Date());
    } catch (err) {
      console.error("Backend systems OFFLINE?");
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendTestJob = async () => {
    setIsSending(true);
    try {
      await fetch("http//localhost:3000/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "vnktesh14@gmail.com",
          subject: "DashBoard",
          body: "REACTion",
          delay: 2,
        }),
      });
      fetchStats();
    } catch (err) {
      alert("Failed to send the job yo!");
    } finally {
      setIsSending(false);
    }
  };

  if (!stats) return <div className="p-10 text-white">LOADING TASQ...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="text-blue-500" /> tasQ Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Live Monitor • Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={sendTestJob}
            disabled={isSending}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
          >
            {isSending ? (
              "Sending..."
            ) : (
              <>
                <Play size={16} /> Inject Job
              </>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Pending"
            count={stats.pending}
            icon={<Clock />}
            color="text-yellow-400"
            bg="bg-yellow-400/10"
          />
          <StatCard
            title="Processing"
            count={stats.processing}
            icon={<Activity />}
            color="text-blue-400"
            bg="bg-blue-400/10"
          />
          <StatCard
            title="Completed"
            count={stats.completed}
            icon={<CheckCircle />}
            color="text-green-400"
            bg="bg-green-400/10"
          />
          <StatCard
            title="Failed"
            count={stats.failed}
            icon={<XCircle />}
            color="text-red-400"
            bg="bg-red-400/10"
          />
        </div>

        {/* Visualization of Queue State */}
        <div className="mt-10 p-6 bg-slate-800 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-xs font-mono">
              WORKER: ONLINE
            </span>
            <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-mono">
              DB: CONNECTED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
function StatCard({ title, count, icon, color, bg }: any) {
  return (
    <div
      className={`p-6 rounded-xl border border-slate-700 ${bg} flex items-center justify-between`}
    >
      <div>
        <h3 className="text-slate-400 text-sm font-medium uppercase">
          {title}
        </h3>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{count}</p>
      </div>
      <div className={`${color} opacity-80`}>{icon}</div>
    </div>
  );
}
export default App;
