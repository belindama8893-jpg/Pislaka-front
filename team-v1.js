/* Team V1: isolated, local-only organization prototype. No API calls. */
(() => {
  'use strict';
  const KEY = 'pislaka.team-v1.v1';
  const root = document.getElementById('team-view');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => crypto.randomUUID();
  let state = {version:1, org:null, units:[], members:[], step:0, complete:false};
  let page = 'setup', tab = 'structure', status = '', answer = '';
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.version === 1 && Array.isArray(saved.units) && Array.isArray(saved.members)) state = saved; } catch { status = 'Saved demo data could not be read. You can start a new organization.'; }
  if (state.complete) page = 'home';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); status = 'Saved on this browser'; } catch { status = 'Browser storage unavailable. Changes last for this session only.'; } };
  const btn = (label, action, cls = '', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const options = (values, current) => values.map(v => `<option value="${esc(v)}" ${v === current ? 'selected' : ''}>${esc(v)}</option>`).join('');
  const path = id => { if (id === 'org' || !id) return state.org?.name || 'Organization'; const u = state.units.find(x => x.id === id); return u ? `${path(u.parentId)} / ${u.name}` : 'Unassigned'; };
  const unitOptions = current => [{id:'org',name:state.org.name},...state.units.map(u => ({id:u.id,name:path(u.id)}))].map(u => `<option value="${u.id}" ${current === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('');
  const scopeText = m => m.role !== 'Manager' ? 'No management scope · Agent' : m.scopes.map(s => `${path(s.unitId)}${s.includeSubUnits ? ' + sub-units' : ' (direct members only)'}`).join('; ') || 'Management scope required';
  const stepNames = ['Organization','Structure','Members','Review'];
  function header(title, copy, action='') { return `<header class="tv-header"><div><span class="tv-kicker">Pislaka / Team</span><h1 tabindex="-1">${title}</h1><p>${copy}</p></div>${action}</header>`; }
  function tree(parent = 'org') { return state.units.filter(u => u.parentId === parent).map(u => `<li><div class="tv-node"><div><strong>${esc(u.name)}</strong><small>${esc(u.type)}</small></div>${btn('Edit','edit-unit','tv-link',`data-id="${u.id}"`)}</div><ul>${tree(u.id)}</ul></li>`).join(''); }
  function structure() { return `<div class="tv-card"><div class="tv-row"><div><h2>Organization structure</h2><p>Start simple. Members can belong directly to your organization.</p></div>${btn('+ Add Organization Unit','add-unit')}</div>${!state.units.length ? `<div class="tv-grid">${[['simple','Simple Team','One team, with room to grow.'],['branches','Teams & Branches','A branch with a team inside.'],['custom','Custom Structure','Build your own hierarchy.']].map(([id,title,desc]) => btn(`<strong>${title}</strong><small>${desc}</small>`,'template','tv-template',`data-id="${id}"`)).join('')}</div>` : ''}<ul class="tv-tree"><li><div class="tv-node"><div><strong>${esc(state.org.name)}</strong><small>Organization · ${state.members.filter(m=>m.unitId==='org').length} direct members</small></div><span class="tv-badge">Root</span></div><ul>${tree()}</ul></li></ul><small>Units are optional. Add Team, Branch, Region, Department or Other at any level.</small></div>`; }
  function members(accessOnly = false) { return `<div class="tv-card"><div class="tv-row"><div><h2>${accessOnly ? 'Roles & Access' : 'Members'}</h2><p>${accessOnly ? 'Organization administration and business management are separate.' : 'Add people, assign their home unit and define who they manage.'}</p></div>${btn('+ Add mock member','add-member')}</div>${accessOnly ? `<div class="tv-grid"><div><h3>Organization Access</h3><p>Owner / Admin / Member<br>Who can configure the organization.</p></div><div><h3>Business Role</h3><p>Manager / Agent<br>What a person does in the business.</p></div><div><h3>Management Scope</h3><p>Selected units + Include sub-units<br>Which business a Manager can access.</p></div></div>` : ''}${state.members.map(m => `<div class="tv-member"><div class="tv-row"><div class="tv-person"><span class="tv-avatar">${esc(m.name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</span><div><strong>${esc(m.name)}${m.id === 'self' ? ' (you)' : ''}</strong><small>${esc(path(m.unitId))}</small></div></div>${btn('Edit','edit-member','',`data-id="${m.id}"`)}</div><p style="margin:12px 0 4px"><span class="tv-badge">${m.access}${m.access === 'Owner' ? ' · Admin permissions' : ''}</span> <span class="tv-badge">${m.role}</span></p><small>${esc(scopeText(m))}</small></div>`).join('')}</div>`; }
  function organizationForm() { return `<form id="tv-org-form" class="tv-card"><h2>${state.org ? 'Organization details' : 'Create your organization'}</h2><p>Use your existing Pislaka account. The creator becomes Owner, with Admin permissions.</p><label>Organization name<input name="name" required maxlength="80" placeholder="e.g. Prime Estates" value="${esc(state.org?.name || '')}" /></label><div class="tv-grid two"><label>Country / Region<select name="country">${options(['Pakistan','United Arab Emirates','Saudi Arabia','United Kingdom','China','Other'],state.org?.country || 'Pakistan')}</select></label><label>Time zone<select name="timezone">${options(['Asia/Karachi','Asia/Dubai','Asia/Riyadh','Europe/London','Asia/Shanghai','UTC'],state.org?.timezone || 'Asia/Karachi')}</select></label></div><div class="tv-note">Ayesha Khan · Organization Owner<br><small>Owner includes Admin permissions. Your Business Role and Management Scope are configured separately.</small></div><div class="tv-footer">${btn('Back','back')}<button class="primary" type="submit">${page === 'settings' ? 'Save details' : state.org ? 'Save & Continue' : 'Create & Continue'}</button></div></form>`; }
  function review() { return `<div class="tv-card"><div class="tv-row"><h2>Review your organization</h2>${btn('Edit details','step','tv-link','data-id="1"')}</div><p>${esc(state.org.name)} · ${esc(state.org.country)} · ${esc(state.org.timezone)}</p><div class="tv-grid"><div><h3>Organization Units</h3><div class="tv-stat">${state.units.length}</div>${btn('Edit structure','step','tv-link','data-id="2"')}</div><div><h3>Members</h3><div class="tv-stat">${state.members.length}</div>${btn('Edit members','step','tv-link','data-id="3"')}</div><div><h3>Managers</h3><div class="tv-stat">${state.members.filter(m=>m.role==='Manager').length}</div></div></div><div class="tv-note">Owner: Ayesha Khan · includes Admin permissions.<br>No invitations will be sent. All members and business responses are demonstration data.</div></div>${members()}`; }
  function render(focus = false) {
    let html = '';
    if (!state.org && state.step === 0) html = header('Team','Your people. A shared view of the work.') + `<div class="tv-card tv-empty"><div class="tv-symbol"><i data-lucide="network"></i></div><span class="tv-kicker">Your organization starts here</span><h1>Build your team in Pislaka</h1><p>Bring your people together, define who manages whom, and give every manager the right view of the business.</p>${btn('Set up Organization →','start','primary')}<div class="tv-footer"><small>Already have an invitation? Invitation joining will be available in a future version.</small></div></div>`;
    else if (page === 'home' && state.complete) html = header('Your Team Agent',`A shared view of ${esc(state.org.name)}.`,btn('Organization Settings','settings')) + `<div class="tv-grid"><div class="tv-card"><h3>Organization</h3><p>${esc(state.org.name)}</p><small>You are Owner · Admin permissions</small></div><div class="tv-card"><h3>Members</h3><div class="tv-stat">${state.members.length}</div><small>Including you</small></div><div class="tv-card"><h3>Managers</h3><div class="tv-stat">${state.members.filter(m=>m.role==='Manager').length}</div><small>With defined management scope</small></div></div><div class="tv-card"><span class="tv-kicker">Start a conversation</span><h2 style="margin-top:12px">What needs your team's attention?</h2><p>Explore a few example management questions.</p><div class="tv-grid">${['What are my team priorities today?','Which agents need follow-up support?','How is each branch performing?'].map((q,i)=>btn(q,'question','tv-template',`data-id="${i}"`)).join('')}</div>${answer ? `<div class="tv-note tv-answer" role="status">${esc(answer)}</div>` : ''}</div>`;
    else if (page === 'settings') html = header('Organization Settings',esc(state.org.name),btn('← Team Agent','home')) + `<nav class="tv-tabs" aria-label="Organization settings">${[['details','Details'],['structure','Structure'],['members','Members'],['access','Roles & Access']].map(([id,label])=>btn(label,'tab','',`data-id="${id}" ${tab===id?'aria-current="page"':''}`)).join('')}</nav>${tab === 'details' ? organizationForm() : tab === 'structure' ? structure() : members(tab === 'access')}<small>Changes save on this browser when you save a form.</small>`;
    else html = header('Set up your organization','A little structure. Better teamwork.',btn('Save & exit','exit')) + `<ol class="tv-steps">${stepNames.map((s,i)=>`<li class="${state.step===i+1?'current':''}" ${state.step===i+1?'aria-current="step"':''}><span>0${i+1}</span>${s}</li>`).join('')}</ol>${state.step === 1 ? organizationForm() : state.step === 2 ? structure() : state.step === 3 ? members() : review()}${state.step>1 ? `<div class="tv-footer">${btn('← Back','back')}<small>${state.step === 2 ? 'You can continue without adding units.' : 'Your setup progress is saved.'}</small>${btn(state.step===4?'Complete setup →':'Continue →','next','primary')}</div>` : ''}`;
    root.innerHTML = html + `<footer class="tv-footer"><span class="tv-badge">Frontend demo · local data only</span>${state.org ? btn('Reset demo','reset','tv-link') : ''}</footer><p class="tv-status" role="status">${esc(status)}</p><dialog id="tv-dialog" aria-labelledby="tv-dialog-title"></dialog>`;
    root.querySelector('#tv-org-form')?.addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target); const name = f.get('name').trim();
      if (!name) { e.target.elements.name.setCustomValidity('Enter an organization name.'); e.target.elements.name.reportValidity(); return; }
      state.org = {...state.org, id:state.org?.id || uid(), name, country:f.get('country'), timezone:f.get('timezone'), ownerId:'self'};
      if (!state.members.length) state.members.push({id:'self',name:'Ayesha Khan',unitId:'org',access:'Owner',role:'Agent',scopes:[]});
      if (page !== 'settings') state.step=2; save(); render(true);
    });
    root.querySelector('[name=name]')?.addEventListener('input',e=>e.target.setCustomValidity(''));
    window.lucide?.createIcons();
    if (focus) { root.querySelector('h1')?.focus(); root.closest('.content').scrollTop=0; }
  }
  function modal(title, body, onSubmit) {
    const d=root.querySelector('dialog'); const previous=document.activeElement;
    d.innerHTML=`<form id="tv-modal-form"><div class="tv-row"><h2 id="tv-dialog-title">${title}</h2>${btn('Close','close')}</div>${body}<p class="tv-error" role="alert" id="tv-form-error"></p><div class="tv-footer">${btn('Cancel','close')}<button class="primary" type="submit">Save</button></div></form>`;
    d.addEventListener('close',()=>previous?.isConnected && previous.focus(),{once:true});
    d.querySelector('form').addEventListener('submit',e=>{e.preventDefault();onSubmit(new FormData(e.target),d);});
    d.showModal();
  }
  function editUnit(id) {
    const u=state.units.find(x=>x.id===id); const descendants=new Set([id]);
    let changed=true; while(changed) { changed=false; state.units.forEach(x=>{if(descendants.has(x.parentId)&&!descendants.has(x.id)){descendants.add(x.id);changed=true;}}); }
    modal(u?'Edit Organization Unit':'Add Organization Unit',`<p>Choose a name, unit type and parent in the organization tree.</p><label>Unit name<input name="name" maxlength="80" required value="${esc(u?.name || '')}"></label><div class="tv-grid two"><label>Unit type<select name="type">${options(['Team','Branch','Region','Department','Other'],u?.type || 'Team')}</select></label><label>Parent unit<select name="parentId">${[{id:'org',name:state.org.name},...state.units.filter(x=>!descendants.has(x.id)).map(x=>({id:x.id,name:path(x.id)}))].map(x=>`<option value="${x.id}" ${x.id===(u?.parentId || 'org')?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></div>${u ? `<small>To remove a unit, first move its members, child units and management scopes elsewhere.</small>${btn('Remove unit','remove-unit','tv-link',`data-id="${u.id}"`)}` : ''}`, (f,d)=>{
      if (!f.get('name').trim()) {d.querySelector('#tv-form-error').textContent='Enter a unit name.';return;}
      if(state.units.some(x=>x.id!==id&&x.parentId===f.get('parentId')&&x.name.toLowerCase()===f.get('name').trim().toLowerCase())){d.querySelector('#tv-form-error').textContent='A unit with this name already exists under this parent.';return;}
      const value={id:u?.id || uid(),name:f.get('name').trim(),type:f.get('type'),parentId:f.get('parentId')};
      if(u) Object.assign(u,value);else state.units.push(value);d.close();save();render();
    });
  }
  function editMember(id) {
    const m=state.members.find(x=>x.id===id); const allUnits=[{id:'org',name:state.org.name},...state.units.map(x=>({id:x.id,name:path(x.id)}))];
    modal(m?'Edit member':'Add mock member',`<p>Configure access, business role and scope independently.</p><label>Full name<input name="name" required maxlength="80" value="${esc(m?.name || '')}" ${id==='self'?'readonly':''}></label><label>Organization Unit<select name="unitId">${unitOptions(m?.unitId || 'org')}</select></label><div class="tv-grid two"><label>Organization Access<select name="access">${options(id==='self'?['Owner']:['Admin','Member'],m?.access || 'Member')}</select><small>${id==='self'?'The creator remains Owner, with Admin permissions.':'Owner transfer is outside this demo.'}</small></label><label>Business Role<select name="role">${options(['Agent','Manager'],m?.role || 'Agent')}</select></label></div><div id="tv-management" ${m?.role==='Manager'?'':'hidden'}><h3>Management Scope</h3><p>Select at least one unit. Include sub-units applies to each selected unit.</p><div class="tv-scope">${allUnits.map(u=>{const s=m?.scopes.find(s=>s.unitId===u.id);return `<div class="tv-scope-row"><label class="tv-check"><input type="checkbox" name="scope" value="${u.id}" ${s?'checked':''}>${esc(u.name)}</label><label class="tv-check"><input type="checkbox" name="include-${u.id}" ${s?.includeSubUnits?'checked':''} ${s?'':'disabled'}>Include sub-units</label></div>`;}).join('')}</div></div><div class="tv-note"><small>Admin access permits organization configuration. It does not automatically grant business access to every team. Agents have no management scope.</small></div>${m&&id!=='self'?btn('Remove member','remove-member','tv-link',`data-id="${id}"`):''}`, (f,d)=>{
      const role=f.get('role'), selected=f.getAll('scope');
      if(!f.get('name').trim()){d.querySelector('#tv-form-error').textContent='Enter a member name.';return;}
      if(role==='Manager'&&!selected.length){d.querySelector('#tv-form-error').textContent='Select at least one organization unit for this Manager.';return;}
      const value={id:m?.id || uid(),name:f.get('name').trim(),unitId:f.get('unitId'),access:f.get('access'),role,scopes:role==='Manager'?selected.map(unitId=>({unitId,includeSubUnits:f.has(`include-${unitId}`)})):[]};
      if(m) Object.assign(m,value); else state.members.push(value);d.close();save();render();
    });
    root.querySelector('[name=role]').addEventListener('change',e=>root.querySelector('#tv-management').hidden=e.target.value!=='Manager');
    root.querySelectorAll('[name=scope]').forEach(c=>c.addEventListener('change',()=>{const include=c.closest('.tv-scope-row').querySelector('[name^=include]');include.disabled=!c.checked;if(!c.checked)include.checked=false;}));
  }
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]'); if(!b)return; const a=b.dataset.action,id=b.dataset.id;
    if(a==='close'){root.querySelector('dialog').close();return;}
    if(a==='add-unit'||a==='edit-unit'){editUnit(id);return;}
    if(a==='add-member'||a==='edit-member'){editMember(id);return;}
    if(a==='remove-unit') {
      if(state.units.some(x=>x.parentId===id)||state.members.some(m=>m.unitId===id||m.scopes.some(s=>s.unitId===id))) {root.querySelector('#tv-form-error').textContent='This unit still has child units, members or management scopes. Reassign them before removing it.';return;}
      state.units=state.units.filter(x=>x.id!==id);root.querySelector('dialog').close();save();render();return;
    }
    if(a==='remove-member'){state.members=state.members.filter(m=>m.id!==id);root.querySelector('dialog').close();save();render();return;}
    if(a==='reset'){modal('Reset this demo?',`<p>This removes this browser’s Team organization, units and members. Other Pislaka demo data stays unchanged.</p>`,(f,d)=>{state={version:1,org:null,units:[],members:[],step:0,complete:false};page='setup';answer='';d.close();save();render(true);});root.querySelector('dialog [type=submit]').textContent='Reset demo';return;}
    if(a==='exit'){save();showView('home');return;}
    if(a==='start'){state.step=1;page='setup';}
    if(a==='back'){if(page==='settings'){page='home';}else if(state.org && state.step===1){save();showView('home');return;}else state.step=Math.max(0,state.step-1);}
    if(a==='step'){state.step=Number(id);page='setup';}
    if(a==='next'){if(state.step===4){state.complete=true;page='home';}else state.step++;}
    if(a==='settings'){page='settings';tab='structure';}
    if(a==='tab')tab=id;
    if(a==='home')page='home';
    if(a==='template'){
      if(id==='simple')state.units.push({id:uid(),name:'Main Team',type:'Team',parentId:'org'});
      if(id==='branches'){const branch=uid();state.units.push({id:branch,name:'Lahore Branch',type:'Branch',parentId:'org'},{id:uid(),name:'Sales Team',type:'Team',parentId:branch});}
      if(id==='custom'){editUnit();return;}
    }
    if(a==='question'){
      const replies=[`Illustrative response · not live business data\n\nStart with overdue follow-ups, upcoming viewings and listings awaiting updates. Your organization has ${state.members.length} members and ${state.members.filter(m=>m.role==='Manager').length} manager(s). In the connected version, priorities will be filtered by the current Manager’s scope.`, 'Illustrative response · not live business data\n\nA connected Team Agent would identify agents with overdue leads and missed follow-ups. This prototype has no activity records, so no individual performance is inferred.',`Illustrative response · not live business data\n\n${state.units.filter(u=>u.type==='Branch').length} branch units are configured. A connected comparison would show leads, viewings and conversion for authorized branches over the same reporting period.`];answer=replies[Number(id)];
    }
    save();render(a!=='question'&&a!=='template');
  });
  window.TeamV1={open(){if(!state.complete)page='setup';render();}};
  if(location.hash==='#team')showView('team');
})();
