// Debug script to check student API response
console.log('Testing student API...');

fetch('http://localhost:8080/api/v1/students?page=1&limit=5')
  .then(response => response.json())
  .then(data => {
    console.log('Student API Response:', data);
    
    if (data.data && data.data.length > 0) {
      const firstStudent = data.data[0];
      console.log('First student:', firstStudent);
      console.log('Profile photo URL:', firstStudent.profilePhotoUrl);
      
      if (firstStudent.profilePhotoUrl) {
        // Test if the image URL is accessible
        console.log('Testing image URL:', firstStudent.profilePhotoUrl);
        
        fetch(firstStudent.profilePhotoUrl)
          .then(imgResponse => {
            console.log('Image response status:', imgResponse.status);
            console.log('Image response headers:', Array.from(imgResponse.headers.entries()));
          })
          .catch(err => {
            console.error('Image fetch error:', err);
          });
      }
    }
  })
  .catch(error => {
    console.error('API Error:', error);
  });