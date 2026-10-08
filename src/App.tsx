import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Findings from "@/pages/Findings";
import FindingDetail from "@/pages/FindingDetail";
import Targets from "@/pages/Targets";
import LLMRedTeam from "@/pages/LLMRedTeam";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/findings" element={<Findings />} />
        <Route path="/findings/:id" element={<FindingDetail />} />
        <Route path="/targets" element={<Targets />} />
        <Route path="/llm" element={<LLMRedTeam />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
