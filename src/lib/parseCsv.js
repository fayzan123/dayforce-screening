import Papa from 'papaparse';

/**
 * CSV loading is split from tree construction so parsing can run off the main
 * thread while the build/rollup code stays pure and unit-testable.
 *
 * The assessment data contains quoted commas in `Location`, so PapaParse is
 * required; a naive `split(',')` would corrupt rows such as "Toronto, Canada".
 */

function parseOnMainThread(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  if (result.errors?.length) {
    const first = result.errors[0];
    throw new Error(`CSV parse failed on row ${first.row ?? 'unknown'}: ${first.message}`);
  }

  return result.data;
}

function parseInWorker(csvText) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/csvParser.worker.js', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event) => {
      worker.terminate();
      const { rows, error } = event.data;
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve(rows);
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'CSV worker failed.'));
    };

    worker.postMessage({ csvText });
  });
}

/**
 * Load and parse the public CSV. The explicit Vite worker keeps the initial
 * 40k-row parse from blocking interactions; if the worker fails under a host
 * environment, the main-thread fallback preserves correctness.
 *
 * @param {string} path Public URL for the CSV file.
 * @returns {Promise<Array<Record<string, string>>>}
 */
export async function loadCsvRows(path = `${import.meta.env.BASE_URL}data/giga-corp.csv`) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();

  if (typeof Worker !== 'undefined') {
    try {
      return await parseInWorker(csvText);
    } catch (error) {
      console.warn('CSV worker failed; falling back to main thread parse.', error);
    }
  }

  return parseOnMainThread(csvText);
}
