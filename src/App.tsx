import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
  Users,
  Menu,
  X,
  LogOut,
  Loader2, // Added this missing import
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { AddMember } from "./components/AddMember";
import { TodayCollection } from "./components/TodayCollection";
import { MembersList } from "./components/MembersList";
import { OverdueMembers } from "./components/OverdueMembers";
import { MemberDetails } from "./components/MemberDetails";
import { Auth } from "./components/Auth";

type Page =
  | "dashboard"
  | "add-member"
  | "today-collection"
  | "members"
  | "overdue"
  | "member-details";

function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [previousPage, setPreviousPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    if (currentPage === "add-member") {
      setCurrentPage("members");
    }
  };

  const navigateTo = (page: Page, memberId: string | null = null) => {
    setPreviousPage(currentPage);
    if (memberId) setSelectedMemberId(memberId);
    setCurrentPage(page);
  };

  const navItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    {
      id: "today-collection" as Page,
      label: "Today's Collection",
      icon: Calendar,
    },
    { id: "add-member" as Page, label: "Add Member", icon: UserPlus },
    { id: "members" as Page, label: "All Members", icon: Users },
  ];

  // 1. Fixed Loading State (Loader2 is now defined)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 2. Auth Check
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:translate-x-0 lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 ease-in-out`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  LendTrack
                </h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-400 text-xs mt-1 font-medium uppercase tracking-wider">
                Admin Panel
              </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                      : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen w-full overflow-x-hidden">
          <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-gray-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>
                  Logged in:{" "}
                  <b className="text-blue-400">
                    {session.user.email?.split("@")[0]}
                  </b>
                </span>
              </div>
              <div className="text-gray-400 text-sm font-medium">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </header>

          <div className="p-6 max-w-7xl mx-auto" key={refreshKey}>
            {currentPage === "dashboard" && (
              <Dashboard
                onViewOverdue={() => navigateTo("overdue")}
                onViewTodayCollection={() => navigateTo("today-collection")}
              />
            )}
            {currentPage === "add-member" && (
              <AddMember onSuccess={handleSuccess} />
            )}
            {currentPage === "today-collection" && (
              <TodayCollection
                onPaymentSuccess={handleSuccess}
                onViewMember={(id) => navigateTo("member-details", id)}
              />
            )}
            {currentPage === "members" && (
              <MembersList
                onViewMember={(id) => navigateTo("member-details", id)}
              />
            )}
            {currentPage === "overdue" && (
              <OverdueMembers
                onViewMember={(id) => navigateTo("member-details", id)}
                onBack={() => setCurrentPage("dashboard")}
              />
            )}
            {currentPage === "member-details" && selectedMemberId && (
              <MemberDetails
                memberId={selectedMemberId}
                prevScreen={previousPage}
                onBack={() => setCurrentPage(previousPage)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
