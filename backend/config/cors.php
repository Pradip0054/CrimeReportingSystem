<?php

return [

    /**
     * 1. Define application paths exposed to cross-origin routing requests.
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    /**
     * 2. Configure trusted origins authorized to execute cross-site HTTP requests.
     */
    'allowed_origins' => ['http://localhost:5173', 'http://localhost:5174'], 

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /**
     * 3. Enable credential transmission to securely share Sanctum cookies and session headers.
     */
    'supports_credentials' => true, 
];