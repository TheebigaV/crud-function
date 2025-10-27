<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://localhost:3000', // For HTTPS local development
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Accept-Language',
        'Content-Language',
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [
        'Cache-Control',
        'Content-Language',
        'Content-Type',
        'Expires',
        'Last-Modified',
        'Pragma',
    ],

    'max_age' => 0,

    'supports_credentials' => true,

];
