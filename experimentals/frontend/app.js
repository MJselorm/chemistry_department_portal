import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const status = document.querySelector("#status");
const anonymous = document.querySelector("#anonymous");
const authenticated = document.querySelector("#authenticated");
const profile = document.querySelector("#profile");
const config = window.FIREBASE_CONFIG;
if (!config || config.apiKey === "replace-me") throw new Error("Copy firebase-config.example.js to firebase-config.js and fill in your Firebase web config.");
const auth = getAuth(initializeApp(config));

function message(text, isError = false) { status.textContent = text; status.className = isError ? "error" : ""; }
async function api(path, options = {}) {
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`${window.API_BASE_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
  if (response.status === 401) { await signOut(auth); throw new Error("Your session expired. Please sign in again."); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Request failed.");
  return data;
}
async function loadProfile() {
  await api("/auth/sync", { method: "POST" });
  const user = await api("/users/me");
  const displayName = user.full_name || auth.currentUser.email.split("@")[0];
  document.querySelector("#welcome").textContent = `Welcome, ${displayName}!`;
  document.querySelector("#dashboard-email").textContent = auth.currentUser.email;
  profile.textContent = JSON.stringify(user, null, 2);
  document.querySelector("#full-name").value = user.full_name || "";
}

document.querySelector("#auth-form").addEventListener("submit", async (event) => { event.preventDefault(); const button = event.submitter; const email = document.querySelector("#email").value; const password = document.querySelector("#password").value; message("Authenticating…"); try { if (button.value === "register") { const result = await createUserWithEmailAndPassword(auth, email, password); await sendEmailVerification(result.user); message("Account created. A verification email was sent."); } else await signInWithEmailAndPassword(auth, email, password); } catch (error) { message(error.message, true); } });
document.querySelector("#reset-password").addEventListener("click", async () => { try { await sendPasswordResetEmail(auth, document.querySelector("#email").value); message("Password reset email sent."); } catch (error) { message(error.message, true); } });
document.querySelector("#profile-form").addEventListener("submit", async (event) => { event.preventDefault(); try { const user = await api("/users/me", { method: "PATCH", body: JSON.stringify({ full_name: document.querySelector("#full-name").value || null }) }); profile.textContent = JSON.stringify(user, null, 2); document.querySelector("#welcome").textContent = `Welcome, ${user.full_name || auth.currentUser.email.split("@")[0]}!`; message("Profile saved."); } catch (error) { message(error.message, true); } });
document.querySelector("#verify-email").addEventListener("click", async () => { try { await sendEmailVerification(auth.currentUser); message("Verification email sent."); } catch (error) { message(error.message, true); } });
document.querySelector("#logout").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, async (user) => { anonymous.hidden = !!user; authenticated.hidden = !user; if (!user) return message("Signed out."); message("Loading profile…"); try { await loadProfile(); message(`Signed in as ${user.email}.`); } catch (error) { message(error.message, true); } });
