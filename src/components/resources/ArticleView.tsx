import { useState, useEffect } from 'preact/hooks';
import { app } from '../../lib/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const db = getFirestore(app);

interface ArticleContent {
  title: string;
  subtitle: string;
  body: string;
  ctaText: string;
  ctaLink: string;
}

interface ArticleData {
  id: string;
  status: string;
  createdAt: any;
  author: string;
  ro: ArticleContent;
  en: ArticleContent;
}

const formatDate = (ts: any) => {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function ArticleView({ locale, backUrl }: { locale: string; backUrl: string }) {
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    loadArticle(id);
  }, []);

  const loadArticle = async (id: string) => {
    try {
      const snap = await getDoc(doc(db, 'articles', id));
      if (!snap.exists() || snap.data().status !== 'published') {
        setNotFound(true);
      } else {
        setArticle({ id: snap.id, ...snap.data() } as ArticleData);
      }
    } catch (err) {
      console.error('Failed to load article:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div class="flex justify-center py-32">
        <div class="animate-spin w-10 h-10 border-4 border-cta-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div class="text-center py-32">
        <h2 class="text-3xl font-bold text-royal-blue mb-4">
          {locale === 'en' ? 'Article not found' : 'Articolul nu a fost gasit'}
        </h2>
        <p class="text-gray-500 mb-8">
          {locale === 'en' ? 'This article may have been removed or is no longer available.' : 'Acest articol a fost sters sau nu mai este disponibil.'}
        </p>
        <a href={backUrl} class="inline-flex items-center gap-2 py-3 px-8 rounded-full text-sm font-semibold bg-cta-teal hover:bg-warm-gold text-white shadow-xl transition duration-300">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
          {locale === 'en' ? 'Back to resources' : 'Inapoi la resurse'}
        </a>
      </div>
    );
  }

  const content = locale === 'en' ? (article.en?.title ? article.en : article.ro) : (article.ro?.title ? article.ro : article.en);

  return (
    <div>
      {/* Back link */}
      <a href={backUrl} class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-cta-teal transition mb-8">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
        {locale === 'en' ? 'Back to resources' : 'Inapoi la resurse'}
      </a>

      {/* Article header */}
      <div class="mb-10">
        <span class="text-sm text-gray-400 font-semibold">{formatDate(article.createdAt)}</span>
        <h1 class="text-4xl lg:text-5xl font-bold text-royal-blue mt-3 leading-tight">
          {content.title}
        </h1>
        {content.subtitle && (
          <p class="text-xl text-gray-600 mt-4 leading-relaxed">{content.subtitle}</p>
        )}
        <div class="w-20 h-1.5 bg-gradient-to-r from-cta-teal to-warm-gold rounded-full mt-6" />
      </div>

      {/* Article body */}
      <div
        class="prose prose-lg max-w-none text-gray-700 leading-relaxed
               [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-royal-blue [&>h2]:mt-10 [&>h2]:mb-4
               [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-royal-blue [&>h3]:mt-8 [&>h3]:mb-3
               [&>p]:mb-5 [&>p]:leading-relaxed
               [&>ul]:mb-5 [&>ul]:pl-6 [&>ul]:list-disc [&>ul>li]:mb-2
               [&>ol]:mb-5 [&>ol]:pl-6 [&>ol]:list-decimal [&>ol>li]:mb-2
               [&>strong]:font-bold [&>strong]:text-royal-blue
               [&>a]:text-cta-teal [&>a]:underline [&>a]:hover:text-warm-gold
               [&>blockquote]:border-l-4 [&>blockquote]:border-cta-teal [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-gray-600 [&>blockquote]:my-6"
        dangerouslySetInnerHTML={{ __html: content.body || '' }}
      />

      {/* Optional CTA */}
      {content.ctaText && content.ctaLink && (
        <div class="mt-12 pt-8 border-t border-gray-200">
          <a href={content.ctaLink} class="inline-flex items-center gap-2 py-4 px-10 rounded-full text-sm font-semibold bg-cta-teal hover:bg-warm-gold text-white shadow-xl hover:scale-105 transition ease-in-out duration-300">
            {content.ctaText}
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
