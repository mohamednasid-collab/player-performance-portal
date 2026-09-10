import { Outlet } from "react-router-dom";
import type { Profile } from "../../types";
import { Sidebar } from "./Sidebar";

export function AppLayout({ profile }: { profile: Profile }) {
  return <div className="app-shell"><Sidebar profile={profile}/><main className="main"><Outlet/></main></div>;
}
