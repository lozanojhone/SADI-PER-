(() => {
 'use strict';
 const OFFICIAL={primary:'#6B3A1E',secondary:'#FFFFFF',background:'#050505',text:'#FFFFFF',logo:'assets/logo-sadi-mark.png'};
 function value(id,fallback){return document.getElementById(id)?.value||fallback}
 window.previewBrandColors=function(){
  const primary=value('setPrimaryColor',OFFICIAL.primary),secondary=value('setSecondaryColor',OFFICIAL.secondary),bg=value('setBackgroundColor',OFFICIAL.background),text=value('setTextColor',OFFICIAL.text);
  const root=document.documentElement;root.style.setProperty('--roy-primary',primary);root.style.setProperty('--roy-secondary',secondary);root.style.setProperty('--roy-background',bg);root.style.setProperty('--roy-text',text);root.style.setProperty('--orange',primary);root.style.setProperty('--green',primary);root.style.setProperty('--bg',bg);root.style.setProperty('--white',text);
  const box=document.getElementById('brandLivePreview');if(box){box.style.setProperty('--preview-primary',primary);box.style.setProperty('--preview-secondary',secondary);box.style.setProperty('--preview-bg',bg);box.style.setProperty('--preview-text',text)}
 };
 window.restoreOfficialBrand=function(){
  [['setPrimaryColor',OFFICIAL.primary],['setSecondaryColor',OFFICIAL.secondary],['setBackgroundColor',OFFICIAL.background],['setTextColor',OFFICIAL.text],['setLogoUrl',OFFICIAL.logo],['setStoreName','SADI PERÚ']].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v});
  const file=document.getElementById('setLogoFile');if(file)delete file.dataset.data;
  const preview=document.getElementById('setLogoPreview');if(preview)preview.src=OFFICIAL.logo;
  previewBrandColors();if(typeof showToast==='function')showToast('Marca oficial restaurada. Pulsa Guardar configuración para confirmar.');
 };
 document.addEventListener('DOMContentLoaded',()=>{setTimeout(previewBrandColors,500)});
})();