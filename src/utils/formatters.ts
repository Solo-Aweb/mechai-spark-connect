
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatTime = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};

export const getFileType = (url: string | null): string => {
  if (!url) return '';
  const extension = url.split('.').pop()?.toLowerCase() || '';
  return extension;
};

export const is3DModel = (url: string | null): boolean => {
  if (!url) return false;
  const ext = getFileType(url);
  return ['stl', 'step'].includes(ext);
};

export const is2DModel = (url: string | null): boolean => {
  if (!url) return false;
  const ext = getFileType(url);
  return ['svg', 'dxf'].includes(ext);
};

export const isDocument = (url: string | null): boolean => {
  if (!url) return false;
  const ext = getFileType(url);
  return ['pdf'].includes(ext);
};

export const isSupportedFileFormat = (url: string | null): boolean => {
  if (!url) return false;
  const ext = getFileType(url);
  return ['stl', 'step', 'dxf', 'svg', 'pdf'].includes(ext);
};
