<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Capture form data
    $name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $subject = filter_input(INPUT_POST, 'subject', FILTER_SANITIZE_STRING);
    $comments = filter_input(INPUT_POST, 'comments', FILTER_SANITIZE_STRING);

    // Validation
    if (empty($name) || empty($email) || empty($subject) || empty($comments)) {
        echo "<div class='alert alert-warning'>All fields are required. Please try again.</div>";
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "<div class='alert alert-warning'>Invalid email format. Please enter a valid email.</div>";
        exit;
    }

    // Email settings
    $to = "jwestlund@jessewestlund.com"; // Replace with your email address
    $headers = "From: " . $email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    $message = "
        <html>
        <head>
            <title>New Contact Form Submission</title>
        </head>
        <body>
            <h2>Contact Form Submission</h2>
            <p><strong>Name:</strong> {$name}</p>
            <p><strong>Email:</strong> {$email}</p>
            <p><strong>Subject:</strong> {$subject}</p>
            <p><strong>Message:</strong> {$comments}</p>
        </body>
        </html>
    ";

    // Send the email
    if (mail($to, $subject, $message, $headers)) {
        echo "<div class='alert alert-success'>Your message has been sent successfully. Thank you!</div>";
    } else {
        echo "<div class='alert alert-danger'>Failed to send your message. Please try again later.</div>";
    }
} else {
    echo "<div class='alert alert-danger'>Invalid request method. Please use the form to submit your message.</div>";
}
?>