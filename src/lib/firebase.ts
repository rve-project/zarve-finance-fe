// Same Firebase project (rve-trans) zarve-fe uses for its Google sign-in -- the ID token
// it produces is what Zarve's /auth/google-admin verifies, so it has to come from this
// project. Web config is public by design (not a secret). Loaded lazily so the Firebase
// SDK only ships to the browser when someone actually clicks "Sign in with Google".
const firebaseConfig = {
  apiKey: "AIzaSyCcqaHiFBy-Bze64g_-dws_CLhFaOz5Q0c",
  authDomain: "rve-trans.firebaseapp.com",
  projectId: "rve-trans",
  storageBucket: "rve-trans.firebasestorage.app",
  messagingSenderId: "628831180605",
  appId: "1:628831180605:web:c193741e39c0ee6e775754",
};

/** Opens the Google popup and returns the Firebase ID token. */
export async function signInWithGoogle(): Promise<string> {
  const [{ getApps, initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const idToken = await result.user.getIdToken();
  // Only the ID token is needed -- rve-finance keeps its own session, so don't leave a
  // Firebase session lingering in the browser.
  await signOut(auth);
  return idToken;
}
