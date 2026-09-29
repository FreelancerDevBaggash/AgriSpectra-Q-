from pathlib import Path
p=Path('/home/ubuntu/AgriSpectra-Q/results/industrial_validation/dashboard/index.html');s=p.read_text()
if 'id="live-analysis-lab"' not in s:
 block='''<section id="live-analysis-lab" style="margin:2rem 0;padding:1.25rem;border:2px solid #0b7285;border-radius:12px;background:#f0fbfc"><h2>ANALYSIS LAB — LIVE ANALYSIS</h2><p><strong>LIVE ANALYSIS</strong> executes the Python windowed Matrix engine on a server-side real EnMAP GeoTIFF. It is separate from the <strong>FROZEN SCIENTIFIC BENCHMARK</strong>.</p><label>Scene <select id="live-scene"><option value="scene_01_DT0000205230">Scene 1</option><option value="scene_02">Scene 2</option><option value="scene_03">Scene 3</option></select></label> <button id="run-live">RUN ANALYSIS</button><pre id="live-output">Ready.</pre></section><script>(function(){const b=document.getElementById('run-live'),o=document.getElementById('live-output');b.onclick=async()=>{b.disabled=true;o.textContent='Running actual windowed EnMAP analysis...';try{const r=await fetch('/api/analyse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scene:document.getElementById('live-scene').value})});const j=await r.json();o.textContent=JSON.stringify(j,null,2)}catch(e){o.textContent='LIVE API unavailable: '+e}finally{b.disabled=false}}})();</script>'''
 s=s.replace('</body>',block+'</body>') if '</body>' in s else s+block
 p.write_text(s)
 print('updated',p)
else:print('already updated')
