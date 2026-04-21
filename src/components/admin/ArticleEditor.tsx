import { useState, useRef } from 'preact/hooks';
import { app } from '../../lib/firebase';
import { getFirestore, collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore(app);
const auth = getAuth(app);

interface ArticleContent {
  title: string;
  subtitle: string;
  body: string;
  ctaText: string;
  ctaLink: string;
}

interface ArticleData {
  id?: string;
  slug?: string;
  status?: string;
  ro?: ArticleContent;
  en?: ArticleContent;
  [key: string]: any;
}

const emptyContent: ArticleContent = { title: '', subtitle: '', body: '', ctaText: '', ctaLink: '' };

// ─── Formatting Toolbar ───
function FormatToolbar({ textareaRef }: { textareaRef: { current: HTMLTextAreaElement | null } }) {
  const wrap = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const replacement = `${before}${selected || 'text'}${after}`;
    ta.setRangeText(replacement, start, end, 'select');
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (!url) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end) || 'link text';
    ta.setRangeText(`<a href="${url}" target="_blank">${selected}</a>`, start, end, 'select');
    ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const btnClass = "px-2 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 rounded transition border border-gray-200";

  return (
    <div class="flex gap-1 mb-1.5 flex-wrap">
      <button type="button" onClick={() => wrap('<strong>', '</strong>')} class={btnClass} title="Bold">B</button>
      <button type="button" onClick={() => wrap('<em>', '</em>')} class={`${btnClass} italic`} title="Italic">I</button>
      <button type="button" onClick={() => wrap('<h3>', '</h3>')} class={btnClass} title="Heading">H3</button>
      <button type="button" onClick={() => wrap('<p>', '</p>')} class={btnClass} title="Paragraph">P</button>
      <button type="button" onClick={insertLink} class={btnClass} title="Link">Link</button>
      <button type="button" onClick={() => wrap('<ul>\n<li>', '</li>\n</ul>')} class={btnClass} title="List">List</button>
    </div>
  );
}

// ─── Language Column ───
function LangColumn({ label, content, onChange, previewMode }: {
  label: string;
  content: ArticleContent;
  onChange: (c: ArticleContent) => void;
  previewMode: boolean;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const update = (field: keyof ArticleContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div class="space-y-4">
      <h3 class="text-sm font-bold text-royal-blue uppercase tracking-wide border-b border-gray-200 pb-2">{label}</h3>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Title</label>
        <input type="text" value={content.title} onInput={(e) => update('title', (e.target as HTMLInputElement).value)}
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cta-teal transition" placeholder="Article title" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Subtitle</label>
        <input type="text" value={content.subtitle} onInput={(e) => update('subtitle', (e.target as HTMLInputElement).value)}
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cta-teal transition" placeholder="Short description" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-gray-500 mb-1">Body (HTML)</label>
        <FormatToolbar textareaRef={bodyRef} />
        {previewMode ? (
          <div class="border border-gray-200 rounded-xl p-4 min-h-[200px] text-sm prose prose-sm max-w-none
                       [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-royal-blue [&>h3]:mt-4 [&>h3]:mb-2
                       [&>p]:mb-3 [&>ul]:pl-5 [&>ul]:list-disc [&>a]:text-cta-teal"
            dangerouslySetInnerHTML={{ __html: content.body || '<p class="text-gray-400">No content yet</p>' }}
          />
        ) : (
          <textarea ref={bodyRef} value={content.body} onInput={(e) => update('body', (e.target as HTMLTextAreaElement).value)}
            rows={12} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cta-teal transition resize-y" placeholder="<p>Write your article content here...</p>" />
        )}
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">CTA Button Text (optional)</label>
          <input type="text" value={content.ctaText} onInput={(e) => update('ctaText', (e.target as HTMLInputElement).value)}
            class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cta-teal transition" placeholder="e.g. Contact us" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">CTA Button Link (optional)</label>
          <input type="text" value={content.ctaLink} onInput={(e) => update('ctaLink', (e.target as HTMLInputElement).value)}
            class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cta-teal transition" placeholder="e.g. /dev/ro/contact" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ───
export default function ArticleEditor({ article, onBack, onSaved }: {
  article?: ArticleData;
  onBack: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!article?.id;
  const [ro, setRo] = useState<ArticleContent>(article?.ro || { ...emptyContent });
  const [en, setEn] = useState<ArticleContent>(article?.en || { ...emptyContent });
  const [status, setStatus] = useState(article?.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = async () => {
    if (!ro.title && !en.title) {
      alert('Please enter a title in at least one language.');
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      const data = {
        ro,
        en,
        status,
        updatedAt: serverTimestamp(),
        ...(isEdit ? {} : {
          createdAt: serverTimestamp(),
          author: auth.currentUser?.email || 'unknown',
          slug: (ro.title || en.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        }),
      };

      if (isEdit && article?.id) {
        await updateDoc(doc(db, 'articles', article.id), data);
      } else {
        await addDoc(collection(db, 'articles'), data);
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onSaved();
      }, 1000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={onBack} class="flex items-center gap-2 text-sm text-gray-500 hover:text-royal-blue transition">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
          Back to articles
        </button>

        <div class="flex items-center gap-3">
          <button onClick={() => setPreviewMode(!previewMode)}
            class={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${previewMode ? 'bg-cta-teal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {previewMode ? 'Edit mode' : 'Preview'}
          </button>

          <select value={status} onChange={(e) => setStatus((e.target as HTMLSelectElement).value)}
            class="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cta-teal">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <button onClick={handleSave} disabled={saving}
            class="px-6 py-2 rounded-full text-sm font-bold bg-cta-teal hover:bg-warm-gold text-white transition duration-300 disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved!' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>

      {/* Two-column editor */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <LangColumn label="Romanian (RO)" content={ro} onChange={setRo} previewMode={previewMode} />
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <LangColumn label="English (EN)" content={en} onChange={setEn} previewMode={previewMode} />
        </div>
      </div>
    </div>
  );
}
