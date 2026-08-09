(() => {
'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeId = v => String(v || '').replace(/[^a-zA-Z0-9_-]/g, '');
const PLACEHOLDERS = {
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520"><rect width="520" height="520" rx="46" fill="#f4fff1"/><circle cx="260" cy="240" r="142" fill="#25D366"/><path fill="#fff" d="M340 303c-4 12-23 23-36 26-10 2-23 4-68-15-57-24-94-82-97-86-3-4-23-31-23-59s15-42 21-48c5-6 12-7 16-7h12c4 0 9-2 14 10l19 46c2 6 2 10-1 14l-9 13c-4 4-7 8-3 15 4 8 17 29 37 47 25 22 46 29 53 33 7 3 12 3 16-2l20-23c5-6 10-5 16-3l43 20c7 3 12 5 13 8 2 3 2 18-3 31z"/><path fill="#25D366" d="M145 405l17-63a174 174 0 1 1 64 52z" opacity=".18"/><text x="260" y="445" text-anchor="middle" font-family="Arial" font-size="38" font-weight="700" fill="#202020">WHATSAPP</text></svg>`,
  yape: `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520"><rect width="520" height="520" rx="46" fill="#fff"/><rect x="56" y="56" width="408" height="408" rx="42" fill="#742284"/><text x="260" y="285" text-anchor="middle" font-family="Arial" font-size="98" font-weight="800" fill="#fff">Yape</text><text x="260" y="350" text-anchor="middle" font-family="Arial" font-size="28" fill="#eee">PAGO DIGITAL</text></svg>`,
  plin: `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520"><rect width="520" height="520" rx="46" fill="#fff"/><rect x="56" y="56" width="408" height="408" rx="42" fill="#00b9c5"/><text x="260" y="285" text-anchor="middle" font-family="Arial" font-size="110" font-weight="800" fill="#fff">plin</text><text x="260" y="350" text-anchor="middle" font-family="Arial" font-size="28" fill="#e9ffff">PAGO DIGITAL</text></svg>`,
  transferencia: `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520"><rect width="520" height="520" rx="46" fill="#fff"/><rect x="56" y="56" width="408" height="408" rx="42" fill="#111"/><path d="M130 218h260L260 126zM150 250h42v98h-42zm89 0h42v98h-42zm89 0h42v98h-42zM125 370h270v32H125z" fill="#D4AF37"/><text x="260" y="445" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#fff">TRANSFERENCIA</text></svg>`
};
function svgData(svg){ return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg); }
function allMethods(){
  const list = Array.isArray(state?.settings?.paymentMethods) ? state.settings.paymentMethods : [];
  return list.filter(m => m && m.enabled !== false);
}
function methodImage(m){
  return m.qr || m.image || svgData(PLACEHOLDERS[m.id] || PLACEHOLDERS.whatsapp);
}
function renderPaymentsV32(){
  const grid = document.querySelector('.payment-checkout-grid, .pay-grid');
  if(!grid) return;
  const active = allMethods();
  grid.className = 'payment-checkout-grid payment-checkout-grid-v32';
  if(!active.length){
    grid.innerHTML = '<div class="payment-empty-v32">No hay métodos de pago activos. Comunícate con la tienda.</div>';
    return;
  }
  let selected = active.find(m => m.name === state.payment || m.id === state.payment) || active[0];
  state.payment = selected.name;
  grid.innerHTML = active.map(m => {
    const id = safeId(m.id);
    const checked = m.id === selected.id;
    return `<label class="payment-option-v32 ${checked?'active':''}" data-payment-id="${esc(m.id)}">
      <span class="payment-image-v32"><img src="${esc(methodImage(m))}" alt="${esc(m.name)}"></span>
      <span class="payment-content-v32">
        <span class="payment-heading-v32">${esc(m.name)}</span>
        ${m.number ? `<span class="payment-number-v32">${esc(m.number)}</span>` : ''}
        ${m.holder ? `<span class="payment-holder-v32">Titular: ${esc(m.holder)}</span>` : ''}
        <span class="payment-instruction-v32">${esc(m.instructions || 'Selecciona este método para continuar.')}</span>
      </span>
      <span class="payment-selector-v32"><input type="radio" name="royPaymentV32" value="${esc(m.id)}" ${checked?'checked':''}><span></span><b>Seleccionar</b></span>
    </label>`;
  }).join('');
  grid.querySelectorAll('.payment-option-v32').forEach(card => {
    card.addEventListener('click', () => selectV32(card.dataset.paymentId, card));
    card.querySelector('input')?.addEventListener('change', () => selectV32(card.dataset.paymentId, card));
  });
  document.querySelector('#paymentDetailV31')?.remove();
}
function selectV32(id, card){
  const method = allMethods().find(m => String(m.id) === String(id));
  if(!method) return;
  state.payment = method.name;
  document.querySelectorAll('.payment-option-v32').forEach(el => {
    const active = el === card;
    el.classList.toggle('active', active);
    const radio = el.querySelector('input[type="radio"]');
    if(radio) radio.checked = active;
  });
}
window.selectPaymentV32 = selectV32;
const previousOpen = window.openCheckout;
window.openCheckout = function(){
  const result = previousOpen.apply(this, arguments);
  setTimeout(renderPaymentsV32, 20);
  return result;
};
const previousV31 = window.selectPaymentV31;
window.selectPaymentV31 = function(id, el){ selectV32(id, el?.closest?.('.payment-option-v32') || el); };
const previousSave = window.saveSettings;
window.saveSettings = async function(){
  const result = await previousSave.apply(this, arguments);
  setTimeout(renderPaymentsV32, 30);
  return result;
};
function enforceWhatsAppCheckout(){
  const button = document.querySelector('#checkoutModal .checkout-side .btn-primary');
  if(button){
    button.innerHTML = '<i class="fa-brands fa-whatsapp"></i> FINALIZAR COMPRA POR WHATSAPP';
    button.setAttribute('title','El pedido se registrará y luego se abrirá WhatsApp');
  }
  const note = document.querySelector('#checkoutModal .checkout-side .muted');
  if(note) note.textContent = 'El pedido se registrará y siempre se abrirá WhatsApp con todos los datos. Si pagas con Yape, Plin o transferencia, envía allí tu comprobante.';
}
document.addEventListener('DOMContentLoaded', () => setTimeout(() => { renderPaymentsV32(); enforceWhatsAppCheckout(); }, 1100));
})();
