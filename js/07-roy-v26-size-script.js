
(function(){
 const Q=s=>document.querySelector(s);
 const SIZE_PRESETS={
  tops:['XS','S','M','L','XL','XXL'],
  bottoms:['26','28','30','32','34','36','38','40'],
  shoes:['35','36','37','38','39','40','41','42','43','44','45'],
  kids:['2','4','6','8','10','12','14','16'],
  underwear:['XS','S','M','L','XL'],
  hats:['S/M','L/XL','Única'],
  one:['Única']
 };
 function clean(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
 function presetFor(category){
  const c=clean(category);
  if(/calzado|zapat|zapato|botin|sandalia|tenis/.test(c))return SIZE_PRESETS.shoes;
  if(/pantal|jean|short|falda|bermuda|jogger/.test(c))return SIZE_PRESETS.bottoms;
  if(/nino|nina|infantil|bebe|kids/.test(c))return SIZE_PRESETS.kids;
  if(/interior|boxer|bralette|sosten|pijama/.test(c))return SIZE_PRESETS.underwear;
  if(/gorra|sombrero|gorro/.test(c))return SIZE_PRESETS.hats;
  if(/accesorio|cartera|bolso|mochila|cinturon|reloj|lente|joya|collar|pulsera/.test(c))return SIZE_PRESETS.one;
  return SIZE_PRESETS.tops;
 }
 function values(){return String(Q('#pSizes')?.value||'').split(',').map(x=>x.trim()).filter(Boolean)}
 function setValues(arr){const unique=[...new Set(arr.map(x=>String(x).trim()).filter(Boolean))];if(Q('#pSizes'))Q('#pSizes').value=unique.join(', ');renderSelected(unique)}
 function renderSelected(arr=values()){const el=Q('#v26Selected');if(el)el.innerHTML='<b>Tallas seleccionadas:</b> '+(arr.length?arr.map(x=>'<span>'+esc(x)+'</span>').join(' · '):'Ninguna')}
 function renderPreset(force=false){
  const box=Q('#v26SizeChips'),cat=Q('#pCategory');if(!box||!cat)return;
  const preset=presetFor(cat.value),current=values();
  if(force||!current.length)setValues(preset);
  const selected=values();
  box.innerHTML=preset.map(s=>'<button type="button" class="v26-size-chip '+(selected.includes(s)?'active':'')+'" data-size="'+esc(s)+'">'+esc(s)+'</button>').join('');
  box.querySelectorAll('[data-size]').forEach(btn=>btn.onclick=()=>{const size=btn.dataset.size,arr=values();setValues(arr.includes(size)?arr.filter(x=>x!==size):[...arr,size]);renderPreset(false)});
  const label=Q('#v26PresetName');if(label)label.textContent='Recomendadas para '+(cat.value||'prendas');renderSelected();
 }
 function addCustom(){const input=Q('#v26CustomSize');if(!input)return;const raw=input.value.trim();if(!raw)return;const newSizes=raw.split(',').map(x=>x.trim()).filter(Boolean);setValues([...values(),...newSizes]);input.value='';renderPreset(false)}
 function mount(){
  const input=Q('#pSizes');if(!input||Q('#v26SizePanel'))return;
  const group=input.closest('.form-group');if(!group)return;
  group.classList.add('full');
  group.insertAdjacentHTML('beforeend','<div class="v26-size-panel" id="v26SizePanel"><div class="v26-size-head"><strong>Tallas del producto</strong><small id="v26PresetName">Tallas recomendadas</small></div><div class="v26-size-note">Se muestran tallas predefinidas según la categoría. Puedes marcar o desmarcar opciones y agregar otras tallas manualmente.</div><div class="v26-size-chips" id="v26SizeChips"></div><div class="v26-size-custom"><input class="field" id="v26CustomSize" placeholder="Agregar talla personalizada, por ejemplo 3XL o 29"><button type="button" class="btn btn-secondary btn-sm" id="v26AddSize">Agregar talla</button></div><div class="v26-selected" id="v26Selected"></div></div>');
  Q('#v26AddSize').onclick=addCustom;Q('#v26CustomSize').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addCustom()}});
  const cat=Q('#pCategory');cat?.addEventListener('change',()=>renderPreset(true));cat?.addEventListener('input',()=>{clearTimeout(cat._v26t);cat._v26t=setTimeout(()=>renderPreset(false),250)});
  renderPreset(false);
 }
 const oldOpen=window.openProductForm;window.openProductForm=function(){const r=oldOpen.apply(this,arguments);setTimeout(()=>{mount();renderPreset(true)},40);return r};
 const oldEdit=window.editProduct;window.editProduct=function(id){const r=oldEdit.apply(this,arguments);setTimeout(()=>{mount();renderPreset(false)},80);return r};
 document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,900));setTimeout(mount,1600);
})();
