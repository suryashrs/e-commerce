<?php
// src/Services/FirestoreService.php

class FirestoreService {
    private $projectId;
    private $apiKey;
    
    public function __construct() {
        // REPLACE WITH YOUR FIREBASE PROJECT ID & API KEY IF USING REST API DIRECTLY
        // For production, you can also use kreait/firebase-php library via Composer
        $this->projectId = "wearitnow-app-backend"; 
        $this->apiKey = "YOUR_FIREBASE_WEB_API_KEY";
    }

    /**
     * Gets a user's points balance from Firestore
     * @param int $userId The SQL user ID binding to Firestore document ID
     * @return int Points balance
     */
    public function getUserPoints($userId) {
        // Since we don't have the real initialized Firestore credentials right here, 
        // we will simulate the connection for your dashboard requirement.
        
        // Uncomment and use if you set up the REST API correctly:
        /*
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users/{$userId}?key={$this->apiKey}";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        if (isset($data['fields']['pointsBalance']['integerValue'])) {
            return (int) $data['fields']['pointsBalance']['integerValue'];
        }
        return 0; // Default if not found
        */

        // MOCK: Returning a dynamic value based on the user ID for testing the dashboard.
        // User with ID 8 might have 1200 points. User 1 will have 500, etc.
        $mockPoints = ($userId * 150) + 150; 
        return min(2500, $mockPoints); // Caps at 2500 for demo
    }

    /**
     * Deducts points from a user's Firestore document
     */
    public function deductPoints($userId, $pointsToDeduct) {
        $currentBalance = $this->getUserPoints($userId);
        
        if ($currentBalance < $pointsToDeduct) {
            return false;
        }

        // Logic to write the new balance back to Firestore
        $newBalance = $currentBalance - $pointsToDeduct;
        
        // Uncomment in production:
        /*
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users/{$userId}?updateMask.fieldPaths=pointsBalance&key={$this->apiKey}";
        
        $payload = json_encode([
            "fields" => [
                "pointsBalance" => [
                    "integerValue" => $newBalance
                ]
            ]
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $response = curl_exec($ch);
        curl_close($ch);
        */

        // If successful, return true and the string mapping we can use to verify
        // return json_decode($response, true);
        return true; 
    }
}
?>
