fetch('https://script.google.com/macros/s/AKfycbyPnCoPcNnxck3_LNsKX39uKIalCPOm37ZuHmTleH2q1Ori8pHWM5W9dwFpuMoxMkQ9/exec?search=사과')
  .then(r => r.json())
  .then(d => console.log('search Length:', d.length))
  .catch(console.error);

fetch('https://script.google.com/macros/s/AKfycbyPnCoPcNnxck3_LNsKX39uKIalCPOm37ZuHmTleH2q1Ori8pHWM5W9dwFpuMoxMkQ9/exec?name=사과')
  .then(r => r.json())
  .then(d => console.log('name Length:', d.length))
  .catch(console.error);
