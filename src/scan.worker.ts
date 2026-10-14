import { scanFloor, type ScanInput } from './scan';
self.onmessage = (event: MessageEvent<ScanInput>) => {
  try { self.postMessage({result:scanFloor(event.data)}); }
  catch(error) { self.postMessage({error:error instanceof Error?error.message:'Scanning failed.'}); }
};
