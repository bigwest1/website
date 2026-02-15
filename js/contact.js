// Contact Form Validation and Submission
function validateForm() {
  var name = document.forms["myForm"]["name"].value.trim();
  var email = document.forms["myForm"]["email"].value.trim();
  var subject = document.forms["myForm"]["subject"].value.trim();
  var comments = document.forms["myForm"]["comments"].value.trim();

  document.getElementById("error-msg").style.opacity = 0;
  document.getElementById("error-msg").innerHTML = "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name) {
      showError("Please enter a Name");
      return false;
  }
  if (!email || !emailRegex.test(email)) {
      showError("Please enter a valid Email");
      return false;
  }
  if (!subject) {
      showError("Please enter a Subject");
      return false;
  }
  if (!comments) {
      showError("Please enter a Message");
      return false;
  }

  // Show loading spinner
  document.getElementById("loading-spinner").style.display = "block";

  // AJAX submission
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
          document.getElementById("loading-spinner").style.display = "none";
          if (this.status == 200) {
              document.getElementById("simple-msg").innerHTML = this.responseText;
              document.forms["myForm"].reset();
          } else {
              showError("An error occurred while submitting the form. Please try again.");
          }
      }
  };
  xhttp.open("POST", "https://www.jessewestlund.com/php/contact.php", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(`name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&comments=${encodeURIComponent(comments)}`);
  return false;
}

// Display Error
function showError(message) {
  var errorMsg = document.getElementById("error-msg");
  errorMsg.innerHTML = `<div class='alert alert-warning error_message'>*${message}*</div>`;
  fadeIn(errorMsg);
}

// Fade-in Effect
function fadeIn(element) {
  var opacity = 0;
  element.style.opacity = opacity;
  var intervalID = setInterval(function () {
      if (opacity < 1) {
          opacity += 0.1;
          element.style.opacity = opacity;
      } else {
          clearInterval(intervalID);
      }
  }, 50);
}