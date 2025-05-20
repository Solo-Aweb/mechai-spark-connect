
// Dynamic import for OpenCascade.js
export default async function OpenCascadeInstance() {
  try {
    // Using dynamic import with ?init suffix to properly handle WebAssembly
    const module = await import('opencascade.js?init');
    return module.default || module;
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    throw error;
  }
}
