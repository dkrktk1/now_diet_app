fetch('https://script.google.com/macros/s/AKfycbyPnCoPcNnxck3_LNsKX39uKIalCPOm37ZuHmTleH2q1Ori8pHWM5W9dwFpuMoxMkQ9/exec?q=사과')
  .then(r => r.json())
  .then(d => console.log('Length:', d.length, 'First item:', d[0]))
  .catch(console.error);
