import { app } from './firebase';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const db = getFirestore(app);

export async function submitContactForm(formData: FormData, locale: string) {
  const data = {
    name: formData.get('name')?.toString().trim() || '',
    email: formData.get('email')?.toString().trim() || '',
    phone: formData.get('phone')?.toString().trim() || '',
    message: formData.get('message')?.toString().trim() || '',
    locale,
    createdAt: serverTimestamp(),
    source: 'website',
    status: 'new',
  };

  if (!data.name || !data.email || !data.message) {
    throw new Error('Required fields missing');
  }

  await addDoc(collection(db, 'contact_submissions'), data);
}
