window.onload = function() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    Swal.fire({
      icon: 'success',
      title: 'Registration Successful',
      text: 'You have successfully registered!',
      confirmButtonText: 'OK'
    });
  }
};