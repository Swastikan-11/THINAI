async function run() {
  const listRes = await fetch('http://localhost:9222/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page');
  if (!page) throw new Error('No page found');

  console.log('Connecting to WebView CDP:', page.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Enable Runtime and Console
  await sendCommand('Runtime.enable');
  await sendCommand('Console.enable');

  // Evaluate feature checks in the WebView
  const evalCode = `(async () => {
    const results = {};
    results.url = window.location.href;
    results.hasCapacitor = typeof window.Capacitor !== 'undefined';
    results.isCameraAvailable = !!window.Capacitor?.isPluginAvailable?.('Camera');
    results.isFilesystemAvailable = !!window.Capacitor?.isPluginAvailable?.('Filesystem');
    
    // File picker input support
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    results.fileInputSupported = typeof fileInput.files !== 'undefined';
    
    // WebAssembly baseline
    results.hasWebAssembly = typeof WebAssembly !== 'undefined';
    
    // Threaded WASM support check
    // 1. crossOriginIsolated
    results.crossOriginIsolated = typeof window.crossOriginIsolated !== 'undefined' ? window.crossOriginIsolated : false;
    
    // 2. SharedArrayBuffer
    results.hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    
    // 3. Atomics
    results.hasAtomics = typeof Atomics !== 'undefined';
    
    // 4. WebAssembly.Memory shared
    try {
      const mem = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
      results.wasmSharedMemory = true;
    } catch (e) {
      results.wasmSharedMemory = false;
      results.wasmSharedMemoryError = e.message;
    }
    
    // 5. WebAssembly Threads feature validate
    // Minimal wasm module with a shared memory definition
    try {
      const bytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // magic & version
        0x05, 0x05, 0x01, 0x03, 0x01, 0x01, 0x01        // memory section: shared 1 1
      ]);
      results.wasmThreadsValidated = WebAssembly.validate(bytes);
    } catch (e) {
      results.wasmThreadsValidated = false;
      results.wasmThreadsError = e.message;
    }

    // Check LiteRT model status if available
    results.hasMeasureInference = typeof window.measureInference === 'function';
    if (results.hasMeasureInference) {
      try {
        const inf = await window.measureInference();
        results.inferenceResult = inf;
      } catch (err) {
        results.inferenceError = err.message;
      }
    }

    return results;
  })()`;

  const evalRes = await sendCommand('Runtime.evaluate', {
    expression: evalCode,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('=== WEBVIEW EVALUATION RESULTS ===');
  console.log(JSON.stringify(evalRes.result?.value, null, 2));

  ws.close();
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
