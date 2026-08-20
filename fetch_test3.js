fetch('https://script.google.com/macros/s/AKfycbyPnCoPcNnxck3_LNsKX39uKIalCPOm37ZuHmTleH2q1Ori8pHWM5W9dwFpuMoxMkQ9/exec')
  .then(r => r.text())
  .then(d => console.log('Size:', d.length / 1024 / 1024, 'MB'))
  .catch(console.error);
