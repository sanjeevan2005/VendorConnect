"use client";

import { useState, useEffect } from "react";
import { Sidebar, Topbar } from "@/components/shell";
import { Dashboard } from "@/components/screens/dashboard";
import { RfqDetail } from "@/components/screens/rfq-detail";
import { RfqNew } from "@/components/screens/rfq-new";
import { VendorDetail } from "@/components/screens/vendor-detail";

type View = "dashboard" | "rfq-new" | "rfq" | "vendor";

export default function Home() {
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("vs_view") as View) || "dashboard";
    return "dashboard";
  });
  const [openRfqId, setOpenRfqId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("vs_rfq") || "RFQ-2026-0042";
    return "RFQ-2026-0042";
  });
  const [openVendorId, setOpenVendorId] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("vs_vendor") || "v-01";
    return "v-01";
  });

  useEffect(() => { localStorage.setItem("vs_view", view); }, [view]);
  useEffect(() => { localStorage.setItem("vs_rfq", openRfqId); }, [openRfqId]);
  useEffect(() => { localStorage.setItem("vs_vendor", openVendorId); }, [openVendorId]);

  const goDashboard = () => setView("dashboard");
  const goNewRfq = () => setView("rfq-new");
  const goRfq = (id: string) => { setOpenRfqId(id); setView("rfq"); };
  const goVendor = (id: string) => { setOpenVendorId(id); setView("vendor"); };

  const crumbs = () => {
    if (view === "dashboard") return ["Dashboard"];
    if (view === "rfq-new") return ["Dashboard", "New RFQ"];
    if (view === "rfq") return ["Dashboard", "CNC-machined aluminum enclosures"];
    return ["Dashboard", "CNC-machined aluminum enclosures", openVendorId];
  };

  return (
    <div className="app">
      <Sidebar onHome={goDashboard} onNewRfq={goNewRfq} />
      <main className="main">
        <Topbar crumbs={crumbs()} />
        {view === "dashboard" && <Dashboard onOpenRfq={goRfq} onNewRfq={goNewRfq} />}
        {view === "rfq-new" && <RfqNew onBack={goDashboard} onCreated={goRfq} />}
        {view === "rfq" && <RfqDetail rfqId={openRfqId} onBack={goDashboard} onOpenVendor={goVendor} />}
        {view === "vendor" && <VendorDetail vendorId={openVendorId} onBack={() => setView("rfq")} />}
      </main>
    </div>
  );
}
