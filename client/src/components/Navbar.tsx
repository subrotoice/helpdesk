import { Link, useNavigate } from "react-router-dom";
import { getRole, signOut, useSession } from "../lib/auth-client";

export default function Navbar() {
  const navigate = useNavigate();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <span className="font-semibold">Ticket Management</span>
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
          Home
        </Link>
        <Link
          to="/tickets"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Tickets
        </Link>
        {getRole(session.user) === "admin" && (
          <Link
            to="/users"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Users
          </Link>
        )}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-gray-700">{session.user.name}</span>
          <button
            type="button"
            onClick={() =>
              signOut({
                fetchOptions: {
                  onSuccess: () => navigate("/login", { replace: true }),
                },
              })
            }
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
