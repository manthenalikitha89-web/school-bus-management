import { useEffect, useMemo, useState } from "react";
import { BusFront, Users, UserRound, MapPinned, LayoutDashboard, Search, Plus, Pencil, Trash2, X, Menu, Clock3, ArrowUpRight, ChevronDown, Route } from "lucide-react";

const sections = {
  dashboard: { label: "Overview", singular: "", icon: LayoutDashboard },
  students: { label: "Students", singular: "Student", icon: Users, fields: [["name", "Student name", "text"], ["grade", "Grade / class", "text"], ["guardian", "Guardian contact", "tel"], ["route", "Assigned route", "text"]] },
  buses: { label: "Buses", singular: "Bus", icon: BusFront, fields: [["busNumber", "Bus number", "text"], ["registration", "Registration number", "text"], ["capacity", "Capacity", "number"], ["status", "Status", "select", ["Active", "Maintenance"]]] },
  drivers: { label: "Drivers", singular: "Driver", icon: UserRound, fields: [["name", "Driver name", "text"], ["phone", "Phone number", "tel"], ["license", "License number", "text"]] },
  routes: { label: "Routes", singular: "Route", icon: MapPinned, fields: [["name", "Route name", "text"], ["busNumber", "Bus number", "text"], ["driver", "Driver name", "text"], ["stops", "Stops (separate with commas)", "text"], ["pickupTime", "First pickup time", "time"]] }
};
const empty = { students: [], buses: [], drivers: [], routes: [] };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const entries = await Promise.all(Object.keys(empty).map(async (key) => {
        const response = await fetch(`/api/${key}`);
        if (!response.ok) throw new Error((await response.json()).message || "Could not load records");
        return [key, await response.json()];
      }));
      setData(Object.fromEntries(entries));
    } catch (e) { setError(e.message || "Could not connect to the API. Start the server and MongoDB, then refresh."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const current = sections[page];
  const records = data[page] || [];
  const filtered = useMemo(() => records.filter((item) => Object.values(item).some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase()))), [records, query]);
  const totalStops = data.routes.reduce((sum, route) => sum + (route.stops ? route.stops.split(",").filter(Boolean).length : 0), 0);

  function openForm(record = null) {
    setModal(record); setForm(record ? { ...record } : Object.fromEntries(current.fields.map(([key]) => [key, ""])));
  }
  async function saveRecord(event) {
    event.preventDefault(); setSaving(true);
    try {
      const url = modal?._id ? `/api/${page}/${modal._id}` : `/api/${page}`;
      const response = await fetch(url, { method: modal?._id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || "Could not save record");
      setModal(null); await loadData();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }
  async function deleteRecord(id) {
    if (!window.confirm("Delete this record?")) return;
    try { const response = await fetch(`/api/${page}/${id}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok) throw new Error(result.message); await loadData(); }
    catch (e) { setError(e.message); }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><BusFront size={21}/></div><div><strong>RouteWise</strong><span>School transport</span></div><button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{Object.entries(sections).map(([key, item]) => { const Icon = item.icon; return <button key={key} className={`nav-item ${page === key ? "active" : ""}`} onClick={() => { setPage(key); setQuery(""); setMobileNav(false); }}><Icon size={18}/><span>{item.label}</span>{key !== "dashboard" && <span className="nav-count">{data[key].length}</span>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Route size={17}/></div><strong>Transport, organized.</strong><p>Keep every school journey on track.</p></div><div className="profile"><div className="avatar">AD</div><div><strong>School Admin</strong><span>Administrator</span></div><ChevronDown size={16}/></div></div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{current.label}</b></div><div className="topbar-right"><span className="today"><span className="online-dot"/> Transport system</span><div className="avatar small">AD</div></div></header>
      <div className="content">
        {error && <div className="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={17}/></button></div>}
        {page === "dashboard" ? <>
          <section className="welcome-row"><div><div className="eyebrow">SCHOOL TRANSPORT OVERVIEW</div><h1>Good morning, Admin <span>✦</span></h1><p>Here’s what’s happening across your school transport today.</p></div><div className="date-chip"><Clock3 size={16}/> Live overview</div></section>
          <section className="stat-grid">{[["Students", data.students.length, Users, "students registered", "blue"], ["Active buses", data.buses.filter(b => b.status !== "Maintenance").length, BusFront, "ready for routes", "green"], ["Drivers", data.drivers.length, UserRound, "in your directory", "orange"], ["Routes", data.routes.length, MapPinned, `${totalStops} stops configured`, "purple"]].map(([label, value, Icon, note, color]) => <div className="stat-card" key={label}><div className={`stat-icon ${color}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note"><span className="note-dot"/>{note}</div></div>)}</section>
          <section className="dashboard-grid"><div className="panel route-panel"><div className="panel-heading"><div><h2>Today’s routes</h2><p>Route and pickup schedule</p></div><button className="text-button" onClick={() => setPage("routes")}>View all <ArrowUpRight size={15}/></button></div>{data.routes.length ? <div className="route-list">{data.routes.slice(0, 5).map((route, i) => <div className="route-row" key={route._id}><div className={`route-symbol route-${i % 4}`}><MapPinned size={17}/></div><div className="route-info"><strong>{route.name}</strong><span>{(route.stops || "No stops added").split(",").map(s => s.trim()).filter(Boolean).join(" · ")}</span></div><div className="route-time">{route.pickupTime || "—"}</div><span className="status-pill">Scheduled</span></div>)}</div> : <EmptyState loading={loading} title="No routes yet" text="Add your first route to see the schedule here." action={() => setPage("routes")}/>}</div>
          <div className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Common tasks, one click away</p></div></div><div className="quick-actions">{[["students", "Add a student", "Register a student and assign a route", Users, "blue"], ["buses", "Add a bus", "Update your school bus directory", BusFront, "green"], ["routes", "Create a route", "Set stops and pickup times", MapPinned, "purple"]].map(([key, title, desc, Icon, color]) => <button className="quick-action" key={key} onClick={() => { setPage(key); setForm(Object.fromEntries(sections[key].fields.map(([field]) => [field, ""]))); setModal({}); }}><span className={`quick-icon ${color}`}><Icon size={17}/></span><span className="quick-copy"><b>{title}</b><small>{desc}</small></span><Plus size={17} className="quick-plus"/></button>)}</div></div></section>
          <div className="footer-note">RouteWise <span>·</span> School transport management</div>
        </> : <>
          <section className="page-heading"><div><div className="eyebrow">DIRECTORY</div><h1>{current.label}</h1><p>Manage your school’s {current.label.toLowerCase()} and keep records up to date.</p></div><button className="primary-button" onClick={() => openForm()}><Plus size={17}/> Add {current.singular}</button></section>
          <section className="panel table-panel"><div className="table-toolbar"><div className="record-count"><strong>{records.length}</strong> {current.label.toLowerCase()} <span>·</span> all records</div><label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${current.label.toLowerCase()}...`}/></label></div>
            {loading ? <div className="loading-state">Loading records…</div> : filtered.length === 0 ? <EmptyState title={query ? "No matching records" : `No ${current.label.toLowerCase()} yet`} text={query ? "Try another search term." : `Add your first ${current.singular.toLowerCase()} to get started.`} action={query ? null : () => openForm()}/> : <div className="table-scroll"><table><thead><tr>{current.fields.map(([key, label]) => <th key={key}>{label.replace(" (separate with commas)", "")}</th>)}<th className="actions-head">ACTIONS</th></tr></thead><tbody>{filtered.map(record => <tr key={record._id}>{current.fields.map(([key]) => <td key={key}>{key === "status" ? <span className={`badge ${record[key] === "Maintenance" ? "muted" : "good"}`}>{record[key] || "Active"}</span> : key === "stops" ? <span className="stops-cell">{record[key]}</span> : record[key] || <span className="dash">—</span>}</td>)}<td><div className="row-actions"><button onClick={() => openForm(record)} title="Edit"><Pencil size={16}/></button><button className="delete-action" onClick={() => deleteRecord(record._id)} title="Delete"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}
          </section><div className="footer-note">RouteWise <span>·</span> School transport management</div>
        </>}
      </div>
    </main>
    {modal !== null && page !== "dashboard" && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}><form className="modal" onSubmit={saveRecord}><div className="modal-head"><div><div className="eyebrow">{modal?._id ? "UPDATE RECORD" : "NEW RECORD"}</div><h2>{modal?._id ? `Edit ${current.singular}` : `Add ${current.singular}`}</h2></div><button type="button" className="icon-button" onClick={() => setModal(null)} aria-label="Close"><X size={19}/></button></div><div className="form-fields">{current.fields.map(([key, label, type, options]) => <label className="form-field" key={key}><span>{label} {key !== "stops" && <i>*</i>}</span>{type === "select" ? <select value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })} required><option value="">Choose status</option>{options.map(o => <option key={o}>{o}</option>)}</select> : <input type={type} value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key !== "stops"} min={type === "number" ? "1" : undefined} placeholder={key === "stops" ? "e.g. Main Road, City Park" : `Enter ${label.toLowerCase()}`}/>}</label>)}</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving…" : modal?._id ? "Save changes" : `Add ${current.singular}`}</button></div></form></div>}
  </div>;
}

function EmptyState({ title, text, action, loading }) { return <div className="empty-state"><div className="empty-icon"><BusFront size={22}/></div><strong>{loading ? "Connecting to your database" : title}</strong><p>{loading ? "Your records will appear once the API is ready." : text}</p>{action && !loading && <button className="primary-button" onClick={action}><Plus size={16}/> Add record</button>}</div>; }
