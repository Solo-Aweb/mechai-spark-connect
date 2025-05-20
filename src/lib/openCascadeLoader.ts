
// Dynamic import for OpenCascade.js
export default async function OpenCascadeInstance() {
  try {
    const module = await import('opencascade.js');
    return module.default;
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    throw error;
  }
}
