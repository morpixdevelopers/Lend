import { useState } from "react";
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
  Users,
  Menu,
  X,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { AddMember } from "./components/AddMember";
import { TodayCollection } from "./components/TodayCollection";
import { MembersList } from "./components/MembersList";
import { OverdueMembers } from "./components/OverdueMembers";
import { MemberDetails } from "./components/MemberDetails";

type Page =
  | "dashboard"
  | "add-member"
  | "today-collection"
  | "members"
  | "overdue"
  | "member-details";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [previousPage, setPreviousPage] = useState<Page>("dashboard"); // Tracks the previous context
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    if (currentPage === "add-member") {
      setCurrentPage("members");
    }
  };

  // Centralized navigation helper to track history
  const navigateTo = (page: Page, memberId: string | null = null) => {
    setPreviousPage(currentPage); // Save current page before moving
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

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:translate-x-0 lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 ease-in-out`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">LendTrack</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Money Lending Manager
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    currentPage === item.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* <div className="p-4 border-t border-gray-700">
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-xs">Lend Track</p>
                <p className="text-gray-500 text-xs mt-1">
                  Secure Lending System
                </p>
              </div>
            </div> */}
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-screen w-full overflow-x-hidden">
          <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="lg:block hidden" />
              <div className="text-gray-400 text-sm">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </header>

          <div className="p-6" key={refreshKey}>
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
