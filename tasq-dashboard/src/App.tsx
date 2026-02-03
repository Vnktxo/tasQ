import { useEffect, useState } from 'react';

// Define the shape of our data
interface Email {
  id: number;
  sender: string;
  subject: string;
  keyword_matched: string;
  received_at: string;
}

function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from your API
  useEffect(() => {
    fetch('http://localhost:3000/emails')
      .then(res => res.json())
      .then(data => {
        setEmails(data);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-10 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            🚀 Job Hunter <span className="text-blue-500">Dashboard</span>
          </h1>
          <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
            <span className="text-gray-400 text-sm">Status: </span>
            <span className="text-green-400 font-mono font-bold">ONLINE</span>
          </div>
        </div>

        {/* The List */}
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-900/50 p-4 text-sm font-medium text-gray-400 border-b border-gray-700">
            <div className="col-span-2">MATCH</div>
            <div className="col-span-6">SUBJECT</div>
            <div className="col-span-4 text-right">RECEIVED</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse">Scanning frequencies...</div>
          ) : (
            <div>
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="grid grid-cols-12 p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors items-center"
                >
                  {/* Badge */}
                  <div className="col-span-2">
                    <span className={`
                      px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                      ${email.keyword_matched === 'Interview' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : ''}
                      ${email.keyword_matched === 'Offer' ? 'bg-green-900/50 text-green-300 border border-green-700' : ''}
                      ${!['Interview', 'Offer'].includes(email.keyword_matched) ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : ''}
                    `}>
                      {email.keyword_matched}
                    </span>
                  </div>

                  {/* Subject & Sender */}
                  <div className="col-span-6 pr-4">
                    <div className="font-semibold text-white truncate">{email.subject}</div>
                    <div className="text-xs text-gray-500 truncate mt-1">{email.sender}</div>
                  </div>

                  {/* Date */}
                  <div className="col-span-4 text-right font-mono text-sm text-gray-400">
                    {new Date(email.received_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
