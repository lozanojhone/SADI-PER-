(() => {
  'use strict';
  const VERSION = '1.0.0';
  window.SADI_VERSION = VERSION;

  function friendlyText(text) {
    const value = String(text || '');
    if (/firebase|firestore|storage|uid|sadi_admins/i.test(value)) {
      return 'No se pudo completar la operación. Revisa tu conexión e inténtalo nuevamente.';
    }
    return value;
  }

  const nativeAlert = window.alert;
  window.alert = (message) => nativeAlert(friendlyText(message));

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.dataset.royReady = 'true';
    const params = new URLSearchParams(location.search);
    if (params.get('admin') === '1') {
      setTimeout(() => {
        if (typeof window.openAdminFromAccount === 'function') window.openAdminFromAccount();
        else if (typeof window.openAdmin === 'function') window.openAdmin();
      }, 250);
    }

    // Keep a safe internal entry so the first mobile back gesture returns to Inicio.
    if (!history.state || !history.state.roy) {
      history.replaceState({roy:true, page:'inicio'}, '', location.href);
      history.pushState({roy:true, page:'inicio-guard'}, '', location.href);
    }
  });

  window.addEventListener('popstate', (event) => {
    if (!event.state || !event.state.roy) {
      history.pushState({roy:true, page:'inicio'}, '', location.href);
      if (typeof window.showPage === 'function') window.showPage('inicio', false);
    }
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }
})();
