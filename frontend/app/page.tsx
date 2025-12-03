import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <main className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-blue-600">GovAI</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-Powered Government Contract Discovery Platform.
          Automatically find and evaluate opportunities matching your business profile.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Login
          </Link>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="font-semibold mb-2">Auto-Discovery</h3>
            <p className="text-gray-600 text-sm">
              Automatic polling of SAM.gov every 15 minutes
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="font-semibold mb-2">AI Evaluation</h3>
            <p className="text-gray-600 text-sm">
              GPT-4 powered scoring and recommendations
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">📧</div>
            <h3 className="font-semibold mb-2">Daily Digests</h3>
            <p className="text-gray-600 text-sm">
              Top opportunities delivered to your inbox
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
