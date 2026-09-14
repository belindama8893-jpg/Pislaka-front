/* Team V1: isolated, local-only organization prototype. No API calls. */
(() => {
  'use strict';
  const KEY = 'pislaka.team-v1.v1';
  const root = document.getElementById('team-view');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => crypto.randomUUID();
  let state = {version:1, org:null, units:[], members:[], step:0, complete:false};
  let drawerUnit = null;
  let page = 'setup', tab = 'structure', status = '', answer = '';
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.version === 1 && Array.isArray(saved.units) && Array.isArray(saved.members)) state = saved; } catch { status = 'Saved organization data could not be read.'; }
  state.invites ||= [];
  // Resume legacy Review drafts at the final editable step.
  state.step = Math.min(state.step, 3);
  const directory = [{name:'Ayesha Khan',email:'ayesha@pislaka.example'},{name:'Sara Ahmed',email:'sara@pislaka.example'},{name:'Ali Raza',email:'ali@pislaka.example'}];
  state.members.forEach(m => { m.email ||= m.id === 'self' ? directory[0].email : `${m.name.toLowerCase().replace(/[^a-z0-9]+/g,'.')}@pislaka.example`; });
  const zones = {'Pakistan':'Asia/Karachi','United Arab Emirates':'Asia/Dubai','Saudi Arabia':'Asia/Riyadh','United Kingdom':'Europe/London','China':'Asia/Shanghai','Other':'UTC'};
  if (state.complete) page = 'home';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); status = ''; } catch { status = 'Browser storage unavailable. Changes last for this session only.'; } };
  const btn = (label, action, cls = '', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const options = (values, current) => values.map(v => `<option value="${esc(v)}" ${v === current ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const path = id => { if (id === 'org' || !id) return state.org?.name || 'Organization'; const u = state.units.find(x => x.id === id); return u ? `${path(u.parentId)} / ${u.name}` : 'Unassigned'; };
  const unitOptions = current => [{id:'org',name:state.org.name},...state.units.map(u => ({id:u.id,name:path(u.id)}))].map(u => `<option value="${u.id}" ${current === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('');
  const scopeText = m => m.role !== 'Manager' ? 'No management scope · Agent' : m.scopes.map(s => `${path(s.unitId)}${s.includeSubUnits ? ' + sub-units' : ' (direct members only)'}`).join('; ') || 'Management scope required';
  const stepNames = ['Organization','Structure','Members'];
  function header(title, copy, action='') { return `<header class="tv-header"><div><span class="tv-kicker">Pislaka / Team</span><h1 tabindex="-1">${title}</h1>${copy ? `<p>${copy}</p>` : ''}</div>${action}</header>`; }
  const deleteButton = (label, action, id) => btn('<i data-lucide="trash-2" aria-hidden="true"></i>',action,'listing-action danger icon-only',`data-id="${id}" aria-label="${esc(label)}" data-tooltip="${esc(label)}"`);
  function nodeActions(id) {
    const name=id==='org'?state.org.name:state.units.find(u=>u.id===id).name;
    return `${btn('<i data-lucide="plus" aria-hidden="true"></i>','add-child','listing-action icon-only',`data-id="${id}" aria-label="Add unit under ${esc(name)}" data-tooltip="Add sub-unit"`)}${btn(`Members · ${state.members.filter(m=>m.unitId===id).length}`,'unit-members','listing-action',`data-id="${id}" aria-label="Members of ${esc(name)}"`)}${id==='org'?'':`<details class="tv-node-menu"><summary aria-label="More actions for ${esc(name)}">⋯</summary><div>${btn('Edit unit','edit-unit','listing-action',`data-id="${id}"`)}${deleteButton('Delete unit','remove-unit',id)}</div></details>`}`;
  }
  const addAction = kind => btn(`<i data-lucide="plus" aria-hidden="true"></i>${kind === 'structure' ? 'Add Organization Unit' : 'Add member'}`,kind === 'structure' ? 'add-unit' : 'add-member','listing-action primary');
  const sectionAction = kind => page === 'settings' || kind === 'structure' ? '' : `<div class="tv-section-toolbar">${addAction(kind)}</div>`;
  function tree(parent = 'org') { return state.units.filter(u => u.parentId === parent).map(u => `<li><div class="tv-node"><div><strong>${esc(u.name)}</strong><small>${esc(u.type)}</small></div><div class="tv-actions">${nodeActions(u.id)}</div></div><ul>${tree(u.id)}</ul></li>`).join(''); }
  function structure() { return `${sectionAction('structure')}<div class="tv-card"><div class="tv-row"><div><h2>Organization structure</h2></div></div>${!state.units.length ? `<div class="tv-grid">${[['simple','Simple Team','One team, with room to grow.'],['branches','Teams & Branches','A branch with a team inside.'],['custom','Custom Structure','Build your own hierarchy.']].map(([id,title,desc]) => btn(`<strong>${title}</strong>`,'template','tv-template',`data-id="${id}"`)).join('')}</div>` : ''}<ul class="tv-tree"><li><div class="tv-node"><div><strong>${esc(state.org.name)}</strong></div><div class="tv-actions">${nodeActions('org')}</div></div><ul>${tree()}</ul></li></ul></div>`; }
  function members(unit = null) { const list = state.members.filter(m=>unit===null || m.unitId===unit), invites=state.invites.filter(i=>unit===null || i.unitId===unit); return `${unit===null?sectionAction('members'):''}<div class="tv-card"><div class="tv-row"><h2>${unit===null?'Members':'Direct members'}</h2>${unit!==null?btn('Add member','add-node-member','listing-action primary',`data-id="${unit}"`):''}</div>${!list.length?'<p class="tv-empty-members">No members in this unit.</p>':''}${list.map(m => `<div class="tv-member"><div class="tv-row"><div class="tv-person"><span class="tv-avatar">${esc(m.name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</span><div><strong>${esc(m.name)}${m.id==='self'?' (you)':''}</strong><small>${esc(m.email)}</small>${m.unitId!=='org'?`<small>${esc(path(m.unitId))}</small>`:''}</div></div><div class="tv-actions">${btn('Edit','edit-member','listing-action',`data-id="${m.id}"`)}${m.access !== 'Owner' && m.id !== 'self' ? deleteButton('Remove member','remove-member',m.id) : ''}</div></div><p style="margin:12px 0 4px"><span class="tv-badge">${m.access}</span> <span class="tv-badge">${m.role}</span></p>${m.role==='Manager'?`<small>${esc(scopeText(m))}</small>`:''}</div>`).join('')}${invites.length?`<h3 class="tv-pending-heading">Pending invitations</h3>${invites.map(i=>`<div class="tv-member tv-row"><div><strong>${esc(i.email)}</strong><small>${i.access} · ${i.role} · Pending</small></div><div class="tv-actions">${btn('Resend','resend','listing-action',`data-id="${i.id}"`)}${deleteButton('Revoke invitation','revoke',i.id)}</div></div>`).join('')}`:''}</div>`; }
  function organizationForm() { return `<form id="tv-org-form" class="tv-card"><h2>${state.org ? 'Organization details' : 'Create your organization'}</h2><label>Organization name<input name="name" required maxlength="80" placeholder="e.g. Prime Estates" value="${esc(state.org?.name || '')}" /></label><div class="tv-grid two"><label>Country / Region<select name="country">${options(['Pakistan','United Arab Emirates','Saudi Arabia','United Kingdom','China','Other'],state.org?.country || 'Pakistan')}</select></label></div>${page === 'settings' ? `<details class="tv-advanced"><summary>Advanced settings</summary><label>Time zone<select name="timezone">${options(Object.values(zones),state.org?.timezone || 'Asia/Karachi')}</select></label></details>` : ''}<div class="tv-footer">${btn('Back','back')}<button class="primary" type="submit">${page === 'settings' ? 'Save details' : state.org ? 'Save & Continue' : 'Create & Continue'}</button></div></form>`; }
  function render(focus = false) {
    let html = '';
    if (!state.org && state.step === 0) html = header('Team','') + `<div class="tv-card tv-empty"><div class="tv-symbol"><i data-lucide="network"></i></div><h1>Build your team in Pislaka</h1>${btn('Set up Organization →','start','primary')}</div>`;
    else if (page === 'home' && state.complete) html = header('Your Team Agent',`A shared view of ${esc(state.org.name)}.`,btn('Organization Settings','settings')) + `<div class="tv-grid"><div class="tv-card"><h3>Organization</h3><p>${esc(state.org.name)}</p></div><div class="tv-card"><h3>Members</h3><div class="tv-stat">${state.members.length}</div></div><div class="tv-card"><h3>Managers</h3><div class="tv-stat">${state.members.filter(m=>m.role==='Manager').length}</div></div></div><div class="tv-card"><span class="tv-kicker">Start a conversation</span><h2 style="margin-top:12px">What needs your team's attention?</h2><div class="tv-grid">${['What are my team priorities today?','Which agents need follow-up support?','How is each branch performing?'].map((q,i)=>btn(q,'question','tv-template',`data-id="${i}"`)).join('')}</div>${answer ? `<div class="tv-note tv-answer" role="status">${esc(answer)}</div>` : ''}</div>`;
    else if (page === 'settings') html = header('Organization Settings',esc(state.org.name),btn('← Team Agent','home')) + `<div class="tv-settings-toolbar"><nav class="tv-tabs" aria-label="Organization settings">${[['details','Details'],['structure','Structure'],['members','Members']].map(([id,label])=>btn(label,'tab','',`data-id="${id}" ${tab===id?'aria-current="page"':''}`)).join('')}</nav>${tab === 'members' ? addAction(tab) : ''}</div>${tab === 'details' ? organizationForm() : tab === 'structure' ? structure() : members()}`;
    else html = header('Set up your organization','',btn('Save & exit','exit')) + `<ol class="tv-steps">${stepNames.map((s,i)=>`<li class="${state.step===i+1?'current':''}" ${state.step===i+1?'aria-current="step"':''}><span>0${i+1}</span>${s}</li>`).join('')}</ol>${state.step === 1 ? organizationForm() : state.step === 2 ? structure() : members()}${state.step>1 ? `<div class="tv-footer">${btn('← Back','back')}${btn(state.step===3?'Complete setup →':'Continue →','next','primary')}</div>` : ''}`;
    if(state.org) html += `<div class="tv-section-toolbar">${btn('<i data-lucide="rotate-ccw" aria-hidden="true"></i>Reset organization','reset-organization','listing-action')}</div>`;
    root.innerHTML = html + `<p class="tv-status" role="status">${esc(status)}</p><dialog id="tv-dialog" aria-labelledby="tv-dialog-title"></dialog><dialog id="tv-member-drawer" class="tv-member-drawer" aria-labelledby="tv-drawer-title"></dialog>`;
    root.querySelector('#tv-org-form')?.addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target); const name = f.get('name').trim();
      if (!name) { e.target.elements.name.setCustomValidity('Enter an organization name.'); e.target.elements.name.reportValidity(); return; }
      state.org = {...state.org, id:state.org?.id || uid(), name, country:f.get('country'), timezone:f.get('timezone') || (state.org?.country === f.get('country') ? state.org.timezone : zones[f.get('country')]), ownerId:'self'};
      if (!state.members.length) state.members.push({id:'self',name:'Ayesha Khan',email:directory[0].email,unitId:'org',access:'Owner',role:'Agent',scopes:[]});
      if (page !== 'settings') state.step=2; save(); render(true); if(page==='settings')flash('Saved');
    });
    root.querySelector('[name=country]')?.addEventListener('change',e=>{const zone=root.querySelector('[name=timezone]');if(zone){zone.value=zones[e.target.value];zone.dispatchEvent(new Event('change'));}});
    root.querySelector('[name=name]')?.addEventListener('input',e=>e.target.setCustomValidity(''));
    if(drawerUnit!==null) {
      const drawer=root.querySelector('#tv-member-drawer');
      drawer.innerHTML=`<div class="tv-row"><div><small>${esc(path(drawerUnit))}</small><h2 id="tv-drawer-title">Unit members</h2></div>${btn('Close','close-drawer')}</div>${members(drawerUnit)}`;
      drawer.addEventListener('cancel',()=>{drawerUnit=null;});
      drawer.showModal();
    }
    enhanceSelects(root);
    window.lucide?.createIcons();
    if (focus) { root.querySelector('h1')?.focus(); root.closest('.content').scrollTop=0; }
  }
  let toastTimer;
  function flash(message) {
    const el=root.querySelector('.tv-status');
    if(!el)return;
    el.textContent=message;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>{if(el.isConnected)el.textContent='';},2500);
  }
  // Keep native controls for FormData; render menus in the same DOM/top layer as their trigger.
  // This avoids native select popups being offset by embedded-browser scaling.
  function enhanceSelects(container) {
    container.querySelectorAll('select:not([data-enhanced])').forEach(select=>{
      select.dataset.enhanced='true';select.hidden=true;
      const label=select.closest('label').firstChild.textContent.trim();
      const wrap=document.createElement('span');wrap.className='tv-select';
      const trigger=document.createElement('button');trigger.type='button';trigger.className='tv-select-trigger';
      trigger.setAttribute('aria-label',label);trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
      const menu=document.createElement('span');menu.className='tv-select-menu';menu.hidden=true;menu.id=`select-${uid()}`;
      menu.setAttribute('role','listbox');menu.setAttribute('aria-label',label);trigger.setAttribute('aria-controls',menu.id);
      const choices=Array.from(select.options).map(option=>{
        const button=document.createElement('button');button.type='button';button.setAttribute('role','option');button.textContent=option.textContent;
        button.setAttribute('aria-selected',String(option.selected));button.tabIndex=-1;
        button.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));update();close(true);});
        menu.append(button);return button;
      });
      function update(){trigger.textContent=select.selectedOptions[0]?.textContent || '';choices.forEach((b,i)=>b.setAttribute('aria-selected',String(select.options[i].selected)));}
      function close(focus=false){menu.hidden=true;trigger.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',dismiss);document.removeEventListener('scroll',scrolled,true);if(focus)trigger.focus();}
      const outside=e=>{if(!wrap.contains(e.target))close();};
      const dismiss=()=>close();
      const scrolled=e=>{if(!menu.contains(e.target))close();};
      function open(){
        root.querySelectorAll('.tv-select-trigger[aria-expanded=true]').forEach(b=>b.click());
        const rect=trigger.getBoundingClientRect();const below=window.innerHeight-rect.bottom-12,above=rect.top-12;
        const upwards=below<180&&above>below;const height=Math.min(240,upwards?above:below);
        menu.style.width=`${rect.width}px`;menu.style.left=`${rect.left}px`;menu.style.maxHeight=`${Math.max(80,height)}px`;
        menu.style.top=upwards?'auto':`${rect.bottom+5}px`;menu.style.bottom=upwards?`${window.innerHeight-rect.top+5}px`:'auto';
        menu.hidden=false;trigger.setAttribute('aria-expanded','true');
        choices[select.selectedIndex]?.focus();
        document.addEventListener('pointerdown',outside);window.addEventListener('resize',dismiss);document.addEventListener('scroll',scrolled,true);
      }
      trigger.addEventListener('click',()=>menu.hidden?open():close());
      trigger.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();open();}});
      menu.addEventListener('keydown',e=>{
        const i=choices.indexOf(document.activeElement);
        if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();choices[e.key==='Home'?0:e.key==='End'?choices.length-1:(i+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length].focus();}
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}
        if(e.key==='Tab')close();
        if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){const match=choices.find(b=>b.textContent.toLowerCase().startsWith(e.key.toLowerCase()));match?.focus();}
      });
      select.addEventListener('change',update);
      wrap.append(trigger,menu);select.after(wrap);update();
    });
  }
  function modal(title, body, onSubmit) {
    const d=root.querySelector('dialog'); const previous=document.activeElement;
    d.innerHTML=`<form id="tv-modal-form"><div class="tv-row"><h2 id="tv-dialog-title">${title}</h2>${btn('Close','close')}</div>${body}<p class="tv-error" role="alert" id="tv-form-error"></p><div class="tv-footer">${btn('Cancel','close')}<button class="primary" type="submit">Save</button></div></form>`;
    d.addEventListener('close',()=>previous?.isConnected && previous.focus(),{once:true});
    d.querySelector('form').addEventListener('submit',e=>{e.preventDefault();onSubmit(new FormData(e.target),d);});
    d.showModal();
    enhanceSelects(d);
  }
  function editUnit(id, parentId = 'org') {
    const u=state.units.find(x=>x.id===id); const descendants=new Set([id]);
    let changed=true; while(changed) { changed=false; state.units.forEach(x=>{if(descendants.has(x.parentId)&&!descendants.has(x.id)){descendants.add(x.id);changed=true;}}); }
    modal(u?'Edit Organization Unit':`Add unit under ${esc(parentId==='org'?state.org.name:state.units.find(x=>x.id===parentId).name)}`,`<label>Unit name<input name="name" maxlength="80" required value="${esc(u?.name || '')}"></label><div class="tv-grid two"><label>Unit type<select name="type">${options(['Team','Branch','Region','Department','Other'],u?.type || 'Team')}</select></label>${u?`<label>Parent unit<select name="parentId">${[{id:'org',name:state.org.name},...state.units.filter(x=>!descendants.has(x.id)).map(x=>({id:x.id,name:path(x.id)}))].map(x=>`<option value="${x.id}" ${x.id===(u?.parentId || 'org')?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>`:`<input type="hidden" name="parentId" value="${parentId}">`}</div>`, (f,d)=>{
      if (!f.get('name').trim()) {d.querySelector('#tv-form-error').textContent='Enter a unit name.';return;}
      if(state.units.some(x=>x.id!==id&&x.parentId===f.get('parentId')&&x.name.toLowerCase()===f.get('name').trim().toLowerCase())){d.querySelector('#tv-form-error').textContent='A unit with this name already exists under this parent.';return;}
      const value={id:u?.id || uid(),name:f.get('name').trim(),type:f.get('type'),parentId:f.get('parentId')};
      if(u) Object.assign(u,value);else state.units.push(value);d.close();save();render();flash('Saved');
    });
  }
  function editMember(id, defaultUnit = 'org') {
    const m=state.members.find(x=>x.id===id);
    // Explicit grants stay separate from inherited coverage, including while covered by an ancestor.
    const grants = new Map((m?.scopes || []).map(s=>[s.unitId, {...s}]));
    const scopeNodes = [{id:'org',name:state.org.name,parentId:null},...state.units];
    function inheritedFrom(id) {
      let parent=scopeNodes.find(u=>u.id===id)?.parentId;
      while(parent) {
        if(grants.get(parent)?.includeSubUnits)return parent;
        parent=scopeNodes.find(u=>u.id===parent)?.parentId;
      }
      return null;
    }
    function scopeTree(parent=null) {
      return `<ul class="tv-scope-tree">${scopeNodes.filter(u=>u.parentId===parent).map(u=>`<li><div class="tv-scope-row" data-scope-id="${u.id}"><label class="tv-check"><input type="checkbox" name="scope" value="${u.id}" aria-label="${esc(path(u.id))}"><strong>${esc(u.name)}</strong></label><small class="tv-scope-inherited"></small><label class="tv-check tv-scope-include"><input type="checkbox" name="include-${u.id}" aria-label="Include sub-units of ${esc(path(u.id))}">Include sub-units</label></div>${scopeNodes.some(x=>x.parentId===u.id)?scopeTree(u.id):''}</li>`).join('')}</ul>`;
    }
    let matched = null;
    modal(m?'Edit member':'Add member',`<label>Email<input type="email" name="email" required autocomplete="off" maxlength="254" placeholder="name@example.com" value="${esc(m?.email || '')}" ${m?'readonly':''}></label><div id="tv-account-result" aria-live="polite"></div>${state.units.length?`<details class="tv-advanced" ${(m && m.unitId!=='org') || defaultUnit!=='org'?'open':''}><summary>Assign to unit</summary><label>Organization Unit<select name="unitId">${unitOptions(m?.unitId || defaultUnit)}</select></label></details>`:'<input type="hidden" name="unitId" value="org">'}<div class="tv-grid two"><label>Organization Access<select name="access">${options(id==='self'?['Owner']:['Admin','Member'],m?.access || 'Member')}</select></label><label>Business Role<select name="role">${options(['Agent','Manager'],m?.role || 'Agent')}</select></label></div><div id="tv-management" ${m?.role==='Manager'?'':'hidden'}><h3>Management Scope</h3><div class="tv-scope">${scopeTree()}</div></div>`, (f,d)=>{
      const role=f.get('role'), selected=[...grants.keys()];
      const email=f.get('email').trim().toLowerCase();
      const error=text=>d.querySelector('#tv-form-error').textContent=text;
      if(!m&&state.members.some(x=>x.email.toLowerCase()===email)){error('Already a member.');return;}
      if(!m&&state.invites.some(x=>x.email===email)){error('An invitation is already pending.');return;}
      const account=directory.find(x=>x.email===email);
      if(!m&&account&&matched!==email){error('Select the matching account to continue.');return;}
      if(role==='Manager'&&!selected.length){error('Select at least one management unit.');return;}
      const value={id:m?.id || uid(),email,name:m?.name || account?.name || email,unitId:f.get('unitId'),access:f.get('access'),role,scopes:role==='Manager'?selected.map(unitId=>({...grants.get(unitId)})):[]};
      if(m) Object.assign(m,value);
      else if(account) state.members.push(value);
      else state.invites.push({...value,status:'pending',sentAt:new Date().toISOString()});
      d.close();save();render();flash(m?'Saved':account?'Member added':'Invitation sent');
    });
    const d=root.querySelector('dialog'), emailInput=d.querySelector('[name=email]'), result=d.querySelector('#tv-account-result'), submit=d.querySelector('[type=submit]');
    function lookup() {
      if(m)return;
      matched=null;
      const email=emailInput.value.trim().toLowerCase();
      submit.disabled=true;submit.textContent='Add member';result.replaceChildren();
      d.querySelector('#tv-form-error').textContent='';
      if(!email || !emailInput.validity.valid)return;
      if(state.members.some(x=>x.email.toLowerCase()===email)){result.textContent='Already a member';return;}
      if(state.invites.some(x=>x.email===email)){result.textContent='Invitation pending';return;}
      const account=directory.find(x=>x.email===email);
      if(account){
        const choice=document.createElement('button');choice.type='button';choice.className='tv-account-choice';
        choice.innerHTML=`<strong>${esc(account.name)}</strong><small>${esc(account.email)}</small>`;
        choice.addEventListener('click',()=>{matched=email;choice.setAttribute('aria-pressed','true');submit.disabled=false;});
        result.append(choice);
      } else {submit.textContent='Send invitation';submit.disabled=false;}
    }
    emailInput.addEventListener('input',lookup);
    if(!m)lookup();
    d.querySelector('[name=role]').addEventListener('change',e=>d.querySelector('#tv-management').hidden=e.target.value!=='Manager');
    function updateScopeTree() {
      d.querySelectorAll('[data-scope-id]').forEach(row=>{
        const id=row.dataset.scopeId, source=inheritedFrom(id), grant=grants.get(id);
        const check=row.querySelector('[name=scope]'), include=row.querySelector('[name^=include]');
        check.checked=!!source || !!grant;check.disabled=!!source;
        include.checked=!!source || !!grant?.includeSubUnits;include.disabled=!!source || !grant;
        row.classList.toggle('is-inherited',!!source);
        row.querySelector('.tv-scope-inherited').textContent=source?`Inherited from ${scopeNodes.find(u=>u.id===source).name}`:'';
        row.querySelector('.tv-scope-include').hidden=!!source;
      });
    }
    d.querySelectorAll('[data-scope-id]').forEach(row=>{
      const id=row.dataset.scopeId;
      row.querySelector('[name=scope]').addEventListener('change',e=>{
        if(e.target.checked)grants.set(id,{unitId:id,includeSubUnits:false});else grants.delete(id);
        updateScopeTree();
      });
      row.querySelector('[name^=include]').addEventListener('change',e=>{
        if(grants.has(id))grants.get(id).includeSubUnits=e.target.checked;
        updateScopeTree();
      });
    });
    updateScopeTree();
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]'); if(!b)return; const a=b.dataset.action,id=b.dataset.id;
    if(a==='close-drawer'){drawerUnit=null;root.querySelector('#tv-member-drawer').close();return;}
    if(a==='unit-members'){drawerUnit=id;render();return;}
    if(a==='add-child'){editUnit(undefined,id);return;}
    if(a==='add-node-member'){editMember(undefined,id);return;}
    if(a==='close'){root.querySelector('dialog').close();return;}
    if(a==='add-unit'||a==='edit-unit'){editUnit(id);return;}
    if(a==='add-member'||a==='edit-member'){editMember(id);return;}
    if(a==='remove-unit') {
      const blocked=state.units.some(x=>x.parentId===id)||[...state.members,...state.invites].some(m=>m.unitId===id||m.scopes.some(s=>s.unitId===id));
      modal(blocked?'Cannot delete unit':'Delete unit?',`<p>${blocked?'Move its members, child units and management scopes before deleting this unit.':`Delete ${esc(state.units.find(u=>u.id===id)?.name)}?`}</p>`,(f,d)=>{if(!blocked){state.units=state.units.filter(x=>x.id!==id);d.close();save();render();flash('Unit deleted');}});
      const submit=root.querySelector('dialog [type=submit]');submit.textContent='Delete';submit.className='listing-action confirm-danger';submit.hidden=blocked;return;
    }
    if(a==='resend'){const i=state.invites.find(x=>x.id===id);i.sentAt=new Date().toISOString();save();flash('Invitation resent');return;}
    if(a==='revoke'){modal('Revoke invitation?',`<p>${esc(state.invites.find(x=>x.id===id).email)}</p>`,(f,d)=>{state.invites=state.invites.filter(x=>x.id!==id);d.close();save();render();flash('Invitation revoked');});root.querySelector('dialog [type=submit]').textContent='Revoke';root.querySelector('dialog [type=submit]').className='listing-action confirm-danger';return;}
    if(a==='remove-member'){
      const member=state.members.find(m=>m.id===id);
      if(!member || member.access==='Owner' || member.id==='self')return;
      modal('Remove member?',`<p>Remove ${esc(member.name)} from ${esc(state.org.name)}?</p><p>Their Pislaka account will remain available.</p>`,(f,d)=>{state.members=state.members.filter(m=>m.id!==id);d.close();save();render();flash('Member removed');});
      const submit=root.querySelector('dialog [type=submit]');submit.textContent='Remove';submit.className='listing-action confirm-danger';return;
    }
    if(a==='reset-organization'){
      modal('Reset organization?', '<p>This clears the organization, units, members and pending invitations saved in this browser so you can start again.</p>', (f,d)=>{
        d.close();clearTimeout(toastTimer);
        state={version:1,org:null,units:[],members:[],invites:[],step:0,complete:false};
        page='setup';tab='structure';drawerUnit=null;answer='';status='';save();render(true);
      });
      const submit=root.querySelector('dialog [type=submit]');submit.textContent='Reset organization';submit.className='listing-action confirm-danger';return;
    }
    if(a==='exit'){save();showView('home');return;}
    if(a==='start'){state.step=1;page='setup';}
    if(a==='back'){if(page==='settings'){page='home';}else if(state.org && state.step===1){save();showView('home');return;}else state.step=Math.max(0,state.step-1);}
    if(a==='next'){
      if(state.step===3){
        const unitExists=id=>id==='org'||state.units.some(u=>u.id===id);
        const valid=state.org?.name?.trim() && state.members.some(m=>m.id===state.org.ownerId&&m.access==='Owner') && [...state.members,...state.invites].every(m=>unitExists(m.unitId)&&(m.role!=='Manager'||(m.scopes.length>0&&m.scopes.every(s=>unitExists(s.unitId)))));
        if(!valid){flash('Check member assignments and management scopes before completing setup.');return;}
        state.complete=true;page='home';
      }else state.step++;
    }
    if(a==='settings'){page='settings';tab='structure';}
    if(a==='tab')tab=id;
    if(a==='home')page='home';
    if(a==='template'){
      if(id==='simple')state.units.push({id:uid(),name:'Main Team',type:'Team',parentId:'org'});
      if(id==='branches'){const branch=uid();state.units.push({id:branch,name:'Lahore Branch',type:'Branch',parentId:'org'},{id:uid(),name:'Sales Team',type:'Team',parentId:branch});}
      if(id==='custom'){editUnit();return;}
    }
    if(a==='question'){
      const replies=[`Your organization has ${state.members.length} members and ${state.members.filter(m=>m.role==='Manager').length} managers. No team activity is available yet.`, 'No follow-up activity is available yet.', `${state.units.filter(u=>u.type==='Branch').length} branches. No performance data is available yet.`];answer=replies[Number(id)];
    }
    save();render(a!=='question'&&a!=='template');
  });
  window.TeamV1={open(){if(!state.complete)page='setup';render();}};
  if(location.hash==='#team')showView('team');
})();
