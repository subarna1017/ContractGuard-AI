import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  CalendarDays,
  Search,
  Settings,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Users,
  ChevronRight,
  Activity,
  BrainCircuit,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

type Clause = {
  clause: string;
  status: string;
  risk: string;
  value: number | null;
  policy: string;
  evidence: string;
  reason: string;
  action: string;
};

type Summary = {
  total_rules_checked: number;
  compliant: number;
  deviations: number;
  missing: number;
  prohibited: number;
  unclear: number;
};

type Investigation = {
  title: string;
  contract_clause: string;
  policy: string;
  evidence: string;
  classification: string;
  risk: string;
  reason: string;
  recommended_action: string;
};

type NavItemProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [summary, setSummary] = useState<Summary>({
    total_rules_checked: 0,
    compliant: 0,
    deviations: 0,
    missing: 0,
    prohibited: 0,
    unclear: 0,
  });

  const [extractedText, setExtractedText] = useState("");
  const [extracting, setExtracting] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [clauses, setClauses] = useState<Clause[]>([]);

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [investigating, setInvestigating] = useState(false);

  const [investigationSummary, setInvestigationSummary] = useState({
    investigations_run: 0,
    high_risk: 0,
    requires_review: 0,
  });

  const handleFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);

    setExtractedText("");
    setClauses([]);

    setSummary({
      total_rules_checked: 0,
      compliant: 0,
      deviations: 0,
      missing: 0,
      prohibited: 0,
      unclear: 0,
    });

    setInvestigations([]);
    setInvestigationSummary({
      investigations_run: 0,
      high_risk: 0,
      requires_review: 0,
    });

    setUploading(true);
    setUploadMessage("Uploading contract...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/upload-contract",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      await response.json();

      setUploadMessage("Contract uploaded successfully!");
    } catch (error) {
      console.error(error);
      setUploadMessage("Contract upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a contract first.");
      return;
    }

    setExtracting(true);
    setUploadMessage("Extracting contract text...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://127.0.0.1:8000/extract-contract",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Extraction failed");
      }

      const data = await response.json();

      setExtractedText(data.text || "");

      setUploadMessage("Contract text extracted successfully!");
    } catch (error) {
      console.error(error);
      setUploadMessage("Contract extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a contract first.");
      return;
    }

    setAnalyzing(true);
    setUploadMessage("Analyzing contract compliance...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://127.0.0.1:8000/analyze-contract",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();

      setClauses(data.findings || []);

      setSummary(
        data.summary || {
          total_rules_checked: 0,
          compliant: 0,
          deviations: 0,
          missing: 0,
          prohibited: 0,
          unclear: 0,
        }
      );

      setUploadMessage("Contract analysis completed!");
    } catch (error) {
      console.error(error);
      setUploadMessage("Contract analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInvestigate = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a contract first.");
      return;
    }

    setInvestigating(true);
    setUploadMessage("Running AI Investigation...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://127.0.0.1:8000/investigate-contract",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Investigation failed");
      }

      const data = await response.json();

      setInvestigations(data.investigations || []);

      setInvestigationSummary(
        data.summary || {
          investigations_run: 0,
          high_risk: 0,
          requires_review: 0,
        }
      );

      setUploadMessage("AI investigation completed!");
    } catch (error) {
      console.error(error);
      setUploadMessage("AI investigation failed.");
    } finally {
      setInvestigating(false);
    }
  };

  const riskClauses = clauses.filter(
    (item) =>
      item.risk?.toUpperCase() === "HIGH" ||
      item.risk?.toUpperCase() === "MEDIUM"
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <BrainCircuit size={19} />
          </div>

          <div>
            <p className="text-sm font-bold">ContractGuard AI</p>
            <p className="text-[11px] text-slate-500">
              Compliance Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <BrainCircuit size={21} />
              </div>

              <div>
                <h1 className="text-sm font-bold">
                  ContractGuard AI
                </h1>
                <p className="text-[11px] text-slate-500">
                  Evidence-backed compliance
                </p>
              </div>
            </div>
          </div>

          <div className="px-3 py-5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Workspace
            </p>

            <NavItem
  icon={<LayoutDashboard size={17} />}
  label="Overview"
  active
  onClick={() =>
    document.getElementById("overview")?.scrollIntoView({
      behavior: "smooth",
    })
  }
/>

<NavItem
  icon={<FileText size={17} />}
  label="Documents"
  onClick={() =>
    document.getElementById("documents")?.scrollIntoView({
      behavior: "smooth",
    })
  }
/>

<NavItem
  icon={<ShieldAlert size={17} />}
  label="Risk Intelligence"
  onClick={() =>
    document.getElementById("risk-intelligence")?.scrollIntoView({
      behavior: "smooth",
    })
  }
/>

<NavItem
  icon={<CalendarDays size={17} />}
  label="Deadlines"
  onClick={() =>
    document.getElementById("deadlines")?.scrollIntoView({
      behavior: "smooth",
    })
  }
/>

<NavItem
  icon={<Search size={17} />}
  label="Evidence"
  onClick={() =>
    document.getElementById("evidence")?.scrollIntoView({
      behavior: "smooth",
    })
  }
/>

<NavItem
  icon={<Sparkles size={17} />}
  label="AI Investigation"
  onClick={() =>
    document.getElementById("ai-investigation")?.scrollIntoView({
      behavior: "smooth",
    })
  }
/>
            
          </div>

          <div className="mt-auto border-t border-slate-200 px-3 py-4">
            <NavItem
              icon={<Settings size={17} />}
              label="Settings"
            />

            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">
                  AI Engine Online
                </span>
              </div>

              <p className="mt-1 text-[11px] text-slate-500">
                Evidence processing system active
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
        />
      )}

      {/* Main */}
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Hero */}
          <section
  id="overview"
  className="mb-7 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8"
