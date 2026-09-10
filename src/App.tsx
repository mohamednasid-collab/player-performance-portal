import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Players } from "./pages/Players";
import { Sessions } from "./pages/Sessions";
import { Assessments } from "./pages/Assessments";
import { Development } from "./pages/Development";
import { UserManagement } from "./pages/UserManagement";
import { Teams } from "./pages/Teams";

export default function App() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="screen-center">Loading CoachLab…</div>;
  if (!session || !profile) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout profile={profile}/>}>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/teams" element={<Teams/>}/>
          <Route path="/players" element={<Players/>}/>
          <Route path="/sessions" element={<Sessions/>}/>
          <Route path="/assessments" element={<Assessments/>}/>
          <Route path="/development" element={<Development/>}/>
          <Route path="/users" element={["super_admin","administrator"].includes(profile.role) ? <UserManagement/> : <Navigate to="/"/>}/>
          <Route path="*" element={<Navigate to="/"/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
