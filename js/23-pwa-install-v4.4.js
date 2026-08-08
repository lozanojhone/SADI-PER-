(function () {
  'use strict';

  let deferredPrompt = null;
  let installed = false;

  const DISMISS_KEY = 'sadi_pwa_install_dismissed_at';
  const DAY = 86400000;

  function q(id) {
    return document.getElementById(id);
  }

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith('android-app://')
    );
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function isAndroid() {
    return /android/i.test(navigator.userAgent);
  }

  function isSecure() {
    return (
      location.protocol === 'https:' ||
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'
    );
  }

  function setStatus(text, type) {
    const el = q('royInstallStatus');

    if (!el) {
      return;
    }

    el.textContent = text;
    el.className = 'roy-install-status' + (type ? ' ' + type : '');
  }

  function updateUI() {
    installed = isStandalone();

    document.querySelectorAll('.roy-install-entry').forEach((el) => {
      el.hidden = installed;
      el.setAttribute('aria-hidden', installed ? 'true' : 'false');
    });

    document.querySelectorAll('.roy-install-icon-btn').forEach((el) => {
      el.classList.toggle('is-installed', installed);
    });

    if (installed) {
      hideBanner(false);
      closeModal();
      setStatus(
        'SADI PERÚ ya está instalada en este dispositivo.',
        'success'
      );
    }
  }

  function openModal() {
    if (installed) {
      updateUI();
      return;
    }

    /*
     * Al pulsar INSTALAR en el aviso inferior:
     * 1. El aviso desaparece.
     * 2. Se abre el menú grande de instalación.
     * 3. No se guarda como descartado, para que pueda volver
     *    a aparecer si el cliente cierra el menú sin instalar.
     */
    hideBanner(false);

    const modal = q('royInstallModal');

    if (!modal) {
      return;
    }

    modal.classList.add('open');
    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    renderInstructions();
  }

  function closeModal() {
    const modal = q('royInstallModal');

    if (!modal) {
      return;
    }

    modal.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  function renderInstructions() {
    const steps = q('royInstallSteps');
    const action = q('royInstallAction');

    if (!steps || !action) {
      return;
    }

    if (installed) {
      steps.innerHTML = '';
      action.hidden = true;

      setStatus(
        'SADI PERÚ ya está instalada y lista para usar.',
        'success'
      );

      return;
    }

    action.hidden = false;

    if (!isSecure()) {
      steps.innerHTML =
        '<div class="roy-install-step">' +
          '<strong>!</strong>' +
          '<div>' +
            '<b>Publica el sitio con HTTPS</b>' +
            '<span>La instalación solo funciona desde Firebase Hosting o un dominio seguro.</span>' +
          '</div>' +
        '</div>';

      action.hidden = true;

      setStatus(
        'Abre la dirección publicada de SADI PERÚ, no un archivo local.',
        'warning'
      );

      return;
    }

    if (isIOS()) {
      steps.innerHTML =
        '<div class="roy-install-step">' +
          '<strong>1</strong>' +
          '<div>' +
            '<b>Abre SADI PERÚ en Safari</b>' +
            '<span>En iPhone o iPad usa Safari para instalarla.</span>' +
          '</div>' +
        '</div>' +
        '<div class="roy-install-step">' +
          '<strong>2</strong>' +
          '<div>' +
            '<b>Toca Compartir</b>' +
            '<span>Es el ícono del cuadrado con una flecha hacia arriba.</span>' +
          '</div>' +
        '</div>' +
        '<div class="roy-install-step">' +
          '<strong>3</strong>' +
          '<div>' +
            '<b>Selecciona “Agregar a inicio”</b>' +
            '<span>Luego pulsa Agregar. El logo SADI PERÚ aparecerá en tu pantalla.</span>' +
          '</div>' +
        '</div>';

      action.textContent = 'ENTENDIDO';
      action.onclick = closeModal;

      setStatus(
        'Apple no permite abrir automáticamente la ventana de instalación. Sigue estos tres pasos.'
      );

      return;
    }

    if (deferredPrompt) {
      steps.innerHTML =
        '<div class="roy-install-step">' +
          '<strong>1</strong>' +
          '<div>' +
            '<b>Pulsa “Instalar ahora”</b>' +
            '<span>Se abrirá la confirmación segura del navegador.</span>' +
          '</div>' +
        '</div>' +
        '<div class="roy-install-step">' +
          '<strong>2</strong>' +
          '<div>' +
            '<b>Confirma la instalación</b>' +
            '<span>SADI PERÚ se agregará como aplicación sin descargar un APK.</span>' +
          '</div>' +
        '</div>';

      action.textContent = 'INSTALAR AHORA';
      action.onclick = promptInstall;

      setStatus(
        'Instalación disponible en este dispositivo.',
        'success'
      );

      return;
    }

    const browser = isAndroid()
      ? 'Chrome'
      : 'Chrome, Edge o Safari';

    steps.innerHTML =
      '<div class="roy-install-step">' +
        '<strong>1</strong>' +
        '<div>' +
          '<b>Abre el menú del navegador</b>' +
          '<span>Usa ' + browser + ' y toca el menú de tres puntos.</span>' +
        '</div>' +
      '</div>' +
      '<div class="roy-install-step">' +
        '<strong>2</strong>' +
        '<div>' +
          '<b>Elige “Instalar aplicación”</b>' +
          '<span>También puede aparecer como “Agregar a pantalla principal”.</span>' +
        '</div>' +
      '</div>';

    action.textContent = 'VOLVER A INTENTAR';

    action.onclick = function () {
      /*
       * No recarga directamente la página.
       * Primero comprueba si el navegador ya habilitó la instalación.
       */
      if (deferredPrompt) {
        promptInstall();
        return;
      }

      setStatus(
        'La instalación automática todavía no está disponible. Usa el menú del navegador o vuelve a intentarlo en unos segundos.',
        'warning'
      );

      setTimeout(renderInstructions, 1000);
    };

    setStatus(
      'El navegador aún no habilitó la instalación automática. Puede tardar unos segundos o requerir una segunda visita.'
    );
  }

  async function promptInstall() {
    if (installed) {
      updateUI();
      return;
    }

    if (!deferredPrompt) {
      openModal();
      return;
    }

    try {
      deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;

      if (choice && choice.outcome === 'accepted') {
        setStatus(
          'Instalando SADI PERÚ...',
          'success'
        );

        /*
         * El aviso inferior permanece oculto después de aceptar.
         */
        hideBanner(true);
      } else {
        setStatus(
          'Instalación cancelada. Puedes intentarlo nuevamente cuando quieras.',
          'warning'
        );
      }
    } catch (err) {
      console.warn('SADI PERÚ PWA install:', err);

      setStatus(
        'No se pudo abrir la instalación. Usa el menú del navegador.',
        'warning'
      );
    }

    deferredPrompt = null;
  }

  function showBanner(force) {
    if (installed) {
      return;
    }

    const last = Number(
      localStorage.getItem(DISMISS_KEY) || 0
    );

    /*
     * Solo respeta los 7 días cuando el cliente cerró
     * voluntariamente el aviso con la X.
     */
    if (!force && Date.now() - last < 7 * DAY) {
      return;
    }

    const banner = q('royPwaBanner');

    if (banner) {
      setTimeout(function () {
        if (!installed && !isStandalone()) {
          banner.classList.add('show');
        }
      }, force ? 0 : 1400);
    }
  }

  function hideBanner(remember) {
    const banner = q('royPwaBanner');

    if (banner) {
      banner.classList.remove('show');
    }

    if (remember) {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now())
      );
    }
  }

  /*
   * Botón INSTALAR del aviso inferior:
   * - oculta el aviso;
   * - abre el instalador grande;
   * - no marca el aviso como descartado.
   */
  window.openRoyInstall = function () {
    if (installed || isStandalone()) {
      updateUI();
      return;
    }

    hideBanner(false);
    openModal();
  };

  window.closeRoyInstall = closeModal;
  window.installRoyApp = promptInstall;

  /*
   * Solo la X del aviso inferior lo oculta durante 7 días.
   */
  window.dismissRoyInstall = function () {
    hideBanner(true);
  };

  window.addEventListener(
    'beforeinstallprompt',
    function (event) {
      event.preventDefault();

      deferredPrompt = event;

      updateUI();
      showBanner(false);

      /*
       * Si el menú grande ya está abierto, actualiza el botón
       * a “INSTALAR AHORA” sin obligar a cerrar la ventana.
       */
      const modal = q('royInstallModal');

      if (modal && modal.classList.contains('open')) {
        renderInstructions();
      }
    }
  );

  window.addEventListener(
    'appinstalled',
    function () {
      installed = true;
      deferredPrompt = null;

      hideBanner(true);
      closeModal();
      updateUI();

      setStatus(
        'SADI PERÚ se instaló correctamente. Ya puedes abrirla desde tu pantalla de inicio.',
        'success'
      );
    }
  );

  window.addEventListener(
    'DOMContentLoaded',
    function () {
      updateUI();

      if (!installed) {
        showBanner(false);
      }

      const modal = q('royInstallModal');

      if (modal) {
        modal.addEventListener(
          'click',
          function (event) {
            if (event.target === modal) {
              closeModal();
            }
          }
        );
      }
    }
  );

  window.addEventListener(
    'pageshow',
    function () {
      updateUI();
    }
  );

  window
    .matchMedia('(display-mode: standalone)')
    .addEventListener?.(
      'change',
      function () {
        updateUI();
      }
    );
})();
