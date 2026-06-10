import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  query, 
  where,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Portfolio } from '../types';

/**
 * Validates connection to Firestore at app startup as mandated by the system guidelines
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt standard server read to check network connectivity and configuration
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified and ready.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline. Please check your configuration or network connectivity.");
    }
    return false;
  }
}

/**
 * Saves a portfolio document to cloud firestore
 */
export async function savePortfolioToFirestore(portfolio: Portfolio, userId: string, userEmail: string): Promise<void> {
  const path = `portfolios/${portfolio.id}`;
  try {
    const docRef = doc(db, 'portfolios', portfolio.id);
    
    // Clean portfolio object to conform to database blueprint structure
    const cleanedPortfolio = {
      id: portfolio.id,
      userId: userId,
      ownerEmail: userEmail,
      name: portfolio.name || 'Untitled Exhibit',
      description: portfolio.description || '',
      accentColor: portfolio.accentColor || 'crimson',
      fontPair: portfolio.fontPair || 'space-mono',
      theme: portfolio.theme || 'dark',
      showGridLines: Boolean(portfolio.showGridLines),
      cubeGlow: Boolean(portfolio.cubeGlow),
      layoutMode: portfolio.layoutMode || 'split',
      faces: (portfolio.faces || []).map((face) => ({
        faceName: face.faceName || '',
        tagline: face.tagline || '',
        title: face.title || '',
        body: face.body || '',
        imageSrc: face.imageSrc || '',
        stats: (face.stats || []).map(s => ({ label: s.label || '', value: s.value || '' })),
        ctaText: face.ctaText || 'Turn'
      })),
      socials: portfolio.socials ? {
        instagram: portfolio.socials.instagram || '',
        twitter: portfolio.socials.twitter || '',
        website: portfolio.socials.website || '',
        github: portfolio.socials.github || ''
      } : {},
      createdAt: (portfolio as any).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, cleanedPortfolio);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a portfolio document from cloud firestore
 */
export async function deletePortfolioFromFirestore(id: string): Promise<void> {
  const path = `portfolios/${id}`;
  try {
    const docRef = doc(db, 'portfolios', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches all portfolios belonging to a specific user Uid
 */
export async function getUserPortfoliosFromFirestore(userId: string): Promise<Portfolio[]> {
  const path = 'portfolios';
  try {
    const q = query(collection(db, 'portfolios'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const results: Portfolio[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: data.id,
        name: data.name,
        description: data.description,
        accentColor: data.accentColor,
        fontPair: data.fontPair,
        theme: data.theme,
        showGridLines: data.showGridLines,
        cubeGlow: data.cubeGlow,
        layoutMode: data.layoutMode,
        faces: data.faces,
        socials: data.socials,
        userId: data.userId,
        ownerEmail: data.ownerEmail,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Portfolio);
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Fetches a single portfolio by ID (visitor view or direct load)
 */
export async function getPortfolioFromFirestore(id: string): Promise<Portfolio | null> {
  const path = `portfolios/${id}`;
  try {
    const docRef = doc(db, 'portfolios', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      accentColor: data.accentColor,
      fontPair: data.fontPair,
      theme: data.theme,
      showGridLines: data.showGridLines,
      cubeGlow: data.cubeGlow,
      layoutMode: data.layoutMode,
      faces: data.faces,
      socials: data.socials,
      userId: data.userId,
      ownerEmail: data.ownerEmail,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    } as Portfolio;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
