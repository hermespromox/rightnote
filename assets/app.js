
const form=document.getElementById('contact-form');
const statusEl=document.getElementById('form-status');
form?.addEventListener('submit',async(e)=>{e.preventDefault();statusEl.className='status';statusEl.textContent='Sending…';const data=Object.fromEntries(new FormData(form).entries());try{const res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const payload=await res.json().catch(()=>({}));if(!res.ok)throw new Error(payload.error||'Send failed');form.reset();statusEl.className='status ok';statusEl.textContent='Message sent. We will reply within one business day.';}catch(err){statusEl.className='status err';statusEl.textContent='Sending is not active yet. Email hello@rightnote.co or add RESEND_API_KEY in Vercel.';}});
