import Papa from 'papaparse';

// Dedicated parser worker used by Vite's `new Worker(new URL(...))` pattern.
// Keeping worker code tiny makes failures easy to diagnose in hosted sandboxes.
self.onmessage = (event) => {
  try {
    const result = Papa.parse(event.data.csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
    });

    if (result.errors?.length) {
      const first = result.errors[0];
      throw new Error(`CSV parse failed on row ${first.row ?? 'unknown'}: ${first.message}`);
    }

    self.postMessage({ rows: result.data });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
