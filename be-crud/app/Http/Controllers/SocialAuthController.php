<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class SocialAuthController extends Controller
{
    /**
     * Redirect the user to the OAuth Provider.
     */
    public function redirectToProvider($provider)
    {
        try {
            $validated = $this->validateProvider($provider);
            if (!$validated['success']) {
                return response()->json(['error' => $validated['message']], 400);
            }

            // Build the OAuth URL with correct redirect URI and force account selection
            $redirectUri = config("services.{$provider}.redirect");

            $socialiteDriver = Socialite::driver($provider)
                ->stateless()
                ->redirectUrl($redirectUri);

            // Force account selection for Google
            if ($provider === 'google') {
                $socialiteDriver = $socialiteDriver->with(['prompt' => 'select_account']);
            }

            $url = $socialiteDriver->redirect()->getTargetUrl();

            return response()->json([
                'url' => $url
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Unable to redirect to ' . $provider . '. ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtain the user information from the OAuth Provider.
     */
    public function handleProviderCallback(Request $request, $provider)
    {
        try {
            $validated = $this->validateProvider($provider);
            if (!$validated['success']) {
                return response()->json(['error' => $validated['message']], 400);
            }

            // For API, we expect the authorization code in the request
            $code = $request->input('code');
            if (!$code) {
                return response()->json(['error' => 'Authorization code is required'], 400);
            }

            // Set the redirect URI to match what was used for the authorization
            $redirectUri = config("services.{$provider}.redirect");

            // Get user from provider using the authorization code
            $socialUser = Socialite::driver($provider)
                ->stateless()
                ->redirectUrl($redirectUri)
                ->user();

            // Check if user exists
            $user = User::where('email', $socialUser->getEmail())->first();

            if ($user) {
                // Update user with social provider info if not already set
                if (!$user->provider) {
                    $user->update([
                        'provider' => $provider,
                        'provider_id' => $socialUser->getId(),
                        'avatar' => $socialUser->getAvatar(),
                    ]);
                }
            } else {
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
            }

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Successfully authenticated with ' . ucfirst($provider)
            ]);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'Authentication failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Link a social account to an existing authenticated user.
     */
    public function linkAccount(Request $request, $provider)
    {
        try {
            $validated = $this->validateProvider($provider);
            if (!$validated['success']) {
                return response()->json(['error' => $validated['message']], 400);
            }

            $user = Auth::user();

            // Check if user already has a linked provider
            if ($user->provider) {
                return response()->json([
                    'error' => 'Account already linked to ' . ucfirst($user->provider)
                ], 400);
            }

            // Get user from provider
            $socialUser = Socialite::driver($provider)->stateless()->user();

            // Check if this social account is already linked to another user
            $existingUser = User::where('provider', $provider)
                              ->where('provider_id', $socialUser->getId())
                              ->where('id', '!=', $user->id)
                              ->first();

            if ($existingUser) {
                return response()->json([
                    'error' => 'This ' . ucfirst($provider) . ' account is already linked to another user'
                ], 400);
            }

            // Update user with social provider info
            $user->update([
                'provider' => $provider,
                'provider_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
            ]);

            return response()->json([
                'user' => $user->fresh(),
                'message' => 'Successfully linked ' . ucfirst($provider) . ' account'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'Failed to link account: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unlink social account from authenticated user.
     */
    public function unlinkAccount(Request $request)
    {
        try {
            $user = Auth::user();

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

        } catch (Exception $e) {
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
        $allowedProviders = ['google'];

        if (!in_array($provider, $allowedProviders)) {
            return [
                'success' => false,
                'message' => 'Provider "' . $provider . '" not supported. Supported providers: ' . implode(', ', $allowedProviders)
            ];
        }

        return ['success' => true];
    }
}
