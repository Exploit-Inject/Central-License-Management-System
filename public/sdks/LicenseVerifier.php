<?php
/**
 * ExploitInject Central Licensing System - PHP SDK
 * Features: RSA-2048 Digital Signatures + Configurable Offline Grace Period
 *
 * @version 2.0.0
 * @author ExploitInject Security
 */
class LicenseVerifier {
    private static $api_url = 'http://localhost:3001/api/verify.php';
    // Production URL: 'https://your-domain.com/api/verify.php';

    /**
     * RSA 2048-bit Public Key for signature validation
     */
    private static $public_key = "-----BEGIN PUBLIC KEY-----\n"
        . "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtFQySUD6XK4RcrDVRN5N\n"
        . "Iqnq9OGM6DGULA4EennLv4wmEnGdJwsgouY7f6Qu3G6+mwzdYMlcpxNgBpWfAQWe\n"
        . "XaZ59U+tzkGACTiUx9/fcsbUrzZ69hJp22lEeQKJf1W6Go9ckwq0r7YRSTNN3i3D\n"
        . "eCVAQxCIGB3zE5kBsGB7+2kxAGoW3yUqds7X45p0N0z+xAOofpgthYlhSz/9mptW\n"
        . "pDglWV/3ZfB3EgYwL9meHAeKdRYR/GLgwWxAIJp0fKOQBqKVKRpfpzEcbXn/Uhj9\n"
        . "afh7i9zS1RXvACgFK62GgVttT+wGqMA08unOYYmeqzcMuwEHPlgsf+ichTTTVKgq\n"
        . "VwIDAQAB\n"
        . "-----END PUBLIC KEY-----";

    private static function get_cache_file($product_slug) {
        $dir = sys_get_temp_dir() . '/.ei_license_cache';
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        return $dir . '/' . md5($product_slug) . '.cache';
    }

    /**
     * Main check function called on application boot.
     */
    public static function check($product_slug, $config_file) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $license_key = '';
        if (defined('LICENSE_KEY')) {
            $license_key = LICENSE_KEY;
        } elseif (file_exists($config_file)) {
            $content = file_get_contents($config_file);
            if (preg_match("/define\\(\\s*['\"]LICENSE_KEY['\"]\\s*,\\s*['\"](.*?)['\"]\\s*\\);/", $content, $matches)) {
                $license_key = $matches[1];
                if (!defined('LICENSE_KEY')) {
                    define('LICENSE_KEY', $license_key);
                }
            }
        }

