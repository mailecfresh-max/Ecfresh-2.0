export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  if (error.message) {
    // Show user-friendly error message
    alert(error.message);
  }
  throw error;
};