/* Team V1: isolated, local-only organization prototype. No API calls. */
(() => {
  'use strict';
  const KEY = 'pislaka.team-v1.v1';
  const root = document.getElementById('team-view');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => crypto.randomUUID();
  let state = {version:1, org:null, units:[], members:[], step:0, complete:false};
  let selectedUnit = 'org', includeDescendants = true, searchText = '', roleFilter = 'All', statusFilter = 'All';
  const collapsedUnits = new Set();
  let page = 'setup', tab = 'organization', status = '', answer = '';
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.version === 1 && Array.isArray(saved.units) && Array.isArray(saved.members)) state = saved; } catch { status = 'Saved organization data could not be read.'; }
  state.invites ||= [];
  // Resume legacy Structure, Members and Review drafts in the combined workspace.
  state.step = Math.min(state.step, 2);
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
  const stepNames = ['Organization details','Organization & Members'];
  function header(title, copy, action='') { return `<header class="tv-header"><div><span class="tv-kicker">Pislaka / Team</span><h1 tabindex="-1">${title}</h1>${copy ? `<p>${copy}</p>` : ''}</div>${action}</header>`; }
  const deleteButton = (label, action, id) => btn('<i data-lucide="trash-2" aria-hidden="true"></i>',action,'listing-action danger icon-only',`data-id="${id}" aria-label="${esc(label)}" data-tooltip="${esc(label)}"`);
  const unitName = id => id==='org' ? state.org.name : state.units.find(u=>u.id===id)?.name || state.org.name;
  function resetFilters(role='All') { selectedUnit='org'; includeDescendants=true; searchText=''; roleFilter=role; statusFilter=role==='Manager'?'Active':'All'; }
  function descendantsOf(id) {
    const ids=new Set([id]);let changed=true;
    while(changed){changed=false;state.units.forEach(u=>{if(ids.has(u.parentId)&&!ids.has(u.id)){ids.add(u.id);changed=true;}});}
    return ids;
  }
  function treeNode(id) {
    const name=unitName(id), children=state.units.filter(u=>u.parentId===id), expanded=!collapsedUnits.has(id);
    const count=state.members.filter(m=>m.unitId===id).length;
    return `<li><div class="tv-linked-node ${selectedUnit===id?'is-selected':''}">
      ${children.length?btn(`<i data-lucide="${expanded?'chevron-down':'chevron-right'}" aria-hidden="true"></i>`,'toggle-unit','tv-tree-toggle',`data-id="${id}" aria-label="${expanded?'Collapse':'Expand'} ${esc(name)}" aria-expanded="${expanded}" aria-controls="children-${id}"`):'<span class="tv-tree-spacer"></span>'}
      ${btn(esc(name),'select-unit','tv-tree-name',`data-id="${id}" aria-label="Select ${esc(path(id))}" ${selectedUnit===id?'aria-current="true"':''}`)}
      <span class="tv-tree-count" title="Direct members" aria-label="${count} direct members"><i data-lucide="users" aria-hidden="true"></i>${count}</span>
      <span class="tv-tree-tools">${btn('<i data-lucide="plus" aria-hidden="true"></i>','add-child','tv-tree-icon',`data-id="${id}" aria-label="Add unit under ${esc(name)}" title="Add sub-unit"`)}${id==='org'?'':`${btn('<i data-lucide="pencil" aria-hidden="true"></i>','edit-unit','tv-tree-icon',`data-id="${id}" aria-label="Edit ${esc(name)}" title="Edit unit"`)}${btn('<i data-lucide="trash-2" aria-hidden="true"></i>','remove-unit','tv-tree-icon tv-tree-danger',`data-id="${id}" aria-label="Delete ${esc(name)}" title="Delete unit"`)}`}</span>
    </div>${children.length?`<ul id="children-${id}" ${expanded?'':'hidden'}>${children.map(u=>treeNode(u.id)).join('')}</ul>`:''}</li>`;
  }
  function memberResults() {
    const visibleUnits=selectedUnit==='org'?descendantsOf('org'):new Set([selectedUnit]);
    const matches=m=>visibleUnits.has(m.unitId)&&(roleFilter==='All'||m.role===roleFilter)&&`${m.displayName || ''} ${m.name} ${m.email}`.toLowerCase().includes(searchText.trim().toLowerCase());
    const list=statusFilter==='Pending'?[]:state.members.filter(matches);
    const invites=statusFilter==='Active'?[]:state.invites.filter(matches);
    const row=(m,pending=false)=>{
      const name=m.displayName || m.name || m.email;
      return `<article class="tv-member tv-member-compact"><div class="tv-member-identity"><strong>${esc(name)}${m.id==='self'?' (you)':''}</strong>${name!==m.email?`<small>${esc(m.email)}</small>`:''}${selectedUnit==='org'?`<small class="tv-compact-unit">${esc(unitName(m.unitId))}</small>`:''}</div><div class="tv-member-meta"><span>${esc(m.role)}</span>${m.access!=='Member'?`<small>${esc(m.access)}</small>`:''}${pending?'<small class="tv-pending-label">Pending</small>':''}</div><div class="tv-actions">${pending?`${btn('Resend','resend','listing-action',`data-id="${m.id}"`)}${deleteButton('Revoke invitation','revoke',m.id)}`:`${btn('Edit','edit-member','listing-action',`data-id="${m.id}" aria-label="Edit member ${esc(name)}"`)}${m.access!=='Owner'&&m.id!=='self'?deleteButton('Remove member','remove-member',m.id):''}`}</div></article>`;
    };
    return {html:list.length+invites.length?list.map(m=>row(m)).join('')+invites.map(m=>row(m,true)).join(''):'<div class="tv-results-empty">No matching members.</div>'};
  }
  function refreshResults() {
    const container=root.querySelector('#tv-member-results');if(!container)return;
    searchText=root.querySelector('#tv-member-search')?.value ?? searchText;
    container.innerHTML=memberResults().html;
    window.lucide?.createIcons();
  }
  function filterGroup(label,action,values,current) {
    return `<div class="tv-filter-options" role="group" aria-label="${label}">${values.map(value=>btn(value,action,'tv-filter-choice',`data-id="${value}" aria-pressed="${current===value}"`)).join('')}</div>`;
  }
  function organizationWorkspace() {
    if(selectedUnit!=='org'&&!state.units.some(u=>u.id===selectedUnit))resetFilters();
    return `<div class="tv-linked-workspace"><section class="tv-linked-structure" aria-label="Organization structure"><h2>Organization structure</h2>${!state.units.length?`<div class="tv-tree-templates">${[['simple','Simple Team'],['branches','Teams & Branches'],['custom','Custom Structure']].map(([id,title])=>btn(title,'template','',`data-id="${id}"`)).join('')}</div>`:''}<ul class="tv-linked-tree">${treeNode('org')}</ul></section>
      <section class="tv-linked-members" aria-label="Unit member list"><header class="tv-row"><h2>Members</h2>${btn('<i data-lucide="plus" aria-hidden="true"></i>Add member','add-member','listing-action primary')}</header>
      <div class="tv-member-filters"><input type="search" id="tv-member-search" aria-label="Search members" placeholder="Name or email" value="${esc(searchText)}">${filterGroup('Business Role','filter-role',['All','Agent','Manager'],roleFilter)}${filterGroup('Status','filter-status',['All','Active','Pending'],statusFilter)}</div><div id="tv-member-results">${memberResults().html}</div></section></div>`;
  }
  function organizationForm() { return `<form id="tv-org-form" class="tv-card"><h2>${state.org ? 'Organization details' : 'Create your organization'}</h2><label>Organization name<input name="name" required maxlength="80" placeholder="e.g. Prime Estates" value="${esc(state.org?.name || '')}" /></label><div class="tv-grid two"><label>Country / Region<select name="country">${options(['Pakistan','United Arab Emirates','Saudi Arabia','United Kingdom','China','Other'],state.org?.country || 'Pakistan')}</select></label></div>${page === 'settings' ? `<details class="tv-advanced"><summary>Advanced settings</summary><label>Time zone<select name="timezone">${options(Object.values(zones),state.org?.timezone || 'Asia/Karachi')}</select></label></details>` : ''}<div class="tv-footer">${btn('Back','back')}<button class="primary" type="submit">${page === 'settings' ? 'Save details' : state.org ? 'Save & Continue' : 'Create & Continue'}</button></div></form>`; }
  function render(focus = false) {
    let html = '';
    if (!state.org && state.step === 0) html = header('Team','') + `<div class="tv-card tv-empty"><div class="tv-symbol"><i data-lucide="network"></i></div><h1>Build your team in Pislaka</h1>${btn('Set up Organization →','start','primary')}</div>`;
    else if (page === 'home' && state.complete) html = header('Your Team Agent',`A shared view of ${esc(state.org.name)}.`,btn('Organization Settings','settings')) + `<div class="tv-grid">${btn(`<h3>Organization</h3><p>${esc(state.org.name)}</p>`,'open-summary','tv-card tv-summary-card','data-id="organization" aria-label="Open organization settings"')}${btn(`<h3>Members</h3><div class="tv-stat">${state.members.length}</div>`,'open-summary','tv-card tv-summary-card','data-id="members" aria-label="View all members"')}${btn(`<h3>Managers</h3><div class="tv-stat">${state.members.filter(m=>m.role==='Manager').length}</div>`,'open-summary','tv-card tv-summary-card','data-id="managers" aria-label="View managers"')}</div><div class="tv-card"><span class="tv-kicker">Start a conversation</span><h2 style="margin-top:12px">What needs your team's attention?</h2><div class="tv-grid">${['What are my team priorities today?','Which agents need follow-up support?','How is each branch performing?'].map((q,i)=>btn(q,'question','tv-template',`data-id="${i}"`)).join('')}</div>${answer ? `<div class="tv-note tv-answer" role="status">${esc(answer)}</div>` : ''}</div>`;
    else if (page === 'settings') html = header('Organization Settings',esc(state.org.name),btn('← Team Agent','home')) + `<div class="tv-settings-toolbar"><nav class="tv-tabs" aria-label="Organization settings">${[['details','Details'],['organization','Organization & Members']].map(([id,label])=>btn(label,'tab','',`data-id="${id}" ${tab===id?'aria-current="page"':''}`)).join('')}</nav></div>${tab === 'details' ? organizationForm() : organizationWorkspace()}`;
    else html = header('Set up your organization','',btn('Save & exit','exit')) + `<ol class="tv-steps">${stepNames.map((s,i)=>`<li class="${state.step===i+1?'current':''}" ${state.step===i+1?'aria-current="step"':''}><span>0${i+1}</span>${s}</li>`).join('')}</ol>${state.step === 1 ? organizationForm() : organizationWorkspace()}${state.step>1 ? `<div class="tv-footer">${btn('← Back','back')}${btn('Complete setup →','next','primary')}</div>` : ''}`;
    if(state.org) html += `<div class="tv-section-toolbar">${btn('<i data-lucide="rotate-ccw" aria-hidden="true"></i>Reset organization','reset-organization','listing-action')}</div>`;
    root.innerHTML = html + `<p class="tv-status" role="status">${esc(status)}</p><dialog id="tv-dialog" aria-labelledby="tv-dialog-title"></dialog>`;
    root.querySelector('#tv-org-form')?.addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target); const name = f.get('name').trim();
      if (!name) { e.target.elements.name.setCustomValidity('Enter an organization name.'); e.target.elements.name.reportValidity(); return; }
      state.org = {...state.org, id:state.org?.id || uid(), name, country:f.get('country'), timezone:f.get('timezone') || (state.org?.country === f.get('country') ? state.org.timezone : zones[f.get('country')]), ownerId:'self'};
      if (!state.members.length) state.members.push({id:'self',name:'Ayesha Khan',email:directory[0].email,unitId:'org',access:'Owner',role:'Agent',scopes:[]});
      if (page !== 'settings') state.step=2; save(); render(true); if(page==='settings')flash('Saved');
    });
    root.querySelector('[name=country]')?.addEventListener('change',e=>{const zone=root.querySelector('[name=timezone]');if(zone){zone.value=zones[e.target.value];zone.dispatchEvent(new Event('change'));}});
    root.querySelector('[name=name]')?.addEventListener('input',e=>e.target.setCustomValidity(''));
    ['input','search','change'].forEach(event=>root.querySelector('#tv-member-search')?.addEventListener(event,e=>{searchText=e.target.value;refreshResults();}));
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
    modal(u?'Edit Organization Unit':`Add unit under ${esc(parentId==='org'?state.org.name:state.units.find(x=>x.id===parentId).name)}`,`<label>Unit name<input name="name" maxlength="80" required value="${esc(u?.name || '')}"></label><div class="tv-grid two"><label>Unit type (optional)<select name="type"><option value="">Not specified</option>${options(['Team','Branch','Region','Department','Other'],u?.type || '')}</select></label>${u?`<label>Parent unit<select name="parentId">${[{id:'org',name:state.org.name},...state.units.filter(x=>!descendants.has(x.id)).map(x=>({id:x.id,name:path(x.id)}))].map(x=>`<option value="${x.id}" ${x.id===(u?.parentId || 'org')?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>`:`<input type="hidden" name="parentId" value="${parentId}">`}</div>`, (f,d)=>{
      if (!f.get('name').trim()) {d.querySelector('#tv-form-error').textContent='Enter a unit name.';return;}
      if(state.units.some(x=>x.id!==id&&x.parentId===f.get('parentId')&&x.name.toLowerCase()===f.get('name').trim().toLowerCase())){d.querySelector('#tv-form-error').textContent='A unit with this name already exists under this parent.';return;}
      const value={id:u?.id || uid(),name:f.get('name').trim(),type:f.get('type'),parentId:f.get('parentId')};
      if(u) Object.assign(u,value);else state.units.push(value);
      let ancestor=value.parentId;while(ancestor){collapsedUnits.delete(ancestor);ancestor=state.units.find(x=>x.id===ancestor)?.parentId;}
      d.close();save();render();flash('Saved');
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
    modal(m?'Edit member':'Add member',`<label>Email<input type="email" name="email" required autocomplete="off" maxlength="254" placeholder="name@example.com" value="${esc(m?.email || '')}" ${m?'readonly':''}></label><div id="tv-account-result" aria-live="polite"></div><label>Display name (optional)<input name="displayName" maxlength="80" value="${esc(m?.displayName || '')}" placeholder="Name used in this organization"></label><label>Organization Unit<select name="unitId">${unitOptions(m?.unitId || defaultUnit)}</select></label><div class="tv-grid two"><label>Organization Access<select name="access">${options(id==='self'?['Owner']:['Admin','Member'],m?.access || 'Member')}</select></label><label>Business Role<select name="role">${options(['Agent','Manager'],m?.role || 'Agent')}</select></label></div><div id="tv-management" ${m?.role==='Manager'?'':'hidden'}><h3>Management Scope</h3><div class="tv-scope">${scopeTree()}</div></div>`, (f,d)=>{
      const role=f.get('role'), selected=[...grants.keys()];
      const email=f.get('email').trim().toLowerCase();
      const error=text=>d.querySelector('#tv-form-error').textContent=text;
      if(!m&&state.members.some(x=>x.email.toLowerCase()===email)){error('Already a member.');return;}
      if(!m&&state.invites.some(x=>x.email===email)){error('An invitation is already pending.');return;}
      const account=directory.find(x=>x.email===email);
      if(!m&&account&&matched!==email){error('Select the matching account to continue.');return;}
      if(role==='Manager'&&!selected.length){error('Select at least one management unit.');return;}
      const value={id:m?.id || uid(),email,displayName:f.get('displayName').trim(),name:m?.name || account?.name || email,unitId:f.get('unitId'),access:f.get('access'),role,scopes:role==='Manager'?selected.map(unitId=>({...grants.get(unitId)})):[]};
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
    if(a==='toggle-unit'){
      if(collapsedUnits.has(id))collapsedUnits.delete(id);else collapsedUnits.add(id);
      const children=root.querySelector(`[id="children-${id}"]`);children.hidden=collapsedUnits.has(id);
      b.setAttribute('aria-expanded',String(!children.hidden));b.setAttribute('aria-label',`${children.hidden?'Expand':'Collapse'} ${unitName(id)}`);
      b.innerHTML=`<i data-lucide="${children.hidden?'chevron-right':'chevron-down'}" aria-hidden="true"></i>`;window.lucide?.createIcons();return;
    }
    if(a==='filter-role'||a==='filter-status'){
      if(a==='filter-role')roleFilter=id;else statusFilter=id;
      root.querySelectorAll(`[data-action="${a}"]`).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.id===id)));
      refreshResults();return;
    }
    if(a==='select-unit'){selectedUnit=id;includeDescendants=id==='org';render();root.querySelector('.tv-tree-name[aria-current=true]')?.focus();return;}
    if(a==='open-summary'){page='settings';tab='organization';resetFilters(id==='managers'?'Manager':'All');render(true);return;}
    if(a==='add-child'){editUnit(undefined,id);return;}
    if(a==='close'){root.querySelector('dialog').close();return;}
    if(a==='add-unit'||a==='edit-unit'){editUnit(id);return;}
    if(a==='add-member'||a==='edit-member'){editMember(id,selectedUnit);return;}
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
        page='setup';tab='organization';resetFilters();collapsedUnits.clear();answer='';status='';save();render(true);
      });
      const submit=root.querySelector('dialog [type=submit]');submit.textContent='Reset organization';submit.className='listing-action confirm-danger';return;
    }
    if(a==='exit'){save();showView('home');return;}
    if(a==='start'){state.step=1;page='setup';}
    if(a==='back'){if(page==='settings'){page='home';}else if(state.org && state.step===1){save();showView('home');return;}else state.step=Math.max(0,state.step-1);}
    if(a==='next'){
      if(state.step===2){
        const unitExists=id=>id==='org'||state.units.some(u=>u.id===id);
        const valid=state.org?.name?.trim() && state.members.some(m=>m.id===state.org.ownerId&&m.access==='Owner') && [...state.members,...state.invites].every(m=>unitExists(m.unitId)&&(m.role!=='Manager'||(m.scopes.length>0&&m.scopes.every(s=>unitExists(s.unitId)))));
        if(!valid){flash('Check member assignments and management scopes before completing setup.');return;}
        state.complete=true;page='home';
      }else state.step++;
    }
    if(a==='settings'){page='settings';tab='organization';resetFilters();}
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
