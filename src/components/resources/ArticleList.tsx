import { useState, useEffect } from 'preact/hooks';
import { app } from '../../lib/firebase';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

const db = getFirestore(app);

interface Article {
  id: string;
  status: string;
  createdAt: any;
  ro: { title: string; subtitle: string };
  en: { title: string; subtitle: string };
}

const formatDate = (ts: any) => {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function ArticleList({ locale, basePath }: { locale: string; basePath: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'articles'), where('status', '==', 'published'), orderBy('createdAt', 'desc'))
      );
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
    } catch (err) {
      // Fallback: try without composite index
      try {
        const snap = await getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc')));
        setArticles(snap.docs.filter(d => d.data().status === 'published').map(d => ({ id: d.id, ...d.data() } as Article)));
      } catch {
        console.error('Failed to load articles');
      }
    } finally {
      setLoading(false);
    }
  };

  const getText = (article: Article) => {
    const loc = locale === 'en' ? article.en : article.ro;
    // Fallback to the other language if current is empty
    if (!loc?.title) return locale === 'en' ? article.ro : article.en;
    return loc;
  };

  if (loading) {
    return (
      <div class="flex justify-center py-16">
        <div class="animate-spin w-8 h-8 border-4 border-cta-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div class="text-center py-16">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <p class="text-gray-500 text-lg font-semibold">
          {locale === 'en' ? 'No articles yet' : 'Niciun articol momentan'}
        </p>
        <p class="text-gray-400 text-sm mt-2">
          {locale === 'en' ? 'Check back soon for new content.' : 'Revino curand pentru continut nou.'}
        </p>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        const content = getText(article);
        const articleUrl = `${basePath}?id=${article.id}`;
        return (
          <a key={article.id} href={articleUrl} class="group block">
            <div class="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-full hover:shadow-2xl transition duration-500 hover:-translate-y-1 flex flex-col">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-4">
                  <div class="w-10 h-10 bg-gradient-to-br from-cta-teal to-cta-teal/80 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span class="text-xs text-gray-400 font-semibold">{formatDate(article.createdAt)}</span>
                </div>
                <h3 class="text-xl font-bold text-royal-blue mb-2 group-hover:text-cta-teal transition duration-300">
                  {content?.title || 'Untitled'}
                </h3>
                <p class="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {content?.subtitle || ''}
                </p>
              </div>
              <div class="mt-4 flex items-center text-cta-teal text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-300">
                {locale === 'en' ? 'Read article' : 'Citeste articolul'}
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
