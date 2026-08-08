(() => {
'use strict';

const $ = (s) => document.querySelector(s);
let opening = false;
let backgroundSyncStarted = false;

function activateUsersView(button) {
  document.querySelectorAll('.admin-view').forEach(view => view.classList.remove('active'));
  const usersView = $('#admin-users');
  if (usersView) usersView.classList.add('active');

  document.querySelectorAll('#adminMenu button[data-view]').forEach(item => {
    item.classList.toggle('active', item === button || item.dataset.view === 'users');
  });

  $('#adminSide')?.classList.remove('open');
  try { window.touchAdmin?.(); } catch (error) { console.warn('No se pudo actualizar la sesión:', error); }
}

function renderImmediately() {
  const list = $('#usersList');
  if (list && !list.innerHTML.trim()) {
    list.innerHTML = '<div class="empty">Abriendo usuarios…</div>';
  }
  try {
    if (typeof window.renderUsers === 'function') window.renderUsers();
  } catch (error) {
    console.error('Error al mostrar usuarios:', error);
    if (list) list.innerHTML = '<div class="empty">La sección abrió, pero no se pudieron dibujar los usuarios guardados.</div>';
  }

  const audit = $('#userAuditList');
  if (audit && !audit.innerHTML.trim()) {
    audit.innerHTML = '<div class="audit-empty">Pulsa “Actualizar historial” para consultar los movimientos.</div>';
  }
}

function syncInBackground() {
  if (backgroundSyncStarted) return;
  backgroundSyncStarted = true;
  const run = async () => {
    try {
      if (typeof window.syncUsersFromFirestore === 'function') {
        await window.syncUsersFromFirestore(false);
      }
    } catch (error) {
      console.warn('Actualización silenciosa de usuarios:', error);
    } finally {
      backgroundSyncStarted = false;
    }
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => run(), { timeout: 1800 });
  } else {
    setTimeout(run, 350);
  }
}

function openUsersSafely(button) {
  if (opening) return;
  opening = true;
  try {
    activateUsersView(button);
    renderImmediately();
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      syncInBackground();
    });
  } finally {
    setTimeout(() => { opening = false; }, 250);
  }
}

// Intercepta antes de los manejadores antiguos para evitar cadenas duplicadas
// de showAdminView, consultas y renderizados que bloqueaban la interfaz.
document.addEventListener('click', (event) => {
  const button = event.target.closest('#adminMenu button[data-view="users"]');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openUsersSafely(button);
}, true);

// Mantiene una función directa disponible para accesos internos.
window.openUsersPanelSafely = openUsersSafely;

// Los datos pesados del historial solo se consultan cuando el administrador
// pulsa expresamente el botón correspondiente.
document.addEventListener('DOMContentLoaded', () => {
  const usersButton = $('#adminMenu button[data-view="users"]');
  if (usersButton) usersButton.type = 'button';

  const updateUsers = [...document.querySelectorAll('#admin-users button')]
    .find(button => /actualizar usuarios y roles/i.test(button.textContent || ''));
  if (updateUsers) {
    updateUsers.type = 'button';
    updateUsers.onclick = async (event) => {
      event.preventDefault();
      if (updateUsers.dataset.busy === '1') return;
      updateUsers.dataset.busy = '1';
      updateUsers.disabled = true;
      try {
        await window.syncUsersFromFirestore?.(true);
      } finally {
        updateUsers.disabled = false;
        delete updateUsers.dataset.busy;
      }
    };
  }

  const updateAudit = [...document.querySelectorAll('#admin-users button')]
    .find(button => /actualizar historial/i.test(button.textContent || ''));
  if (updateAudit) {
    updateAudit.type = 'button';
    updateAudit.onclick = async (event) => {
      event.preventDefault();
      if (updateAudit.dataset.busy === '1') return;
      updateAudit.dataset.busy = '1';
      updateAudit.disabled = true;
      try {
        await window.loadUserAudit?.(true);
      } finally {
        updateAudit.disabled = false;
        delete updateAudit.dataset.busy;
      }
    };
  }
});
})();
