(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const OWNER_UID = 'sr7PqTYzkySBndnmFDcaVz8v6Iz2';
let userSyncPromise = null;

function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('La consulta tardó demasiado. Revisa tu conexión o las reglas de Firebase.')), ms))
  ]);
}
function normalizePermissions(value) {
  if (Array.isArray(value)) return [...new Set(value.filter(Boolean))];
  if (value && typeof value === 'object') return Object.entries(value).filter(([, enabled]) => !!enabled).map(([key]) => key);
  return String(value || '').split(/[,;|\n]/).map(x => x.trim()).filter(Boolean);
}
function normalizeUser(docSnap) {
  const raw = docSnap.data ? docSnap.data() : docSnap;
  const id = docSnap.id || raw.id || raw.uid || raw.email || '';
  return {
    ...raw,
    id,
    uid: raw.uid || id,
    name: raw.name || raw.fullName || raw.nombre || 'Usuario',
    email: raw.email || raw.correo || raw.username || '',
    role: raw.role || raw.rol || 'Personalizado',
    active: raw.active !== false && raw.enabled !== false && raw.disabled !== true,
    permissions: normalizePermissions(raw.permissions || raw.permisos)
  };
}
function localUsers() {
  try { return JSON.parse(localStorage.getItem('sadi_users') || '[]'); } catch { return []; }
}
function setUserStatus(message, error = false) {
  const box = $('#userSaveStatus');
  if (box) { box.textContent = message; box.dataset.type = error ? 'error' : 'ok'; }
}

window.syncUsersFromFirestore = function syncUsersFromFirestore(showMessage = true) {
  if (userSyncPromise) return userSyncPromise;
  userSyncPromise = (async () => {
    if (!window.state) return [];
    // Pintar primero los datos locales para que la sección nunca se congele.
    const cached = localUsers();
    if (cached.length && !(window.state.users || []).length) window.state.users = cached;
    try { window.renderUsers?.(); } catch (error) { console.warn('Render local de usuarios:', error); }

    if (!window._firebaseReady || !window._db || !window._fb) {
      if (showMessage) setUserStatus('Usuarios mostrados desde este dispositivo. Firebase aún no está disponible.', true);
      return window.state.users || [];
    }
    try {
      const snap = await withTimeout(window._fb.getDocs(window._fb.collection(window._db, 'sadi_users')));
      const unique = new Map();
      snap.docs.map(normalizeUser).forEach(user => {
        const key = String(user.email || user.uid || user.id).toLowerCase();
        const previous = unique.get(key);
        if (!previous || (!previous.uid && user.uid)) unique.set(key, user);
      });
      window.state.users = [...unique.values()];
      localStorage.setItem('sadi_users', JSON.stringify(window.state.users));
      window.renderUsers?.();
      if (showMessage) setUserStatus(`${window.state.users.filter(u => u.uid !== OWNER_UID && u.id !== OWNER_UID).length} usuario(s) cargado(s).`);
      return window.state.users;
    } catch (error) {
      console.warn('Carga de usuarios:', error);
      window.renderUsers?.();
      if (showMessage) setUserStatus('Se muestran los usuarios guardados. No se pudo actualizar: ' + error.message, true);
      return window.state.users || [];
    }
  })().finally(() => { userSyncPromise = null; });
  return userSyncPromise;
};

// Reemplaza la navegación de usuarios por una apertura inmediata y una actualización no bloqueante.
const baseShowAdminView = window.showAdminView;
window.showAdminView = function stableShowAdminView(name, button) {
  const result = typeof baseShowAdminView === 'function' ? baseShowAdminView.call(this, name, button) : undefined;
  if (name === 'users') {
    try { window.renderUsers?.(); } catch (error) { console.warn(error); }
    setTimeout(() => window.syncUsersFromFirestore(false), 0);
    setTimeout(() => window.loadUserAudit?.(false), 120);
  }
  return result;
};

// Selector de categorías: siempre incluye categorías activas y la categoría actual del producto.
function refreshProductCategories(selected = '') {
  const select = $('#pCategory');
  if (!select || !window.state) return;
  const current = selected || select.value || '';
  const categories = [...new Set([
    ...(window.state.categories || []).filter(c => c && c.active !== false).map(c => c.name),
    ...(window.state.products || []).map(p => p && p.category),
    current
  ].filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'es'));
  select.innerHTML = '<option value="">Selecciona una categoría</option>' + categories.map(name => {
    const safe = String(name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    return `<option value="${safe}">${safe}</option>`;
  }).join('');
  select.value = current;
}
const baseEditProduct = window.editProduct;
window.editProduct = function stableEditProduct(id) {
  const product = (window.state?.products || []).find(p => p.id === id);
  refreshProductCategories(product?.category || '');
  const result = typeof baseEditProduct === 'function' ? baseEditProduct.call(this, id) : undefined;
  refreshProductCategories(product?.category || '');
  requestAnimationFrame(() => refreshProductCategories(product?.category || ''));
  return result;
};
const baseOpenProductForm = window.openProductForm;
window.openProductForm = function stableOpenProductForm() {
  const result = typeof baseOpenProductForm === 'function' ? baseOpenProductForm.apply(this, arguments) : undefined;
  refreshProductCategories('');
  return result;
};

// Precarga únicamente las imágenes principales visibles, sin descargar galerías o colores.
function prioritizeVisibleProductImages() {
  const images = [...document.querySelectorAll('.product-card .product-image > img')];
  images.slice(0, 8).forEach((img, index) => {
    img.loading = 'eager';
    img.decoding = 'async';
    if (index < 4) img.fetchPriority = 'high';
  });
  images.slice(8).forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
}
const observer = new MutationObserver(() => prioritizeVisibleProductImages());
document.addEventListener('DOMContentLoaded', () => {
  refreshProductCategories();
  prioritizeVisibleProductImages();
  const grid = $('#storeGrid');
  if (grid) observer.observe(grid, { childList: true });
});
})();
