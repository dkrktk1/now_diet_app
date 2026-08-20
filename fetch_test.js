fetch('https://script.google.com/macros/s/AKfycbyPnCoPcNnxck3_LNsKX39uKIalCPOm37ZuHmTleH2q1Ori8pHWM5W9dwFpuMoxMkQ9/exec?query=사과')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d).substring(0, 1000)))
  .catch(console.error);
