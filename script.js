const views=['dashboard','services','orders','wallet','downloads','support'];
const orders=[
 {id:'#MCS-1048',customer:'Rahul Das',service:'Aadhaar Update',status:'Processing',date:'12 Sep 2026'},
 {id:'#MCS-1047',customer:'Priya Roy',service:'PAN Services',status:'Completed',date:'12 Sep 2026'},
 {id:'#MCS-1046',customer:'Amit Ghosh',service:'Ration Services',status:'Correction',date:'11 Sep 2026'},
 {id:'#MCS-1045',customer:'Suman Paul',service:'Bill Payment',status:'Completed',date:'10 Sep 2026'},
];
let currentService='Aadhaar Update', currentStep=1;
const prices={'Aadhaar Update':120,'PAN Services':80,'Ration Services':70,'Bill Payment':25,'Other CSC Service':100};

function switchView(view){
  views.forEach(v=>document.getElementById(v+'View').classList.toggle('active',v===view));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
  const titles={dashboard:['Overview','Dashboard'],services:['Service Catalog','Services'],orders:['Workflow','My Applications'],wallet:['Finance','Wallet & Payments'],downloads:['Files','Downloads'],support:['Help Desk','Support']};
  document.getElementById('pageKicker').textContent=titles[view][0];
  document.getElementById('pageTitle').textContent=titles[view][1];
  if(view==='orders') renderOrders();
  document.getElementById('sidebar').classList.remove('open');
}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.getElementById('mobileMenu').onclick=()=>document.getElementById('sidebar').classList.toggle('open');

function openService(service){
 currentService=service; currentStep=1;
 document.getElementById('drawerTitle').textContent=service;
 document.getElementById('applicationForm').reset();
 document.getElementById('overlay').classList.add('open');
 updateSteps();
}
function closeDrawer(e){if(e && e.target!==document.getElementById('overlay')) return;document.getElementById('overlay').classList.remove('open')}
function updateSteps(){
 for(let i=1;i<=4;i++){
   document.getElementById('formStep'+i).classList.toggle('active',i===currentStep);
   const dot=document.getElementById('stepDot'+i);
   dot.classList.toggle('active',i===currentStep);
   dot.classList.toggle('done',i<currentStep);
 }
}
function validCustomer(){
 const n=document.getElementById('customerName').value.trim();
 const m=document.getElementById('customerMobile').value.trim();
 if(!n || !/^\d{10}$/.test(m)){toast('Enter a valid customer name and 10-digit mobile number.');return false}
 return true;
}
function validDocs(){
 const inputs=[...document.querySelectorAll('#formStep2 input[type=file]')];
 if(!inputs[0].files.length || !inputs[1].files.length){toast('Please upload the two required documents.');return false}
 return true;
}
function goStep(step){
 if(step===2 && !validCustomer()) return;
 if(step===3 && !validDocs()) return;
 if(step===3){
   document.getElementById('reviewBox').innerHTML=`
    <div class="review-row"><span>Service</span><b>${currentService}</b></div>
    <div class="review-row"><span>Customer</span><b>${escapeHtml(document.getElementById('customerName').value)}</b></div>
    <div class="review-row"><span>Request</span><b>${escapeHtml(document.getElementById('requestType').value)}</b></div>
    <div class="review-row"><span>Processing fee</span><b>₹${prices[currentService]||100}</b></div>`;
 }
 currentStep=step; updateSteps();
}
function togglePay(){document.getElementById('payBtn').disabled=!document.getElementById('declaration').checked}
function demoPay(method){toast(method+' selected. Connect a real payment gateway for production.')}
function submitDemo(){
 orders.unshift({id:'#MCS-'+(1049+orders.length),customer:document.getElementById('customerName').value,service:currentService,status:'Submitted',date:'12 Sep 2026'});
 closeDrawer(); renderOrders(); toast('Application submitted successfully.');
}
function renderOrders(){
 const body=document.getElementById('ordersRows');
 body.innerHTML=orders.map(o=>`<tr><td><b>${o.id}</b></td><td>${escapeHtml(o.customer)}</td><td>${o.service}</td><td><span class="status ${o.status==='Completed'?'completed':o.status==='Correction'?'correction':'processing'}">${o.status}</span></td><td>${o.date}</td><td><button class="text-btn">View</button></td></tr>`).join('');
}
function filterOrders(){
 const q=document.getElementById('searchOrders').value.toLowerCase();
 document.querySelectorAll('#ordersRows tr').forEach(row=>row.style.display=row.innerText.toLowerCase().includes(q)?'':'none');
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
let toastTimer;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
renderOrders();
