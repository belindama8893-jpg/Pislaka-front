/* Pure demo domain functions. Production must perform these checks server-side. */
(function (target) {
  'use strict';
  const VERSION='account-business-v1';
  const TYPES=['lead','listing','followup'];
  const accountId=email=>'account:'+email.trim().toLowerCase();
  const now=()=>new Date().toISOString();
  const id=()=>globalThis.crypto.randomUUID();
  const accounts=[{id:accountId('ayesha@pislaka.example'),name:'Ayesha Khan',email:'ayesha@pislaka.example'}, {id:accountId('ahmed@pislaka.example'),name:'Ahmed',email:'ahmed@pislaka.example'}, {id:accountId('sara@pislaka.example'),name:'Sara Ahmed',email:'sara@pislaka.example'}, {id:accountId('ali@pislaka.example'),name:'Ali Raza',email:'ali@pislaka.example'}];
  function migrate(s) {
    s.invites ||= [];s.grants ||= [];s.terminatedMembers ||= [];s.accounts ||= accounts.map(a=>({...a}));s.business ||= [];
    s.currentAccountId ||= accounts[0].id;
    const ensure=(m)=>{m.email ||= m.id==='self'?accounts[0].email:`${(m.name||m.id).toLowerCase().replace(/[^a-z0-9]+/g,'.')}@pislaka.example`;m.accountId ||= accountId(m.email);m.scopes ||= [];if(!s.accounts.some(a=>a.id===m.accountId))s.accounts.push({id:m.accountId,email:m.email,name:m.name||m.email});};
    s.members.forEach(ensure);
    if(s.version!==2){
      const pending=s.members.filter(m=>m.access!=='Owner');
      pending.forEach(m=>{if(!s.invites.some(i=>i.email?.toLowerCase()===m.email.toLowerCase()&&i.status==='pending'))s.invites.push({...m,id:id(),status:'pending',invitedBy:s.members.find(x=>x.access==='Owner')?.accountId||accounts[0].id,organizationId:s.org?.id,acceptedAt:null,expiresAt:new Date(Date.now()+7*86400000).toISOString(),migrated:true});});
      s.members=s.members.filter(m=>m.access==='Owner');
      s.invites.forEach(i=>{i.scopes ||= [];i.status ||= 'pending';i.organizationId ||= s.org?.id;i.invitedBy ||= s.members[0]?.accountId||accounts[0].id;i.expiresAt ||= new Date(Date.now()+7*86400000).toISOString();delete i.acceptedAt;});
      s.version=2;
    }
    if(!s.businessSeeded){
      s.business.push(...[{type:'lead',title:'Ahmed · DHA buyer inquiry'},{type:'listing',title:'Ahmed · Gulberg apartment'},{type:'followup',title:'Ahmed · Viewing follow-up'}].map((r,i)=>({...r,id:'historical-'+i,accountId:accounts[1].id,shareable:true,createdAt:'2026-09-01T09:00:00Z',detail:'Mock business record for read-only sharing demonstration.'})));
      s.businessSeeded=true;
    }
    expire(s);return s;
  }
  // Independent simulated organizations; an account still has only one active membership.
  const workspaces=s=>[...(s.otherWorkspaces||[]),...(s.org?[{org:s.org,units:s.units,members:s.members,invites:s.invites,step:s.step,complete:s.complete}]:[])];
  const activeMembership=(s,a=s.currentAccountId)=>workspaces(s).flatMap(w=>w.members).find(m=>m.accountId===a);
  function selectWorkspace(s,organizationId){
    if(s.org?.id===organizationId)return;
    const all=workspaces(s),next=all.find(w=>w.org.id===organizationId);
    if(!next)throw Error('Organization unavailable.');
    s.otherWorkspaces=all.filter(w=>w.org.id!==organizationId);Object.assign(s,next);
  }
  function beginOrganization(s){
    if(activeMembership(s)||s.grants.some(g=>g.accountId===s.currentAccountId&&g.active))throw Error('Leave your current organization before creating another.');
    s.otherWorkspaces=workspaces(s);Object.assign(s,{org:null,units:[],members:[],invites:[],step:1,complete:false});
  }
  function selectAccountWorkspace(s){
    const all=workspaces(s),account=s.accounts.find(a=>a.id===s.currentAccountId);
    const next=all.find(w=>w.members.some(m=>m.accountId===s.currentAccountId))||all.find(w=>w.invites.some(i=>i.email.toLowerCase()===account?.email.toLowerCase()&&i.status==='pending'))||all.find(w=>w.invites.some(i=>i.email.toLowerCase()===account?.email.toLowerCase()));
    if(next)selectWorkspace(s,next.org.id);
  }
  function expire(s){[...s.invites,...(s.otherWorkspaces||[]).flatMap(w=>w.invites)].forEach(i=>{if(i.status==='pending'&&Date.parse(i.expiresAt)<=Date.now())i.status='expired';});}
  const member=(s,a=s.currentAccountId)=>s.members.find(m=>m.accountId===a);
  const canConfigure=s=>['Owner','Admin'].includes(member(s)?.access);
  const grant=(s,m)=>s.grants.find(g=>g.memberId===m?.id&&g.accountId===m?.accountId&&g.organizationId===s.org?.id&&g.active&&g.acceptedAt&&g.version===VERSION);
  const unitExists=(s,u)=>u==='org'||s.units.some(x=>x.id===u);
  function covers(s,m,u){return (m.scopes||[]).some(g=>{if(!unitExists(s,g.unitId))return false;if(g.unitId===u)return true;if(!g.includeSubUnits)return false;const seen=new Set();while(u&&u!=='org'&&!seen.has(u)){seen.add(u);u=s.units.find(x=>x.id===u)?.parentId;if(u===g.unitId)return true;}return false;});}
  function consent(s,m){if(m.accountId!==s.currentAccountId)throw Error("Only the account owner can confirm sharing.");const existing=grant(s,m);if(existing)return existing;if(s.grants.some(g=>g.accountId===m.accountId&&g.active&&g.organizationId!==s.org.id))throw Error('Business sharing is already active in another organization.');const g={id:id(),memberId:m.id,accountId:m.accountId,organizationId:s.org.id,active:true,types:[...TYPES],existingAndFuture:true,version:VERSION,acceptedAt:now(),terminatedAt:null};s.grants.push(g);return g;}
  function accept(s,inviteId){expire(s);const i=s.invites.find(x=>x.id===inviteId);const a=s.accounts.find(x=>x.id===s.currentAccountId);if(!i||!a||i.email.toLowerCase()!==a.email.toLowerCase()||i.organizationId!==s.org?.id)throw Error('Only the invited account can accept.');if(i.status==='accepted')return member(s,a.id);if(i.status!=='pending')throw Error('This invitation is no longer pending.');if(activeMembership(s,a.id))throw Error('Leave your current organization before accepting another invitation.');if(!['Admin','Member'].includes(i.access)||!['Agent','Manager'].includes(i.role)||!unitExists(s,i.unitId)||(i.role==='Manager'&&(!i.scopes.length||i.scopes.some(g=>!unitExists(s,g.unitId)))))throw Error('The invitation configuration is no longer valid. Ask the administrator to invite again.');if(s.grants.some(g=>g.accountId===a.id&&g.active))throw Error('Business sharing is already active in an organization.');const m={id:id(),accountId:a.id,email:a.email,name:a.name,displayName:i.displayName,unitId:i.unitId,access:i.access,role:i.role,scopes:i.scopes.map(g=>({...g}))};const g=consent(s,m);s.members.push(m);i.status='accepted';i.acceptedAt=g.acceptedAt;i.memberId=m.id;return m;}
  function terminate(s,memberId,reason){const m=s.members.find(x=>x.id===memberId);if(!m||m.access==='Owner')throw Error('Owner cannot leave or be removed.');s.grants.filter(g=>g.memberId===m.id&&g.active).forEach(g=>{g.active=false;g.terminatedAt=now();g.reason=reason;});s.members=s.members.filter(x=>x.id!==m.id);s.terminatedMembers.push({...m,terminatedAt:now(),reason});}
  function visible(s){const viewer=member(s);if(!viewer||viewer.role!=='Manager'||!grant(s,viewer))return [];return s.business.filter(r=>{const owner=member(s,r.accountId),g=grant(s,owner);return owner&&g&&r.shareable===true&&g.types.includes(r.type)&&TYPES.includes(r.type)&&covers(s,viewer,owner.unitId);});}
  target.TeamSharing={workspaces,activeMembership,selectWorkspace,beginOrganization,selectAccountWorkspace,VERSION,TYPES,accounts,accountId,migrate,expire,member,grant,canConfigure,covers,consent,accept,terminate,visible};
})(typeof module!=='undefined'?module.exports:window);
