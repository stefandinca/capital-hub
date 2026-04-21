import { app } from './firebase';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const db = getFirestore(app);

export async function submitCompatibilityForm(formData: FormData, locale: string) {
  const data = {
    companyName: formData.get('companyName')?.toString().trim() || '',
    cui: formData.get('cui')?.toString().trim() || '',
    domain: formData.get('domain')?.toString().trim() || '',
    revenue: formData.get('revenue')?.toString().trim() || '',
    mainProblem: formData.get('mainProblem')?.toString().trim() || '',
    triedFinancing: formData.get('triedFinancing')?.toString() || '',
    urgency: formData.get('urgency')?.toString() || '',
    willingToAdjust: formData.get('willingToAdjust')?.toString() || '',
    fullName: formData.get('fullName')?.toString().trim() || '',
    phone: formData.get('phone')?.toString().trim() || '',
    email: formData.get('email')?.toString().trim() || '',
    consent: true,
    locale,
    createdAt: serverTimestamp(),
    source: 'website',
    status: 'new',
  };

  if (!data.companyName || !data.email || !data.fullName || !data.cui) {
    throw new Error('Required fields missing');
  }

  await addDoc(collection(db, 'compatibility_submissions'), data);
}
