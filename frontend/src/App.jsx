import { useState, useEffect, useCallback } from "react";

const API = "/api/v1";

const api = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const PRIORITY_COLORS = {
  high: { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  medium: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  low: { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
};
const STATUS_LABELS = { todo: "To Do", in_progress: "In Progress", done: "Done" };
const STATUS_COLORS = {
  todo: { bg: "#F1F5F9", text: "#475569" },
  in_progress: { bg: "#EFF6FF", text: "#1D4ED8" },
  done: { bg: "#F0FDF4", text: "#15803D" },
};

function Badge({ type, value }) {
  const c = type === "priority" ? PRIORITY_COLORS[value] : STATUS_COLORS[value];
  return (
    <span style={{
      background: c?.bg, color: c?.text, border: `1px solid ${c?.border || c?.bg}`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.03em", textTransform: type === "status" ? "none" : "capitalize"
    }}>
      {type === "status" ? STATUS_LABELS[value] : value}
    </span>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = {
    success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
    error: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" },
    info: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 1000,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 500,
      boxShadow: "0 4px 24px rgba(0,0,0,0.10)", maxWidth: 360,
      display: "flex", alignItems: "center", gap: 10, animation: "slideIn 0.25s ease"
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden"
      }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#0F172A" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94A3B8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569", marginBottom: 6 }}>{label}</label>}
      {props.as === "textarea" ? (
        <textarea {...props} as={undefined} style={{
          width: "100%", padding: "9px 12px", border: `1px solid ${error ? "#FECACA" : "#E2E8F0"}`,
          borderRadius: 8, fontSize: 14, color: "#0F172A", resize: "vertical", minHeight: 80,
          outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.5,
          background: error ? "#FEF2F2" : "#fff"
        }} />
      ) : props.as === "select" ? (
        <select {...props} as={undefined} style={{
          width: "100%", padding: "9px 12px", border: `1px solid ${error ? "#FECACA" : "#E2E8F0"}`,
          borderRadius: 8, fontSize: 14, color: "#0F172A", outline: "none",
          background: error ? "#FEF2F2" : "#fff", cursor: "pointer", boxSizing: "border-box"
        }} />
      ) : (
        <input {...props} style={{
          width: "100%", padding: "9px 12px", border: `1px solid ${error ? "#FECACA" : "#E2E8F0"}`,
          borderRadius: 8, fontSize: 14, color: "#0F172A", outline: "none",
          background: error ? "#FEF2F2" : "#fff", boxSizing: "border-box"
        }} />
      )}
      {error && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#EF4444" }}>{error}</p>}
    </div>
  );
}

function Btn({ variant = "primary", children, loading, ...props }) {
  const styles = {
    primary: { background: "#3B82F6", color: "#fff", border: "1px solid #3B82F6" },
    secondary: { background: "#F8FAFC", color: "#475569", border: "1px solid #E2E8F0" },
    danger: { background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" },
    ghost: { background: "transparent", color: "#64748B", border: "1px solid transparent" },
  };
  return (
    <button {...props} disabled={loading || props.disabled} style={{
      ...styles[variant], borderRadius: 8, padding: "9px 18px", fontSize: 14,
      fontWeight: 500, cursor: loading ? "wait" : "pointer", display: "inline-flex",
      alignItems: "center", gap: 6, transition: "all 0.15s", opacity: (loading || props.disabled) ? 0.6 : 1,
      ...(props.style || {})
    }}>
      {loading ? "…" : children}
    </button>
  );
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (tab === "register" && form.name.trim().length < 2) e.name = "At least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (form.password.length < 8) e.password = "At least 8 characters";
    if (tab === "register" && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = "Must include uppercase, lowercase & number";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setServerError(""); setErrors({});
    try {
      const data = await api(`/auth/${tab}`, {
        method: "POST",
        body: JSON.stringify(tab === "login" ? { email: form.email, password: form.password } : form),
      });
      onAuth(data.token, data.data.user);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0FDF4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.35s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: "#3B82F6", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>TaskFlow</h1>
          <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Manage tasks with role-based access</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setErrors({}); setServerError(""); }} style={{
                flex: 1, padding: "14px 0", fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: tab === t ? "#3B82F6" : "transparent",
                color: tab === t ? "#fff" : "#94A3B8", border: "none", transition: "all 0.2s",
                textTransform: "capitalize"
              }}>{t}</button>
            ))}
          </div>

          <form onSubmit={submit} style={{ padding: 24 }}>
            {tab === "register" && (
              <Input label="Full name" type="text" placeholder="Jane Doe" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} />
            )}
            <Input label="Email address" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} error={errors.email} />
            <Input label="Password" type="password" placeholder={tab === "register" ? "Min 8 chars with A–z & 0–9" : "Enter password"} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} error={errors.password} />

            {serverError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#EF4444", marginBottom: 16 }}>
                {serverError}
              </div>
            )}

            <Btn type="submit" loading={loading} style={{ width: "100%", justifyContent: "center" }}>
              {tab === "login" ? "Sign in" : "Create account"}
            </Btn>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 20 }}>
          JWT-secured · bcrypt hashed · Role-based access
        </p>
      </div>
    </div>
  );
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────
function TaskModal({ task, token, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setLoading(true); setError("");
    try {
      const body = { ...form, dueDate: form.dueDate || undefined };
      if (task) {
        const data = await api(`/tasks/${task._id}`, { method: "PATCH", body: JSON.stringify(body) }, token);
        onSave(data.data.task, "updated");
      } else {
        const data = await api("/tasks", { method: "POST", body: JSON.stringify(body) }, token);
        onSave(data.data.task, "created");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={submit}>
        <Input label="Title *" type="text" placeholder="What needs to be done?" value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <Input label="Description" as="textarea" placeholder="Optional details…" value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Status" as="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </Input>
          <Input label="Priority" as="select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Input>
        </div>
        <Input label="Due date" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
        {error && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" loading={loading}>{task ? "Save changes" : "Create task"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const overdue = task.dueDate && task.status !== "done" && new Date() > new Date(task.dueDate);
  return (
    <div style={{
      background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "16px 18px",
      transition: "box-shadow 0.15s", cursor: "default",
      borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]?.border || "#E2E8F0"}`
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#0F172A", lineHeight: 1.4, flex: 1,
          textDecoration: task.status === "done" ? "line-through" : "none", opacity: task.status === "done" ? 0.6 : 1 }}>
          {task.title}
        </p>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={() => onEdit(task)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16, padding: "2px 4px", borderRadius: 4 }} title="Edit">✏️</button>
          <button onClick={() => onDelete(task._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 16, padding: "2px 4px", borderRadius: 4 }} title="Delete">🗑️</button>
        </div>
      </div>

      {task.description && (
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#64748B", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {task.description}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <Badge type="status" value={task.status} />
        <Badge type="priority" value={task.priority} />
        {task.dueDate && (
          <span style={{ fontSize: 11, color: overdue ? "#EF4444" : "#94A3B8", fontWeight: overdue ? 600 : 400 }}>
            {overdue ? "⚠ Overdue" : "📅"} {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.status !== "done" && (
        <button onClick={() => onStatusChange(task._id, task.status === "todo" ? "in_progress" : "done")}
          style={{ marginTop: 10, fontSize: 12, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>
          → Mark as {task.status === "todo" ? "in progress" : "done"}
        </button>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ token, user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: "", priority: "", search: "", page: 1 });
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.search) params.set("search", filters.search);
      params.set("page", filters.page);
      params.set("limit", 10);
      const data = await api(`/tasks?${params}`, {}, token);
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, filters, showToast]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSave = (savedTask, action) => {
    setModal(null); setEditTask(null);
    fetchTasks();
    showToast(`Task ${action} successfully`);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api(`/tasks/${id}`, { method: "DELETE" }, token);
      fetchTasks();
      showToast("Task deleted");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) }, token);
      fetchTasks();
      showToast(`Moved to ${STATUS_LABELS[newStatus]}`);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const stats = {
    total: pagination.total || 0,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#3B82F6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#0F172A" }}>TaskFlow</span>
            {user.role === "admin" && (
              <span style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>ADMIN</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748B" }}>👤 {user.name}</span>
            <Btn variant="secondary" onClick={onLogout} style={{ padding: "6px 14px", fontSize: 13 }}>Sign out</Btn>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total tasks", value: pagination.total || 0, color: "#3B82F6" },
            { label: "To do", value: tasks.filter(t => t.status === "todo").length, color: "#F59E0B" },
            { label: "In progress", value: tasks.filter(t => t.status === "in_progress").length, color: "#6366F1" },
            { label: "Done", value: tasks.filter(t => t.status === "done").length, color: "#10B981" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "14px 18px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input type="search" placeholder="🔍 Search tasks…" value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
              style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, flex: "1 1 200px", outline: "none" }} />
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}
              style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#475569", outline: "none" }}>
              <option value="">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value, page: 1 }))}
              style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#475569", outline: "none" }}>
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Btn onClick={() => setModal("create")} style={{ marginLeft: "auto", padding: "8px 18px" }}>
              + New task
            </Btn>
          </div>
        </div>

        {/* Task grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94A3B8", fontSize: 15 }}>Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ color: "#64748B", fontSize: 15, margin: 0 }}>No tasks yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {tasks.map(task => (
              <TaskCard key={task._id} task={task}
                onEdit={(t) => { setEditTask(t); setModal("edit"); }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <Btn variant="secondary" disabled={filters.page <= 1}
              onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} style={{ padding: "6px 14px" }}>
              ← Prev
            </Btn>
            <span style={{ padding: "6px 14px", fontSize: 14, color: "#64748B" }}>
              Page {filters.page} of {pagination.totalPages}
            </span>
            <Btn variant="secondary" disabled={filters.page >= pagination.totalPages}
              onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} style={{ padding: "6px 14px" }}>
              Next →
            </Btn>
          </div>
        )}

        {/* API Info panel */}
        <div style={{ marginTop: 32, background: "#0F172A", borderRadius: 12, padding: "20px 24px", color: "#E2E8F0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Connected to</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {[
              ["POST", "/auth/register", "Public"],
              ["POST", "/auth/login", "Public"],
              ["GET", "/auth/me", "JWT"],
              ["GET", "/tasks", "JWT"],
              ["POST", "/tasks", "JWT"],
              ["PATCH", "/tasks/:id", "JWT"],
              ["DELETE", "/tasks/:id", "JWT"],
              user.role === "admin" && ["GET", "/tasks/stats", "Admin"],
              user.role === "admin" && ["GET", "/users", "Admin"],
            ].filter(Boolean).map(([method, path, auth]) => (
              <div key={path} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ background: method === "GET" ? "#1e3a5f" : method === "POST" ? "#1a3a2a" : method === "PATCH" ? "#3a2a00" : "#3a1a1a", color: method === "GET" ? "#60A5FA" : method === "POST" ? "#34D399" : method === "PATCH" ? "#FBBF24" : "#F87171", borderRadius: 4, padding: "1px 6px", fontWeight: 700, minWidth: 44, textAlign: "center" }}>{method}</span>
                <code style={{ color: "#CBD5E1", fontSize: 11 }}>{path}</code>
                <span style={{ color: "#475569", fontSize: 10 }}>{auth}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(modal === "create" || modal === "edit") && (
        <TaskModal task={modal === "edit" ? editTask : null} token={token}
          onSave={handleSave} onClose={() => { setModal(null); setEditTask(null); }} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = sessionStorage.getItem("tf_token");
    const user = sessionStorage.getItem("tf_user");
    return token ? { token, user: JSON.parse(user) } : null;
  });

  const handleAuth = (token, user) => {
    sessionStorage.setItem("tf_token", token);
    sessionStorage.setItem("tf_user", JSON.stringify(user));
    setAuth({ token, user });
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setAuth(null);
  };

  if (!auth) return <AuthPage onAuth={handleAuth} />;
  return <Dashboard token={auth.token} user={auth.user} onLogout={handleLogout} />;
}
