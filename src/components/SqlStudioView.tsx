import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  RotateCcw,
  Download,
  Table,
  Columns,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Terminal,
  Layers,
  FileCode,
  Building,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  executeSql,
  fetchSqlSchema,
  syncToSqlDatabase,
  type SqlQueryResultClient,
  type SqlTableSchema,
} from '../lib/api';
import { WorkspaceOnboardingConfig } from './OnboardingSetupPage';
import { DatabaseStatus } from './DatabaseStatus';

interface SqlStudioViewProps {
  onboardingConfig?: WorkspaceOnboardingConfig;
  onReopenOnboarding?: () => void;
  clientsData?: any[];
  proposalsData?: any[];
  meetingsData?: any[];
  tasksData?: any[];
  paymentsData?: any[];
  onTriggerToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const PRESET_QUERIES = [
  {
    name: 'All Clients',
    badge: 'SELECT',
    description: 'Query all client accounts with logos, pipeline, and status',
    sql: 'SELECT id, clientKey, name, companyName, industry, logoUrl, pipelineValue, status FROM clients ORDER BY id ASC;',
  },
  {
    name: 'Pipeline & Proposals by Status',
    badge: 'GROUP BY',
    description: 'Aggregate proposal counts and financial pipeline sum',
    sql: 'SELECT status, count(*) AS total_proposals, sum(totalAmount) AS pipeline_value FROM proposals GROUP BY status;',
  },
  {
    name: 'Client & Proposal JOIN',
    badge: 'JOIN',
    description: 'Relational join between clients and their active proposals',
    sql: 'SELECT c.companyName, c.name AS contact_person, p.title AS proposal_title, p.totalAmount, p.status FROM clients c JOIN proposals p ON c.id = p.clientId;',
  },
  {
    name: 'Scheduled Meetings',
    badge: 'WHERE',
    description: 'Filter scheduled client reviews and strategy calls',
    sql: "SELECT id, title, clientCompany, clientName, date, time, platform, status FROM meetings WHERE status = 'Scheduled' ORDER BY id ASC;",
  },
  {
    name: 'Pending Tasks',
    badge: 'FILTER',
    description: 'Open action items prioritized for today and in progress',
    sql: "SELECT id, title, project, priority, status, dueDate, assignee FROM tasks WHERE status != 'completed' ORDER BY priority DESC;",
  },
  {
    name: 'Payments & Revenue',
    badge: 'FINANCIAL',
    description: 'All invoices, amounts, issue dates, and payment states',
    sql: 'SELECT id, invoiceNumber, clientCompany, projectTitle, amount, currency, status, dueDate FROM payments ORDER BY id ASC;',
  },
  {
    name: 'Business Profile & Workspace Settings',
    badge: 'CONFIG',
    description: 'Active organization name, industry, currency, and tone',
    sql: 'SELECT id, organizationName, displayName, industry, currency, proposalTone, servicesOffered FROM users;',
  },
];

export const SqlStudioView: React.FC<SqlStudioViewProps> = ({
  onboardingConfig,
  onReopenOnboarding,
  clientsData = [],
  proposalsData = [],
  meetingsData = [],
  tasksData = [],
  paymentsData = [],
  onTriggerToast,
}) => {
  const [queryInput, setQueryInput] = useState<string>(
    'SELECT id, clientKey, name, companyName, industry, logoUrl, pipelineValue, status FROM clients ORDER BY id ASC;'
  );
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [executing, setExecuting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<SqlQueryResultClient | null>(null);
  const [schemaData, setSchemaData] = useState<{ tables: SqlTableSchema[]; totalRecords: number } | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('clients');
  const [filterText, setFilterText] = useState<string>('');

  const loadSchema = async () => {
    const res = await fetchSqlSchema();
    if (res) {
      setSchemaData(res);
    }
  };

  const handleRunQuery = async (sqlToRun?: string) => {
    const sql = (sqlToRun || queryInput).trim();
    if (!sql) return;
    setExecuting(true);
    try {
      const res = await executeSql(sql);
      setQueryResult(res);
      if (res.isMutation) {
        void loadSchema();
        onTriggerToast?.('SQL mutation executed & persisted to database', 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setQueryResult({
        success: false,
        sql,
        rows: [],
        rowCount: 0,
        columns: [],
        executionTimeMs: 0,
        isMutation: false,
        error: msg,
      });
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    void loadSchema();
    void handleRunQuery(queryInput);
  }, []);

  const handleApplyPreset = (preset: typeof PRESET_QUERIES[0], idx: number) => {
    setActivePresetIndex(idx);
    setQueryInput(preset.sql);
    void handleRunQuery(preset.sql);
  };

  const handleSelectTableSchema = (tableName: string) => {
    setSelectedTable(tableName);
    const sql = `SELECT * FROM ${tableName} LIMIT 50;`;
    setQueryInput(sql);
    void handleRunQuery(sql);
  };

  const handleSyncFromUI = async () => {
    setSyncing(true);
    try {
      const success = await syncToSqlDatabase({
        clients: clientsData,
        proposals: proposalsData,
        meetings: meetingsData,
        tasks: tasksData,
        payments: paymentsData,
      });
      if (success) {
        await loadSchema();
        await handleRunQuery();
        onTriggerToast?.('SQL tables synchronized with current workspace records', 'success');
      } else {
        onTriggerToast?.('Sync request completed', 'info');
      }
    } catch {
      onTriggerToast?.('Failed to sync to SQL database', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCsv = () => {
    if (!queryResult || queryResult.rows.length === 0) {
      onTriggerToast?.('No query rows to export', 'info');
      return;
    }
    const cols = queryResult.columns;
    const rows = queryResult.rows.map((row) =>
      cols
        .map((col) => {
          const val = row[col];
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zendo-sql-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onTriggerToast?.('Exported SQL query results to CSV', 'success');
  };

  const filteredRows = React.useMemo(() => {
    if (!queryResult || !filterText.trim()) return queryResult?.rows || [];
    const term = filterText.toLowerCase();
    return queryResult.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [queryResult, filterText]);

  const [activeStudioTab, setActiveStudioTab] = useState<'status' | 'console'>('status');

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#e2e8e4] pb-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveStudioTab('status')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeStudioTab === 'status'
                ? 'bg-[#214332] text-white shadow-xs'
                : 'bg-white text-[#526b5c] hover:bg-[#f1f5f2] border border-[#e2e8e4]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Status &amp; Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStudioTab('console')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeStudioTab === 'console'
                ? 'bg-[#214332] text-white shadow-xs'
                : 'bg-white text-[#526b5c] hover:bg-[#f1f5f2] border border-[#e2e8e4]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Interactive SQL Console &amp; Presets</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSyncFromUI}
          disabled={syncing}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Store...' : 'Sync Store'}</span>
        </button>
      </div>

      {activeStudioTab === 'status' ? (
        <DatabaseStatus
          onTriggerToast={onTriggerToast}
          onOpenSqlStudio={() => setActiveStudioTab('console')}
        />
      ) : (
        <>
          {/* Top Banner: Business Profile Context & Quick Re-launch */}
          <section className="bg-gradient-to-r from-[#214332] via-[#2f5e46] to-[#1c382a] text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-[#3b664e]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
                <Database className="w-3.5 h-3.5" />
                <span>Relational SQL Engine &amp; Data Studio</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
                {onboardingConfig?.companyName || 'Zendo Studio'} — SQL Management
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
                Manage, query, and synchronize your clients, proposals, meetings, tasks, and payments using ANSI SQL. 
                All changes persist automatically to relational storage.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {onReopenOnboarding && (
                <button
                  type="button"
                  onClick={onReopenOnboarding}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-[#1e3e2d] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Building className="w-4 h-4 text-[#2f5e46]" />
                  <span>Edit Business Questions</span>
                </button>
              )}
            </div>
          </section>

      {/* SQL Preset Chips */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e8e4] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#3d6b52]" />
            <h3 className="text-sm font-bold text-[#0f172a]">Ready-to-Run SQL Presets</h3>
          </div>
          <span className="text-xs text-[#718478] font-medium hidden sm:inline">
            Click any query to execute immediately
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {PRESET_QUERIES.map((preset, idx) => {
            const isSelected = activePresetIndex === idx;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset, idx)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-[#ebf2ed] border-[#3d6b52]/40 text-[#1d3d2c] shadow-2xs ring-1 ring-[#3d6b52]/20'
                    : 'bg-white hover:bg-[#f6f9f7] border-[#e2e8e4] text-[#2c3d33]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate">{preset.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#dfece3] text-[#244c36] font-bold shrink-0">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#6d7f73] line-clamp-1">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Studio Grid: SQL Console + Table Schema Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Interactive SQL Query Editor & Results Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Query Editor Box */}
          <div className="bg-[#121c16] rounded-2xl p-4 sm:p-5 text-white shadow-md border border-[#243c2f] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#243c2f] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-300 font-semibold tracking-wide uppercase">
                  Interactive SQL Editor
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/60 font-mono">
                Press Ctrl+Enter or Cmd+Enter to run
              </span>
            </div>

            <textarea
              rows={4}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void handleRunQuery();
                }
              }}
              placeholder="Write SQL statement... (e.g., SELECT * FROM clients;)"
              className="w-full bg-[#0a120d] text-emerald-100 font-mono text-xs sm:text-sm p-3.5 rounded-xl border border-[#22392c] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-y leading-relaxed"
            />

            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunQuery()}
                  disabled={executing || !queryInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#2ea466] hover:bg-[#258d56] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${executing ? 'animate-spin' : ''}`} />
                  <span>{executing ? 'Executing...' : 'Execute SQL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQueryInput('SELECT * FROM clients ORDER BY id ASC;');
                    void handleRunQuery('SELECT * FROM clients ORDER BY id ASC;');
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {queryResult && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  {queryResult.success ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{queryResult.rowCount} rows ({queryResult.executionTimeMs}ms)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-1 rounded border border-rose-800/40">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Syntax Error</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Banner if Query Failed */}
          {queryResult && !queryResult.success && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs sm:text-sm font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">SQL Execution Error</p>
                <p className="mt-1 text-rose-700">{queryResult.error || 'Failed to parse SQL statement'}</p>
              </div>
            </div>
          )}

          {/* Tabular Output Grid */}
          <div className="bg-white rounded-2xl border border-[#e2e8e4] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#e5ebe7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbfdfc]">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-[#3d6b52]" />
                <h4 className="text-sm font-bold text-[#0f172a]">Query Results</h4>
                {queryResult && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#ebf2ed] text-[#284e3a] font-semibold">
                    {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {queryResult && queryResult.rows.length > 0 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#8b9b91] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Filter results..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-[#e2e8e4] text-xs text-[#0f172a] placeholder:text-[#8b9b91] focus:outline-none focus:border-[#3d6b52] w-36 sm:w-44"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!queryResult || queryResult.rows.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-[#e2e8e4] hover:bg-[#ebf0ec] disabled:opacity-40 text-xs font-medium text-[#2c3d33] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#3d6b52]" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Table rendering */}
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto [scrollbar-width:thin]">
              {!queryResult || queryResult.rows.length === 0 ? (
                <div className="py-12 text-center text-[#718478] space-y-2">
                  <Database className="w-8 h-8 mx-auto text-[#a8beb1] stroke-[1.5]" />
                  <p className="text-sm font-medium">No records match the current SQL query</p>
                  <p className="text-xs text-[#8a9d91]">
                    Run a query or click any preset chip above to inspect records.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f5f8f6] text-[#4d6356] font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-[#e2e8e4]">
                    <tr>
                      <th className="py-2.5 px-3.5 w-12 text-center font-mono text-[10px] text-[#788c80]">#</th>
                      {queryResult.columns.map((col) => (
                        <th key={col} className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2ee]">
                    {filteredRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#f6f9f7] transition-colors">
                        <td className="py-2 px-3 text-center font-mono text-[10px] text-[#8ea096] bg-[#fafcfb]">
                          {rIdx + 1}
                        </td>
                        {queryResult.columns.map((col) => {
                          const val = row[col];
                          const strVal = val === null || val === undefined ? 'null' : String(val);
                          const isNull = val === null || val === undefined;
                          const isStatus = col.toLowerCase() === 'status';
                          const isLogo = col.toLowerCase().includes('logo') && Boolean(strVal && (strVal.startsWith('http') || strVal.startsWith('data:image')));

                          return (
                            <td key={col} className="py-2 px-3.5 whitespace-nowrap text-[#192b21] max-w-xs truncate">
                              {isNull ? (
                                <span className="font-mono text-[10px] text-slate-400 italic">null</span>
                              ) : isStatus ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e7f3ec] text-[#244c36]">
                                  {strVal}
                                </span>
                              ) : isLogo ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={strVal}
                                    alt="Logo preview"
                                    className="w-5 h-5 rounded-md object-cover border border-[#e2e8e4] shrink-0"
                                  />
                                  <span className="font-mono text-[11px] text-[#4d6356] truncate">{strVal}</span>
                                </div>
                              ) : (
                                <span className={typeof val === 'number' ? 'font-mono text-[#183928]' : ''}>
                                  {strVal}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Table Schema & Column Browser */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e8e4] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5ebe7] pb-3">
              <div className="flex items-center gap-2">
                <Columns className="w-4 h-4 text-[#3d6b52]" />
                <h4 className="text-sm font-bold text-[#0f172a]">SQL Schema</h4>
              </div>
              <span className="text-[11px] font-mono text-[#6d7f73]">
                {schemaData?.totalRecords ?? 0} total records
              </span>
            </div>

            <div className="space-y-2">
              {(schemaData?.tables || []).map((t) => {
                const isSelected = selectedTable === t.name;
                return (
                  <div
                    key={t.name}
                    className={`rounded-xl border transition-all ${
                      isSelected ? 'border-[#3d6b52] bg-[#f5f8f6]' : 'border-[#e8eeea] bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTableSchema(t.name)}
                      className="w-full p-2.5 text-left flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Table className={`w-3.5 h-3.5 ${isSelected ? 'text-[#3d6b52]' : 'text-[#7e9185]'}`} />
                        <span className="font-mono text-xs font-bold text-[#0f172a]">{t.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#e4ece6] text-[#2c4e3b]">
                        {t.rowCount} {t.rowCount === 1 ? 'row' : 'rows'}
                      </span>
                    </button>

                    {isSelected && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#e2e8e4]/60 space-y-1.5">
                        <p className="text-[11px] text-[#6d7f73]">{t.description}</p>
                        <div className="space-y-1 pt-1 max-h-48 overflow-y-auto">
                          {t.columns.map((col) => (
                            <div key={col.name} className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-[#192b21] truncate">{col.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {col.isPrimary && (
                                  <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">
                                    PK
                                  </span>
                                )}
                                {col.isForeign && (
                                  <span className="text-[9px] px-1 rounded bg-blue-100 text-blue-800 font-bold">
                                    FK
                                  </span>
                                )}
                                <span className="text-[10px] text-[#718478]">{col.type}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-[#edf4ef] border border-[#dce7df] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3d6b52]" />
              <h5 className="text-xs font-bold text-[#1f3a2b]">Live Relational Sync</h5>
            </div>
            <p className="text-xs text-[#526b5c] leading-relaxed">
              Every proposal created, client onboarded, meeting scheduled, and invoice logged in Zendo 
              is automatically backed by this SQL relational schema with ACID consistency.
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