>
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Activity size={14} />
                Evidence-backed compliance intelligence
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Understand contracts.
                <br />
                Detect compliance risks.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                ContractGuard AI extracts contractual obligations,
                connects them with company policies, and provides
                traceable evidence for every finding.
              </p>
            </div>
          </section>

          {/* Upload */}
          <section
            id="documents"
            className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Contract Document
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload a PDF or DOCX lease / contract agreement.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} />
                  Evidence-first workflow
                </div>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-slate-100">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Upload size={21} className="text-slate-700" />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  {fileName || "Choose contract document"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  PDF or DOCX files supported
                </p>

                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>

              {uploadMessage && (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {uploadMessage}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleExtract}
                disabled={
                  !selectedFile ||
                  extracting ||
                  uploading
                }
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {extracting
                  ? "Extracting..."
                  : "Extract Contract"}
              </button>

              <button
                onClick={handleAnalyze}
                disabled={
                  !selectedFile ||
                  analyzing ||
                  uploading
                }
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing
                  ? "Analyzing..."
                  : "Analyze Compliance"}
              </button>
            </div>
          </section>

          {/* Extracted Text */}
          {extractedText && (
            <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText size={18} className="text-slate-700" />
                <h3 className="font-bold">
                  Extracted Contract Text
                </h3>
              </div>

              <div className="max-h-80 overflow-auto rounded-xl bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-600">
                  {extractedText}
                </pre>
              </div>
            </section>
          )}

          {/* Stats */}
          <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<FileText size={18} />}
              label="Rules Checked"
              value={summary.total_rules_checked}
            />

            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Compliant"
              value={summary.compliant}
            />

            <StatCard
              icon={<AlertTriangle size={18} />}
              label="Deviations"
              value={summary.deviations}
            />

            <StatCard
              icon={<ShieldAlert size={18} />}
              label="Prohibited"
              value={summary.prohibited}
            />
          </section>

          {/* Clause Analysis */}
          {clauses.length > 0 && (
            <section className="mb-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">
                      Contract Clause Analysis
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Contract evidence compared against predefined
                      company policies.
                    </p>
                  </div>

                  <div className="hidden rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 sm:block">
                    {clauses.length} findings
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {clauses.map((item, index) => (
                  <ClauseRow
                    key={`${item.clause}-${index}`}
                    item={item}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Risk Intelligence */}
          <section
           id="risk-intelligence"
          className="mb-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} />
                <h3 className="font-bold">
                  Potential Compliance Risks
                </h3>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Higher-risk findings requiring attention.
              </p>
            </div>

            {riskClauses.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {riskClauses.map((item, index) => (
                  <RiskRow
                    key={`${item.clause}-${index}`}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <CheckCircle2
                  size={28}
                  className="mx-auto text-emerald-500"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No high or medium risks detected yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Upload and analyze a contract to populate risk
                  intelligence.
                </p>
              </div>
            )}
          </section>

          {/* Upcoming Obligations */}
          <section 
            id="deadlines"
          className="mb-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} />
                <h3 className="font-bold">
                  Upcoming Obligations
                </h3>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Important contract responsibilities and deadlines.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              <Deadline
                title="Notice Period"
                description="Review termination notice requirement."
                status="30–60 days"
              />

              <Deadline
                title="Security Deposit"
                description="Verify deposit amount against policy."
                status="₹50K–₹75K"
              />

              <Deadline
                title="Deposit Return"
                description="Verify return conditions and timeline."
                status="Review"
              />
            </div>
          </section>

          {/* Evidence */}
          <section 
            id="evidence"
          className="mb-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Search size={18} />
                <h3 className="font-bold">
                  Evidence-backed Analysis
                </h3>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Every finding should be traceable to contract
                evidence.
              </p>
            </div>

            <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
              <EvidenceCard
                title="Contract Evidence"
                description="The exact clause used to support an identified finding."
              />

              <EvidenceCard
                title="Policy Evidence"
                description="The predefined organizational rule used for comparison."
              />
            </div>
          </section>

          {/* AI Investigation */}
          <section 
              id="ai-investigation"className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Sparkles size={15} />
                    AI Investigation Mode
                  </div>

                  <h3 className="text-xl font-bold">
                    Investigate contract-to-policy relationships
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Trace a contract clause to the relevant company
                    policy, classify the finding, explain the risk,
                    and show the supporting evidence.
                  </p>
                </div>

                <button
                  onClick={handleInvestigate}
                  disabled={investigating || !selectedFile}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {investigating
                    ? "Investigating..."
                    : "Start investigation"}

                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Investigation Summary */}
            {investigations.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-5 sm:grid-cols-3 sm:p-6">
                  <InvestigationStat
                    label="Investigations"
                    value={
                      investigationSummary.investigations_run
                    }
                  />

                  <InvestigationStat
                    label="High Risk"
                    value={
                      investigationSummary.high_risk
                    }
                  />

                  <InvestigationStat
                    label="Requires Review"
                    value={
                      investigationSummary.requires_review
                    }
                  />
                </div>

                {/* Investigation Results */}
                <div className="divide-y divide-slate-200">
                  {investigations.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">
                            {item.title}
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            Evidence-backed investigation
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                              item.classification
                                ?.toUpperCase() === "COMPLIANT"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.classification}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                              item.risk?.toUpperCase() === "HIGH"
                                ? "bg-red-50 text-red-700"
                                : item.risk?.toUpperCase() ===
                                  "MEDIUM"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {item.risk} RISK
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <InvestigationBox
                          title="Contract Clause"
                          content={item.contract_clause}
                        />

                        <InvestigationBox
                          title="Company Policy"
                          content={item.policy}
                        />

                        <InvestigationBox
                          title="Evidence"
                          content={item.evidence}
                        />

                        <InvestigationBox
                          title="Reason"
                          content={item.reason}
                        />
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <Users
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-600"
                          />

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Recommended Action
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {item.recommended_action}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 bg-amber-50 px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                      <p className="text-sm font-bold text-amber-800">
                        Human review recommended
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Investigation results are evidence-backed
                        findings intended to support human review,
                        not replace final legal or compliance
                        decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {investigations.length === 0 && !investigating && (
              <div className="p-6 text-center">
                <Sparkles
                  size={28}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Investigation results will appear here
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Select a contract and click Start investigation.
                </p>
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="pb-6 text-center text-xs text-slate-400">
            ContractGuard AI · Evidence-backed compliance
            intelligence
          </footer>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Components ---------------- */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}

function ClauseRow({ item }: { item: Clause }) {
  const status = item.status?.toUpperCase();

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-slate-900">
              {item.clause}
            </h4>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                status === "COMPLIANT"
                  ? "bg-emerald-50 text-emerald-700"
                  : status === "MISSING"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {item.status}
            </span>
          </div>

          <p className="mt-2 text-xs font-medium text-slate-500">
            Policy: {item.policy}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {item.reason}
          </p>
        </div>

        <div className="min-w-[150px] rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Risk
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {item.risk}
          </p>

          {item.value !== null && (
            <>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Detected Value
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {item.value}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Evidence
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {item.evidence}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <AlertTriangle size={14} />
        Action: {item.action}
      </div>
    </div>
  );
}

function RiskRow({ item }: { item: Clause }) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <AlertTriangle size={17} />
        </div>

        <div>
          <p className="font-semibold text-slate-900">
            {item.clause}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {item.reason}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">
          {item.risk}
        </span>
      </div>
    </div>
  );
}

function Deadline({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Clock3 size={17} />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
        {status}
      </span>
    </div>
  );
}

function EvidenceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-slate-600" />

        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function InvestigationStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InvestigationBox({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {content}
      </p>
    </div>
  );
}

export default App;