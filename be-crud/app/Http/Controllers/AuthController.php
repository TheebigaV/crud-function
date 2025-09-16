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
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            $user = User::where('email', $request->email)->firstOrFail();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful'
            ]);

        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Login failed',
                'error' => $e->getMessage()
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
            if (empty($config['client_id']) || empty($config['client_secret'])) {
                \Log::error('Missing OAuth configuration', [
                    'provider' => $provider,
                    'has_client_id' => !empty($config['client_id']),
                    'has_client_secret' => !empty($config['client_secret'])
                ]);
                return response()->json([
                    'message' => 'OAuth configuration missing',
                    'error' => "Missing {$provider} OAuth credentials in configuration"
                ], 500);
            }

            // Build the OAuth URL with correct redirect URI
            $redirectUri = $config['redirect'] ?? "http://localhost:3000/auth/callback/{$provider}";

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
    public function handleSocialCallback(Request $request, $provider)
    {
        try {
            \Log::info('Social callback initiated', [
                'provider' => $provider,
                'has_code' => !empty($request->input('code'))
            ]);

            $validated = $this->validateProvider($provider);
            if (!$validated['success']) {
                \Log::error('Invalid provider', ['provider' => $provider]);
                return response()->json(['error' => $validated['message']], 400);
            }

            // For API, we expect the authorization code in the request
            $code = $request->input('code');
            if (!$code) {
                \Log::error('Missing authorization code');
                return response()->json(['error' => 'Authorization code is required'], 400);
            }

            // Set the redirect URI to match what was used for the authorization
            $redirectUri = config("services.{$provider}.redirect");
            \Log::info('Using redirect URI', ['redirect_uri' => $redirectUri]);

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
                if (!$user->provider) {
                    $user->update([
                        'provider' => $provider,
                        'provider_id' => $socialUser->getId(),
                        'avatar' => $socialUser->getAvatar(),
                    ]);
                    \Log::info('Updated existing user with social info');
                }
            } else {
                \Log::info('Creating new user');

                // Create new user
                $user = User::create([
                    'name' => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    'provider' => $provider,
                    'provider_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                    'email_verified_at' => now(),
                    'password' => Hash::make(Str::random(24)), // Random password
                ]);

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
     * Link a social account to an existing authenticated user.
     */
    public function linkSocialAccount(Request $request, $provider)
    {
        try {
            $validated = $this->validateProvider($provider);
            if (!$validated['success']) {
                return response()->json(['error' => $validated['message']], 400);
            }

            $user = $request->user();

            // Check if user already has a linked provider
            if ($user->provider) {
                return response()->json([
                    'error' => 'Account already linked to ' . ucfirst($user->provider)
                ], 400);
            }

            // Get authorization URL for linking
            $redirectUri = config("services.{$provider}.redirect");
            $url = Socialite::driver($provider)
                ->stateless()
                ->redirectUrl($redirectUri)
                ->redirect()
                ->getTargetUrl();

            return response()->json([
                'url' => $url,
                'message' => 'Redirect to ' . ucfirst($provider) . ' to link account'
            ]);

        } catch (\Exception $e) {
            \Log::error('Link account error: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to initiate account linking: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unlink social account from authenticated user.
     */
    public function unlinkSocialAccount(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->provider) {
                return response()->json([
                    'error' => 'No social account linked'
                ], 400);
            }

            // Check if user has a password set
            if (!$user->password) {
                return response()->json([
                    'error' => 'Cannot unlink social account without a password set. Please set a password first.'
                ], 400);
            }

            $provider = $user->provider;

            // Remove social provider info
            $user->update([
                'provider' => null,
                'provider_id' => null,
                'avatar' => null,
            ]);

            return response()->json([
                'user' => $user->fresh(),
                'message' => 'Successfully unlinked ' . ucfirst($provider) . ' account'
            ]);

        } catch (\Exception $e) {
            \Log::error('Unlink account error: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to unlink account: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate the social provider.
     */
    private function validateProvider($provider)
    {
        $allowedProviders = ['google', 'facebook', 'github'];

        if (!in_array($provider, $allowedProviders)) {
            return [
                'success' => false,
                'message' => 'Provider "' . $provider . '" not supported. Supported providers: ' . implode(', ', $allowedProviders)
            ];
        }

        return ['success' => true];
    }
}
