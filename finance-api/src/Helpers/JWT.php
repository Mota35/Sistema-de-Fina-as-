<?php

namespace App\Helpers;

use App\Exceptions\UnauthorizedException;

class JWT
{
    private static string $algorithm = 'HS256';

    // ─── Encode ──────────────────────────────────────────────────────────────
    public static function encode(array $payload, ?string $secret = null): string
    {
        $secret ??= env('JWT_SECRET', 'changeme');

        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => self::$algorithm,
        ]));

        $payload['iat'] ??= time();
        $payload['exp'] ??= time() + (int) env('JWT_EXPIRY', 86400);

        $encodedPayload = self::base64UrlEncode(json_encode($payload));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$encodedPayload", $secret, true)
        );

        return "$header.$encodedPayload.$signature";
    }

    // ─── Decode ───────────────────────────────────────────────────────────────
    public static function decode(string $token, ?string $secret = null): array
    {
        $secret ??= env('JWT_SECRET', 'changeme');

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new UnauthorizedException('Invalid token format.');
        }

        [$encodedHeader, $encodedPayload, $signature] = $parts;

        $expectedSig = self::base64UrlEncode(
            hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secret, true)
        );

        if (!hash_equals($expectedSig, $signature)) {
            throw new UnauthorizedException('Invalid token signature.');
        }

        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);

        if (!is_array($payload)) {
            throw new UnauthorizedException('Invalid token payload.');
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new UnauthorizedException('Token has expired.');
        }

        return $payload;
    }

    // ─── Generate access + refresh pair ──────────────────────────────────────
    public static function generateTokenPair(array $userPayload): array
    {
        $accessToken = self::encode(array_merge($userPayload, [
            'type' => 'access',
            'exp'  => time() + (int) env('JWT_EXPIRY', 86400),
        ]));

        $refreshToken = self::encode(array_merge($userPayload, [
            'type' => 'refresh',
            'exp'  => time() + (int) env('JWT_REFRESH_EXPIRY', 604800),
        ]));

        return [
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type'    => 'Bearer',
            'expires_in'    => (int) env('JWT_EXPIRY', 86400),
        ];
    }

    // ─── Extract token from Authorization header ──────────────────────────────
    public static function fromHeader(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';

        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }
}
