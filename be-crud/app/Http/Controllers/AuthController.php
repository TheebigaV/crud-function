<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'User registered successfully'
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Registration error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        try {
            // Log the incoming request for debugging
            \Log::info('Login attempt', [
                'email' => $request->email,
                'has_password' => !empty($request->password),
                'request_headers' => $request->headers->all(),
                'request_method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'all_input' => $request->all()
            ]);

            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if ($validator->fails()) {
                \Log::warning('Login validation failed', [
                    'errors' => $validator->errors(),
                    'email' => $request->email
                ]);

                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user exists
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                \Log::warning('Login failed - user not found', ['email' => $request->email]);

                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Check password
            if (!Hash::check($request->password, $user->password)) {
                \Log::warning('Login failed - invalid password', [
                    'email' => $request->email,
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            \Log::info('Login successful', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful'
            ]);

        } catch (\Exception $e) {
            \Log::error('Login error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'email' => $request->email ?? 'unknown'
            ]);

            return response()->json([
                'message' => 'Login failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user();

            // Delete current token
            $request->user()->currentAccessToken()->delete();

            // Create new token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Token refreshed successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Token refresh error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Token refresh failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send password reset link
     */
    public function forgotPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => 'Password reset link sent to your email'
                ]);
            } else {
                return response()->json([
                    'message' => 'Unable to send password reset link'
                ], 400);
            }

        } catch (\Exception $e) {
            \Log::error('Forgot password error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Password reset request failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required',
                'email' => 'required|email',
                'password' => 'required|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function (User $user, string $password) {
                    $user->forceFill([
                        'password' => Hash::make($password)
                    ])->setRememberToken(Str::random(60));

                    $user->save();

                    event(new PasswordReset($user));
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'message' => 'Password reset successfully'
                ]);
            } else {
                return response()->json([
                    'message' => 'Password reset failed'
                ], 400);
            }

        } catch (\Exception $e) {
            \Log::error('Reset password error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Password reset failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get social authentication URL
     */
    public function getSocialAuthUrl($provider)
    {
        try {
            \Log::info('Getting social auth URL', ['provider' => $provider]);

            // Validate provider
            $validated = $this->validateProvider($provider);
            if (!$validated['success']) {
                \Log::error('Invalid provider', ['provider' => $provider]);
                return response()->json([
                    'message' => 'Invalid provider',
                    'error' => $validated['message']
                ], 400);
            }

            // Check if Socialite is available
            if (!class_exists('Laravel\Socialite\Facades\Socialite')) {
                \Log::error('Socialite not installed');
                return response()->json([
                    'message' => 'Social authentication not available',
                    'error' => 'Laravel Socialite is not installed'
                ], 500);
            }

            // Get configuration
            $config = config("services.{$provider}");

            // Check if config exists and has required values
            if (empty($config) || empty($config['client_id']) || empty($config['client_secret'])) {
                \Log::error('Missing OAuth configuration', [
                    'provider' => $provider,
                    'config_exists' => !empty($config),
                    'has_client_id' => !empty($config['client_id']),
                    'has_client_secret' => !empty($config['client_secret'])
                ]);

                return response()->json([
                    'message' => 'OAuth configuration missing',
                    'error' => "Missing {$provider} OAuth credentials in configuration. Please check your .env file for {$provider} credentials."
                ], 500);
            }

            // Use the redirect URI from config - this should match what's in Google Console
            $redirectUri = $config['redirect'];

            \Log::info('Building OAuth URL', [
                'provider' => $provider,
                'redirect_uri' => $redirectUri,
                'client_id' => substr($config['client_id'], 0, 10) . '...'
            ]);

            $socialiteDriver = Socialite::driver($provider)
                ->stateless()
                ->redirectUrl($redirectUri);

            // Force account selection for Google
            if ($provider === 'google') {
                $socialiteDriver = $socialiteDriver->with([
                    'prompt' => 'select_account',
                    'access_type' => 'offline'
                ]);
            }

            $url = $socialiteDriver->redirect()->getTargetUrl();

            \Log::info('OAuth URL generated successfully', [
                'provider' => $provider,
                'url_length' => strlen($url)
            ]);

            return response()->json([
                'url' => $url,
                'message' => 'Social auth URL generated successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Social auth URL error', [
                'provider' => $provider,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to get social auth URL',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle social authentication callback
     */
    public function handleSocialCallback(Request $request, $provider = null)
    {
        try {
            // Get provider from URL parameter or request body
            if (!$provider) {
                $provider = $request->input('provider');
            }

            \Log::info('Social callback initiated', [
                'provider' => $provider,
                'has_code' => !empty($request->input('code')),
                'request_method' => $request->method(),
                'all_input' => $request->all()
            ]);

            $validated = $this->validateProvider($provider);
            if (!$validated['success']) {
                \Log::error('Invalid provider', ['provider' => $provider]);
                return response()->json(['error' => $validated['message']], 400);
            }

            // For API, we expect the authorization code in the request
            $code = $request->input('code');
            if (!$code) {
                \Log::error('Missing authorization code', ['request_data' => $request->all()]);
                return response()->json(['error' => 'Authorization code is required'], 400);
            }

            // Use the same redirect URI as configured
            $config = config("services.{$provider}");
            $redirectUri = $config['redirect'];

            \Log::info('Using redirect URI for callback', ['redirect_uri' => $redirectUri]);

            // Get user from provider using the authorization code
            $socialUser = Socialite::driver($provider)
                ->stateless()
                ->redirectUrl($redirectUri)
                ->user();

            \Log::info('Social user retrieved', [
                'id' => $socialUser->getId(),
                'email' => $socialUser->getEmail(),
                'name' => $socialUser->getName()
            ]);

            // Check if user exists
            $user = User::where('email', $socialUser->getEmail())->first();

            if ($user) {
                \Log::info('Existing user found', ['user_id' => $user->id]);

                // Update user with social provider info if not already set
                $updateData = [];
                if (!$user->provider && $this->hasColumn('users', 'provider')) {
                    $updateData['provider'] = $provider;
                }
                if (!$user->provider_id && $this->hasColumn('users', 'provider_id')) {
                    $updateData['provider_id'] = $socialUser->getId();
                }
                if ($this->hasColumn('users', 'avatar') && $socialUser->getAvatar()) {
                    $updateData['avatar'] = $socialUser->getAvatar();
                }

                if (!empty($updateData)) {
                    $user->update($updateData);
                    \Log::info('Updated existing user with social info', $updateData);
                }
            } else {
                \Log::info('Creating new user');

                // Create new user
                $userData = [
                    'name' => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    'email_verified_at' => now(),
                    'password' => Hash::make(Str::random(24)), // Random password
                ];

                // Add social fields if columns exist
                if ($this->hasColumn('users', 'provider')) {
                    $userData['provider'] = $provider;
                }
                if ($this->hasColumn('users', 'provider_id')) {
                    $userData['provider_id'] = $socialUser->getId();
                }
                if ($this->hasColumn('users', 'avatar') && $socialUser->getAvatar()) {
                    $userData['avatar'] = $socialUser->getAvatar();
                }

                $user = User::create($userData);

                \Log::info('New user created', ['user_id' => $user->id]);
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;
            \Log::info('Token created for user', ['user_id' => $user->id]);

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Successfully authenticated with ' . ucfirst($provider)
            ]);

        } catch (\Exception $e) {
            \Log::error('Social callback error', [
                'provider' => $provider,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Social authentication failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate the social provider.
     */
    private function validateProvider($provider)
    {
        $allowedProviders = ['google', 'facebook', 'github'];

        if (!$provider || !in_array($provider, $allowedProviders)) {
            return [
                'success' => false,
                'message' => 'Provider "' . $provider . '" not supported. Supported providers: ' . implode(', ', $allowedProviders)
            ];
        }

        return ['success' => true];
    }

    /**
     * Check if a column exists in a table
     */
    private function hasColumn($table, $column)
    {
        try {
            return \Schema::hasColumn($table, $column);
        } catch (\Exception $e) {
            \Log::warning("Could not check if column {$column} exists in {$table}: " . $e->getMessage());
            return false;
        }
    }
}
