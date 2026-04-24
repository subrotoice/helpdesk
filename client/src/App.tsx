import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Tickets from "./pages/Tickets";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <span className="font-semibold">Ticket Management</span>
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <Link to="/tickets" className="text-sm text-gray-600 hover:text-gray-900">
            Tickets
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tickets" element={<Tickets />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
