import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function BackToTickets() {
  return (
    <Link
      to="/tickets"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to tickets
    </Link>
  );
}