        // Handle Activation Form
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['activate_license'])) {
            $license_key = trim($_POST['license_key'] ?? '');
            if (empty($license_key)) {
                self::render_ui($product_slug, 'License key cannot be empty.');
            }

            $res = self::call_api($product_slug, $license_key);
            if ($res && isset($res['status']) && $res['status'] === 'valid') {
                self::save_cache($product_slug, $license_key, $res);
                self::save_key_to_config($config_file, $license_key);
                $_SESSION['license_verified_' . $product_slug] = $license_key;
                header("Location: " . $_SERVER['REQUEST_URI']);
                exit;
            } else {
                $error = $res['message'] ?? 'Activation failed. Please check your key.';
                self::render_ui($product_slug, $error);
            }
        }

        if (empty($license_key)) {
            self::render_ui($product_slug);
        }

        // Fast session check (valid within current user session)
        if (isset($_SESSION['license_verified_' . $product_slug]) && $_SESSION['license_verified_' . $product_slug] === $license_key) {
            return true;
        }

        // Online Verification
        $res = self::call_api($product_slug, $license_key);

        if ($res && isset($res['status']) && $res['status'] === 'valid') {
            self::save_cache($product_slug, $license_key, $res);
            $_SESSION['license_verified_' . $product_slug] = $license_key;
            return true;
        }

        // If server is unreachable, check OFFLINE GRACE PERIOD
        if ($res && isset($res['status']) && $res['status'] === 'error') {
            $cached = self::read_cache($product_slug, $license_key);
            if ($cached && isset($cached['valid_until'])) {
                $now = time();
                if ($now <= $cached['valid_until']) {
                    // Within Offline Grace Period - allow access!
                    $_SESSION['license_verified_' . $product_slug] = $license_key;
                    $grace_left_hours = round(($cached['valid_until'] - $now) / 3600);
                    error_log("License Server Unreachable. Running under Offline Grace Period ({$grace_left_hours}h left).");
                    return true;
                } else {
                    self::render_ui($product_slug, 'Offline Grace Period expired. Please check internet connection to re-verify license.', true);
                }
            }
        }

        // Definite reject: suspended, expired, mismatch
        $error_msg = $res['message'] ?? 'License key is suspended or invalid.';
        unset($_SESSION['license_verified_' . $product_slug]);
        self::clear_cache($product_slug);
        self::render_ui($product_slug, $error_msg, true);
    }

    private static function save_cache($product_slug, $license_key, $api_data) {
        $file = self::get_cache_file($product_slug);
        $payload = [
            'key'         => $license_key,
            'status'      => 'valid',
            'valid_until' => $api_data['valid_until'] ?? (time() + 3 * 86400),
            'timestamp'   => $api_data['timestamp'] ?? time(),
            'signature'   => $api_data['signature'] ?? '',
        ];
        @file_put_contents($file, json_encode($payload));
    }

    private static function read_cache($product_slug, $license_key) {
        $file = self::get_cache_file($product_slug);
        if (!file_exists($file)) return null;
        $content = @file_get_contents($file);
        $data = json_decode($content, true);
        if (!$data || !isset($data['key']) || $data['key'] !== $license_key) {
            return null;
        }
        return $data;
    }

    private static function clear_cache($product_slug) {
        $file = self::get_cache_file($product_slug);
        if (file_exists($file)) @unlink($file);
    }

    private static function verify_signature($data, $product_slug, $license_key, $domain) {
        if (!isset($data['signature']) || !isset($data['timestamp']) || !isset($data['status'])) {
            return false;
        }
        $payload = "{$data['status']}|{$product_slug}|{$license_key}|{$domain}|{$data['timestamp']}";
        $pubkey_id = openssl_pkey_get_public(self::$public_key);
        if (!$pubkey_id) return false;
        $res = openssl_verify($payload, base64_decode($data['signature']), $pubkey_id, OPENSSL_ALGO_SHA256);
        if (function_exists('openssl_free_key')) @openssl_free_key($pubkey_id);
        return ($res === 1);
    }

    private static function call_api($product_slug, $license_key) {
        $domain = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $post = [
            'product_slug' => $product_slug,
            'license_key'  => $license_key,
            'domain'       => $domain,
        ];

        $ch = curl_init(self::$api_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        $response = curl_exec($ch);
        $curl_error = curl_error($ch);
        curl_close($ch);

        if (!$response) {
            return ['status' => 'error', 'message' => "License server unreachable: $curl_error"];
        }

        $data = json_decode($response, true);
        if (!$data || !is_array($data)) {
            return ['status' => 'error', 'message' => 'Invalid response from licensing server.'];
        }

        if (!self::verify_signature($data, $product_slug, $license_key, $domain)) {
            return ['status' => 'invalid', 'message' => 'Cryptographic signature verification failed. Response may be forged.'];
        }

        return $data;
    }

    private static function save_key_to_config($config_file, $license_key) {
        if (!file_exists($config_file)) {
            return @file_put_contents($config_file, "<?php\ndefine('LICENSE_KEY', '" . addslashes($license_key) . "');\n") !== false;
        }
        $content = file_get_contents($config_file);
        if (preg_match("/define\\(\\s*['\"]LICENSE_KEY['\"]\\s*,\\s*['\"](.*?)['\"]\\s*\\);/", $content)) {
            $content = preg_replace("/define\\(\\s*['\"]LICENSE_KEY['\"]\\s*,\\s*['\"](.*?)['\"]\\s*\\);/", "define('LICENSE_KEY', '" . addslashes($license_key) . "');", $content);
        } else {
            $content = str_replace("<?php", "<?php\ndefine('LICENSE_KEY', '" . addslashes($license_key) . "');\n", $content);
        }
        return @file_put_contents($config_file, $content) !== false;
    }

    private static function render_ui($product_slug, $error = '', $is_blocked = false) {
        http_response_code($is_blocked ? 403 : 200);
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>License Verification Required</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
                body { background: #05070e; color: #fff; font-family: 'Montserrat', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
                .card-box { background: rgba(9, 14, 26, 0.95); border: 1px solid rgba(0, 234, 255, 0.25); border-radius: 20px; padding: 40px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.8); }
                .btn-activate { background: linear-gradient(135deg, #00eaff 0%, #00a8ff 100%); color: #05070e; font-weight: 700; border: none; border-radius: 30px; padding: 12px; width: 100%; }
                .form-control { background: rgba(5,8,18,0.9); border: 1px solid rgba(0,234,255,0.25); color: #fff; border-radius: 10px; padding: 12px; }
            </style>
        </head>
        <body>
            <div class="card-box text-center">
                <h3 class="fw-bold mb-2">License Activation</h3>
                <p class="text-secondary small mb-4">Product: <code style="color:#00eaff;"><?php echo htmlspecialchars($product_slug); ?></code></p>
                <?php if ($error): ?>
                    <div class="alert alert-danger small py-2"><?php echo htmlspecialchars($error); ?></div>
                <?php endif; ?>
                <form method="POST">
                    <div class="mb-3 text-start">
                        <label class="form-label small text-secondary">ENTER LICENSE KEY</label>
                        <input type="text" name="license_key" class="form-control" placeholder="XXXX-XXXX-XXXX-XXXX" required>
                    </div>
                    <button type="submit" name="activate_license" class="btn btn-activate">ACTIVATE SYSTEM</button>
                </form>
            </div>
        </body>
        </html>
        <?php
        exit;
    }
}

