<?php
$conn = new mysqli('jessewes.startlogicmysql.com', 'bigwest111', 'Westland12!', 'comments_for_blog');

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Database connection failed: " . $conn->connect_error]));
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $post_id = $conn->real_escape_string($_POST['post_id']); // Escape, but don't intval for basename
    $name = $conn->real_escape_string($_POST['name']);
    $email = $conn->real_escape_string($_POST['email']);
    $comment = $conn->real_escape_string($_POST['comment']);

    if (empty($name) || empty($email) || empty($comment)) {
        die(json_encode(["status" => "error", "message" => "All fields are required."]));
    }

    $sql = "INSERT INTO comments (post_id, name, email, comment, created_at) 
            VALUES ('$post_id', '$name', '$email', '$comment', NOW())";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error inserting comment: " . $conn->error]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
?>