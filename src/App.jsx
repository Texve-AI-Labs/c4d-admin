import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth, Public } from "@/layouts";
import { AuthProvider } from "./context/auth";
import { RealtimeEventsProvider } from "./context/realtimeEvents";
import FcmToast from "./components/FcmToast";

function App() {

  return (
    <AuthProvider>
      <RealtimeEventsProvider>
      <FcmToast />
      <Routes>
        <Route path="/dashboard/*" element={
          <Dashboard />
        } />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/public/*" element={<Public />} />
        <Route path="*" element={<Navigate to="/dashboard/booking" replace />} />
      </Routes>
      </RealtimeEventsProvider>
    </AuthProvider>
  );
}

export default App;
