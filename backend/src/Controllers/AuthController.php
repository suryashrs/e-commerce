<?php
// src/Controllers/AuthController.php

include_once __DIR__ . '/../Models/User.php';
include_once __DIR__ . '/../Services/NotificationService.php';

class AuthController {
    private $db;
    private $user;

    public function __construct($db){
        $this->db = $db;
        $this->user = new User($db);
    }

    public function login($data){
        if(!empty($data->email) && !empty($data->password)){
            $this->user->email = $data->email;
            
            if($this->user->emailExists()){
                if(password_verify($data->password, $this->user->password)){
                    if (session_status() === PHP_SESSION_NONE) {
                        session_start();
                    }
                    $_SESSION['user_id'] = $this->user->id;
                    $_SESSION['role'] = $this->user->role;
                    $_SESSION['name'] = $this->user->name;

                    return array(
                        "status" => 200,
                        "body" => array(
                            "message" => "Login successful.",
                            "user" => array(
                                "id" => $this->user->id,
                                "name" => $this->user->name,
                                "email" => $this->user->email,
                                "role" => $this->user->role,
                                "avatar" => $this->user->avatar,
                                "location" => $this->user->location,
                                "bio" => $this->user->bio,
                                "phone" => $this->user->phone,
                                "website" => $this->user->website,
                                "calendar_url" => $this->user->calendar_url
                            )
                        )
                    );
                }
            }
        }
        return array("status" => 401, "body" => array("message" => "Invalid email or password."));
    }

    public function register($data){
        if(!empty($data->name) && !empty($data->email) && !empty($data->password)){
            $this->user->name = $data->name;
            $this->user->email = $data->email;
            $this->user->password = $data->password;
            $valid_roles = ['buyer', 'seller'];
            $role = isset($data->role) && in_array($data->role, $valid_roles) ? $data->role : 'buyer';
            $this->user->role = $role;

            // Check if email already exists
            if($this->user->emailExists()){
                if ($role === 'seller' && $this->user->role === 'buyer') {
                    return array("status" => 409, "body" => array(
                        "message" => "This email is already registered as a buyer account. If you want to become a seller, please log in and upgrade your current profile, or use a different email address to create a separate seller account.",
                        "conflict" => "buyer_to_seller"
                    ));
                }
                return array("status" => 409, "body" => array("message" => "Account already exists with this email."));
            }

            if($this->user->create()){
                // Send Welcome Email
                NotificationService::sendWelcomeEmail($this->user->email, $this->user->name);

                return array(
                    "status" => 201, 
                    "body" => array(
                        "message" => "User was created.",
                        "user" => array(
                            "id" => $this->user->id,
                            "email" => $this->user->email,
                            "role" => $this->user->role
                        )
                    )
                );
            } else {
                return array("status" => 503, "body" => array("message" => "Unable to create user. Email might be taken."));
            }
        }
        return array("status" => 400, "body" => array("message" => "Unable to create user. Data is incomplete."));
    }
}
?>
