import { useState, useEffect } from 'preact/hooks';
import { app } from '../../lib/firebase';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import ArticleEditor from './ArticleEditor';
import {
  getFirestore, collection, query, where, orderBy, limit, startAfter,
  getDocs, updateDoc, doc, serverTimestamp,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

const auth = getAuth(app);
const db = getFirestore(app);

const PAGE_SIZE = 20;

// ─── Types ───
type Tab = 'dashboard' | 'compatibility' | 'contact' | 'articles';

interface Submission {
  id: string;
  [key: string]: any;
}

// ─── Status colors ───
const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-purple-100 text-purple-800',
  qualified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-600',
  read: 'bg-sky-100 text-sky-800',
  replied: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
};

const formatDate = (ts: any) => {
  if (!ts?.seconds) return '-';
  return new Date(ts.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Login Form ───
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-royal-blue via-royal-blue-2 to-royal-blue px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img src="/img/capital_hub_logo.png" alt="Logo" class="w-16 h-16 mx-auto mb-4" />
          <h1 class="text-2xl font-bold text-white">Capital Hub Admin</h1>
          <p class="text-white/60 text-sm mt-1">Sign in to manage submissions</p>
        </div>
        <form onSubmit={handleSubmit} class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 space-y-5">
          {error && <div class="bg-red-500/20 text-red-200 text-sm py-3 px-4 rounded-xl text-center">{error}</div>}
          <div>
            <label class="block text-white/80 text-sm font-semibold mb-2">Email</label>
            <input type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} required
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-cta-teal transition" placeholder="admin@capitalhub.ro" />
          </div>
          <div>
            <label class="block text-white/80 text-sm font-semibold mb-2">Password</label>
            <input type="password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} required
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-cta-teal transition" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            class="w-full bg-cta-teal hover:bg-warm-gold text-white py-3 rounded-full text-sm font-bold transition duration-300 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ───
function DashboardView() {
  const [recentCompat, setRecentCompat] = useState<Submission[]>([]);
  const [recentContact, setRecentContact] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setError('');
    try {
      // Simple queries without composite indexes — just order by createdAt
      const [compatSnap, contactSnap] = await Promise.all([
        getDocs(query(collection(db, 'compatibility_submissions'), orderBy('createdAt', 'desc'), limit(10))),
        getDocs(query(collection(db, 'contact_submissions'), orderBy('createdAt', 'desc'), limit(10))),
      ]);
      setRecentCompat(compatSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRecentContact(contactSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(`Failed to load data: ${err.message || err.code || 'Unknown error'}. Check that Firestore rules are deployed and your account is authorized.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div class="flex items-center justify-center h-64"><div class="animate-spin w-8 h-8 border-4 border-cta-teal border-t-transparent rounded-full" /></div>;

  const compatNew = recentCompat.filter(s => s.status === 'new').length;
  const contactNew = recentContact.filter(s => s.status === 'new').length;

  return (
    <div class="space-y-8">
      {error && <div class="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-2xl">{error}</div>}

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="New Compatibility" value={compatNew} color="blue" />
        <StatCard label="Total Compatibility" value={recentCompat.length} color="teal" />
        <StatCard label="New Contact" value={contactNew} color="gold" />
        <StatCard label="Total Contact" value={recentContact.length} color="gray" />
      </div>

      <div>
        <h3 class="text-lg font-bold text-royal-blue mb-3">Recent Compatibility Submissions</h3>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {recentCompat.length === 0 ? (
            <p class="p-6 text-gray-500 text-sm text-center">No submissions yet</p>
          ) : (
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-600 text-xs uppercase"><tr>
                <th class="px-4 py-3 text-left">Date</th><th class="px-4 py-3 text-left">Company</th><th class="px-4 py-3 text-left">Contact</th><th class="px-4 py-3 text-left">Status</th>
              </tr></thead>
              <tbody>
                {recentCompat.map(s => (
                  <tr key={s.id} class="border-t border-gray-50 hover:bg-gray-50/50">
                    <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td class="px-4 py-3 font-medium text-royal-blue">{s.companyName}</td>
                    <td class="px-4 py-3 text-gray-600">{s.fullName}</td>
                    <td class="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h3 class="text-lg font-bold text-royal-blue mb-3">Recent Contact Submissions</h3>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {recentContact.length === 0 ? (
            <p class="p-6 text-gray-500 text-sm text-center">No submissions yet</p>
          ) : (
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-600 text-xs uppercase"><tr>
                <th class="px-4 py-3 text-left">Date</th><th class="px-4 py-3 text-left">Name</th><th class="px-4 py-3 text-left">Email</th><th class="px-4 py-3 text-left">Status</th>
              </tr></thead>
              <tbody>
                {recentContact.map(s => (
                  <tr key={s.id} class="border-t border-gray-50 hover:bg-gray-50/50">
                    <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td class="px-4 py-3 font-medium text-royal-blue">{s.name}</td>
                    <td class="px-4 py-3 text-gray-600">{s.email}</td>
                    <td class="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const bg: Record<string, string> = { blue: 'bg-blue-50 border-blue-100', teal: 'bg-emerald-50 border-emerald-100', gold: 'bg-amber-50 border-amber-100', gray: 'bg-gray-50 border-gray-100' };
  const text: Record<string, string> = { blue: 'text-blue-700', teal: 'text-emerald-700', gold: 'text-amber-700', gray: 'text-gray-700' };
  return (
    <div class={`rounded-2xl p-5 border ${bg[color] || bg.gray}`}>
      <p class={`text-3xl font-bold ${text[color] || text.gray}`}>{value}</p>
      <p class="text-xs text-gray-500 font-semibold mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span class={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

// ─── XLSX Export ───
function exportToXlsx(items: Submission[], filename: string) {
  const exportData = items.map(item => {
    const row: Record<string, any> = {};
    for (const [key, val] of Object.entries(item)) {
      if (key === 'id') continue;
      if (key === 'createdAt' || key === 'updatedAt') {
        row[key] = val?.seconds ? new Date(val.seconds * 1000).toISOString() : '';
      } else {
        row[key] = val ?? '';
      }
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Submissions');

  // Auto-size columns
  const colWidths = Object.keys(exportData[0] || {}).map(key => ({
    wch: Math.max(key.length, ...exportData.map(r => String(r[key] || '').length)).toString().length + 4
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── List View ───
function ListView({ collectionName, columns, onSelect }: {
  collectionName: string;
  columns: { key: string; label: string }[];
  onSelect: (item: Submission) => void;
}) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const statuses = collectionName === 'compatibility_submissions'
    ? ['all', 'new', 'reviewing', 'contacted', 'qualified', 'rejected', 'archived']
    : collectionName === 'articles'
    ? ['all', 'draft', 'published', 'archived']
    : ['all', 'new', 'read', 'replied', 'archived'];

  useEffect(() => { loadItems(true); }, [filterStatus]);

  const loadItems = async (reset = false) => {
    setLoading(true);
    setError('');
    try {
      const constraints: any[] = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)];
      if (filterStatus !== 'all') constraints.unshift(where('status', '==', filterStatus));
      if (!reset && lastDoc) constraints.push(startAfter(lastDoc));

      const snap = await getDocs(query(collection(db, collectionName), ...constraints));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (reset) {
        setItems(docs);
      } else {
        setItems(prev => [...prev, ...docs]);
      }
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err: any) {
      console.error('Load error:', err);
      setError(`Failed to load: ${err.message || err.code}. If filtering, the composite index may still be building — try "All" filter.`);
    } finally {
      setLoading(false);
    }
  };

  // Export all visible items
  const handleExport = () => {
    if (items.length === 0) return;
    const name = collectionName === 'compatibility_submissions' ? 'compatibility' : 'contact';
    exportToXlsx(items, `capitalhub_${name}`);
  };

  // Load ALL items for full export
  const handleExportAll = async () => {
    try {
      const snap = await getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc')));
      const allItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const name = collectionName === 'compatibility_submissions' ? 'compatibility' : 'contact';
      exportToXlsx(allItems, `capitalhub_${name}_all`);
    } catch (err: any) {
      console.error('Export all error:', err);
    }
  };

  return (
    <div>
      {error && <div class="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-2xl mb-4">{error}</div>}

      {/* Filter + Export bar */}
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              class={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${s === filterStatus ? 'bg-royal-blue text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div class="flex gap-2">
          <button onClick={handleExport} disabled={items.length === 0}
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-40">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Page (.xlsx)
          </button>
          <button onClick={handleExportAll}
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export All (.xlsx)
          </button>
        </div>
      </div>

      {/* Table */}
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th class="px-4 py-3 text-left">Date</th>
              {columns.map(c => <th key={c.key} class="px-4 py-3 text-left">{c.label}</th>)}
              <th class="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => onSelect(item)} class="border-t border-gray-50 hover:bg-blue-50/30 cursor-pointer transition">
                <td class="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                {columns.map(c => (
                  <td key={c.key} class="px-4 py-3 text-gray-700 max-w-[200px] truncate">{c.key.includes('.') ? c.key.split('.').reduce((o: any, k: string) => o?.[k], item) || '-' : item[c.key] || '-'}</td>
                ))}
                <td class="px-4 py-3"><StatusBadge status={item.status} /></td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td colSpan={columns.length + 2} class="px-4 py-8 text-center text-gray-400">No submissions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <div class="flex justify-center py-4"><div class="animate-spin w-6 h-6 border-4 border-cta-teal border-t-transparent rounded-full" /></div>}
      {hasMore && !loading && (
        <div class="text-center mt-4">
          <button onClick={() => loadItems(false)} class="px-6 py-2 text-sm font-semibold text-cta-teal hover:text-warm-gold transition">Load more</button>
        </div>
      )}
    </div>
  );
}

// ─── Detail View ───
function DetailView({ item, collectionName, onBack }: { item: Submission; collectionName: string; onBack: () => void }) {
  const [status, setStatus] = useState(item.status || 'new');
  const [notes, setNotes] = useState(item.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const statuses = collectionName === 'compatibility_submissions'
    ? ['new', 'reviewing', 'contacted', 'qualified', 'rejected', 'archived']
    : ['new', 'read', 'replied', 'archived'];

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, collectionName, item.id), { status, notes, updatedAt: serverTimestamp() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const excludeKeys = ['id', 'status', 'notes', 'updatedAt', 'source', 'consent'];

  return (
    <div>
      <button onClick={onBack} class="flex items-center gap-2 text-sm text-gray-500 hover:text-royal-blue transition mb-6">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
        Back to list
      </button>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-royal-blue mb-4">Submission Details</h3>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(item).filter(([k]) => !excludeKeys.includes(k)).map(([key, val]) => (
              <div key={key} class={key === 'mainProblem' || key === 'message' ? 'md:col-span-2' : ''}>
                <dt class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{key}</dt>
                <dd class="text-sm text-gray-800">{key === 'createdAt' ? formatDate(val) : String(val || '-')}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h3 class="text-lg font-bold text-royal-blue mb-2">Manage</h3>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase mb-2">Status</label>
            <select value={status} onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cta-teal transition">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase mb-2">Internal Notes</label>
            <textarea value={notes} onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)} rows={5}
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cta-teal transition resize-none" placeholder="Add notes..." />
          </div>
          <button onClick={handleSave} disabled={saving}
            class="w-full bg-cta-teal hover:bg-warm-gold text-white py-3 rounded-full text-sm font-bold transition duration-300 disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Shell ───
function AdminShell({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedItem, setSelectedItem] = useState<Submission | null>(null);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [showArticleEditor, setShowArticleEditor] = useState(false);
  const [articleListKey, setArticleListKey] = useState(0);

  const handleSelect = (item: Submission, col: string) => {
    setSelectedItem(item);
    setSelectedCollection(col);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'compatibility', label: 'Compatibility' },
    { key: 'contact', label: 'Contact' },
    { key: 'articles', label: 'Articles' },
  ];

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        <div class="flex items-center gap-3">
          <img src="/img/capital_hub_logo.png" alt="Logo" class="w-8 h-8" />
          <span class="font-bold text-royal-blue text-sm">Capital Hub Admin</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-xs text-gray-500">{user.email}</span>
          <button onClick={() => signOut(auth)} class="text-xs text-red-500 hover:text-red-700 font-semibold transition">Sign Out</button>
        </div>
      </div>

      <div class="bg-white border-b border-gray-100 px-6">
        <div class="flex gap-1 max-w-7xl mx-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedItem(null); setShowArticleEditor(false); setEditingArticle(null); }}
              class={`px-5 py-3 text-sm font-semibold border-b-2 transition ${tab === t.key ? 'border-cta-teal text-cta-teal' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 py-8">
        {tab === 'articles' ? (
          showArticleEditor ? (
            <ArticleEditor
              article={editingArticle || undefined}
              onBack={() => { setShowArticleEditor(false); setEditingArticle(null); }}
              onSaved={() => { setShowArticleEditor(false); setEditingArticle(null); setArticleListKey(k => k + 1); }}
            />
          ) : (
            <div>
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-bold text-royal-blue">Articles</h2>
                <button onClick={() => { setEditingArticle(null); setShowArticleEditor(true); }}
                  class="px-5 py-2 rounded-full text-sm font-bold bg-cta-teal hover:bg-warm-gold text-white transition duration-300">
                  + New Article
                </button>
              </div>
              <ListView
                key={articleListKey}
                collectionName="articles"
                columns={[{ key: 'ro.title', label: 'Title (RO)' }, { key: 'status', label: 'Status' }]}
                onSelect={(item) => { setEditingArticle(item); setShowArticleEditor(true); }}
              />
            </div>
          )
        ) : selectedItem ? (
          <DetailView item={selectedItem} collectionName={selectedCollection} onBack={() => setSelectedItem(null)} />
        ) : tab === 'dashboard' ? (
          <DashboardView />
        ) : tab === 'compatibility' ? (
          <ListView
            collectionName="compatibility_submissions"
            columns={[{ key: 'companyName', label: 'Company' }, { key: 'fullName', label: 'Contact' }, { key: 'email', label: 'Email' }, { key: 'urgency', label: 'Urgency' }]}
            onSelect={(item) => handleSelect(item, 'compatibility_submissions')}
          />
        ) : (
          <ListView
            collectionName="contact_submissions"
            columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }]}
            onSelect={(item) => handleSelect(item, 'contact_submissions')}
          />
        )}
      </div>
    </div>
  );
}

// ─── Root App ───
export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="animate-spin w-10 h-10 border-4 border-cta-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  return user ? <AdminShell user={user} /> : <LoginForm />;
}
