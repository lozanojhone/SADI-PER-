/* SADI PERÚ 4.1 - Galeria principal y variantes por color */
(function(){
  'use strict';

  const unique=list=>(list||[]).filter((value,index,array)=>value&&array.indexOf(value)===index);
  const getProduct=()=>state.products.find(product=>product.id===currentQuickId);
  const generalImages=product=>unique([product?.image,...(product?.gallery||[])]);
  const imagesForColor=(product,color)=>unique(normalizeColorImages(product?.colorImages||{})[color]||[]);

  function safeSetGallery(images,label){
    const product=getProduct();
    const list=unique(images);
    quickImageList=list.length?list:generalImages(product);
    quickImageIndex=0;
    const main=document.getElementById('quickImage');
    const thumbs=document.getElementById('quickThumbs');
    if(main)main.src=quickImageList[0]||product?.image||'';
    if(thumbs){
      thumbs.innerHTML=quickImageList.map((src,index)=>`<button class="quick-thumb ${index===0?'active':''}" onclick="chooseQuickImage(${index},this)" aria-label="Ver imagen ${index+1}"><img src="${esc(src)}" alt="${esc(label||'Vista del producto')} ${index+1}"></button>`).join('');
    }
    setupProductZoom();
  }

  function setModeActive(mode,color){
    document.querySelectorAll('#quickColors .quick-gallery-mode').forEach(button=>{
      button.classList.toggle('active',button.dataset.mode===mode&&(mode!=='color'||button.dataset.color===color));
    });
  }

  window.showQuickGeneralImages=function(button){
    const product=getProduct();
    if(!product)return;
    quickColor='Fotos generales';
    const label=document.getElementById('quickColorLabel');
    if(label)label.textContent='Fotos generales';
    safeSetGallery(generalImages(product),'Foto principal');
    setModeActive('general');
    button?.classList.add('active');
  };

  window.showQuickColorImagesByIndex=function(index,button){
    const product=getProduct();
    if(!product)return;
    const color=(product.colors||['Único'])[index];
    const own=imagesForColor(product,color);
    if(!own.length){
      showToast(`El color ${color} todavía no tiene fotografías asignadas.`);
      return;
    }
    quickColor=color;
    const label=document.getElementById('quickColorLabel');
    if(label)label.textContent=color;
    safeSetGallery(own,`Color ${color}`);
    setModeActive('color',color);
    button?.classList.add('active');
  };

  function rebuildModes(product){
    const box=document.getElementById('quickColors');
    if(!box)return;
    const colors=product.colors?.length?product.colors:['Único'];
    box.className='quick-gallery-modes';
    box.innerHTML=`<button class="quick-gallery-mode active" data-mode="general" onclick="showQuickGeneralImages(this)"><i class="fa-regular fa-images"></i> Imágenes principales</button>`+
      colors.map((color,index)=>{
        const has=imagesForColor(product,color).length>0;
        return `<button class="quick-gallery-mode" data-mode="color" data-color="${esc(color)}" onclick="showQuickColorImagesByIndex(${index},this)" ${has?'':'title="Sin fotografías asignadas"'}><span class="roy-color-dot" style="background:${colorHex(color)}"></span>${esc(color)}</button>`;
      }).join('');
  }

  const previousOpenQuick=window.openQuick;
  window.openQuick=function(id){
    previousOpenQuick.call(this,id);
    const product=state.products.find(item=>item.id===id);
    if(!product)return;
    rebuildModes(product);
    window.showQuickGeneralImages(document.querySelector('#quickColors [data-mode="general"]'));
  };

  const previousChooseQuick=window.chooseQuick;
  window.chooseQuick=function(type,index,element){
    if(type!=='color')return previousChooseQuick.call(this,type,index,element);
    window.showQuickColorImagesByIndex(index,element);
  };

  function ensureReminder(){
    let reminder=document.getElementById('royCartReminder');
    if(reminder)return reminder;
    reminder=document.createElement('div');
    reminder.id='royCartReminder';
    reminder.className='roy-cart-reminder';
    reminder.innerHTML='<div class="roy-cart-reminder-icon"><i class="fa-solid fa-bag-shopping"></i></div><div class="roy-cart-reminder-copy"><b>Producto agregado</b><span id="royCartReminderText">Tu compra sigue en el carrito.</span></div><button type="button" onclick="closeModal(\'quickModal\');openCart()">Ver carrito</button>';
    document.body.appendChild(reminder);
    return reminder;
  }

  function showCartReminder(){
    const reminder=ensureReminder();
    const count=state.cart.reduce((sum,item)=>sum+Number(item.qty||0),0);
    const text=document.getElementById('royCartReminderText');
    if(text)text.textContent=`${count} producto${count===1?'':'s'} en tu carrito.`;
    reminder.classList.add('show');
    clearTimeout(reminder._hideTimer);
    reminder._hideTimer=setTimeout(()=>reminder.classList.remove('show'),1600);
  }

  const previousQuickAdd=window.quickAdd;
  window.quickAdd=function(){
    previousQuickAdd.call(this);
    showCartReminder();
  };

  document.addEventListener('DOMContentLoaded',ensureReminder);
})();
