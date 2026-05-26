<?php

namespace App\Helpers;

class Mailer
{
    private string $host;
    private int    $port;
    private string $username;
    private string $password;
    private string $fromAddress;
    private string $fromName;

    public function __construct()
    {
        $this->host        = env('MAIL_HOST', 'smtp.gmail.com');
        $this->port        = (int) env('MAIL_PORT', 587);
        $this->username    = env('MAIL_USERNAME', '');
        $this->password    = env('MAIL_PASSWORD', '');
        $this->fromAddress = env('MAIL_FROM_ADDRESS', 'noreply@finance.com');
        $this->fromName    = env('MAIL_FROM_NAME', 'Finance Manager');
    }

    public function send(string $to, string $subject, string $body): bool
    {
        // Native PHP mail() — for production, replace with PHPMailer/SMTP
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$this->fromName} <{$this->fromAddress}>\r\n";
        $headers .= "Reply-To: {$this->fromAddress}\r\n";
        $headers .= "X-Mailer: PHP/" . PHP_VERSION;

        $result = mail($to, $subject, $body, $headers);

        $logger = new Logger();
        if ($result) {
            $logger->info("Email sent to $to: $subject");
        } else {
            $logger->error("Failed to send email to $to: $subject");
        }

        return $result;
    }

    public function sendPasswordReset(string $to, string $name, string $token): bool
    {
        $resetUrl = env('FRONTEND_URL', 'http://localhost:4200') . '/auth/reset-password?token=' . $token;
        $subject  = 'Recuperação de Senha - ' . env('APP_NAME');

        $body = "
        <html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
            <div style='background:#1a1a2e;padding:30px;border-radius:8px 8px 0 0'>
                <h1 style='color:#e94560;margin:0'>Finance Manager</h1>
            </div>
            <div style='background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px'>
                <h2 style='color:#333'>Recuperação de Senha</h2>
                <p>Olá <strong>$name</strong>,</p>
                <p>Recebemos um pedido para redefinir a sua senha. Clique no botão abaixo:</p>
                <p style='text-align:center;margin:30px 0'>
                    <a href='$resetUrl'
                       style='background:#e94560;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold'>
                        Redefinir Senha
                    </a>
                </p>
                <p style='color:#666;font-size:14px'>Este link expira em <strong>1 hora</strong>.</p>
                <p style='color:#666;font-size:14px'>Se não solicitou, ignore este email.</p>
                <hr style='border:none;border-top:1px solid #ddd;margin:20px 0'>
                <p style='color:#999;font-size:12px;text-align:center'>© " . date('Y') . " Finance Manager</p>
            </div>
        </body></html>";

        return $this->send($to, $subject, $body);
    }

    public function sendWelcome(string $to, string $name): bool
    {
        $subject = 'Bem-vindo ao Finance Manager!';

        $body = "
        <html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto'>
            <div style='background:#1a1a2e;padding:30px;border-radius:8px 8px 0 0'>
                <h1 style='color:#e94560;margin:0'>Finance Manager</h1>
            </div>
            <div style='background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px'>
                <h2 style='color:#333'>Conta criada com sucesso! 🎉</h2>
                <p>Olá <strong>$name</strong>,</p>
                <p>A sua conta foi criada com sucesso. Agora pode gerir as suas finanças pessoais de forma inteligente.</p>
                <p style='color:#666;font-size:14px'>Comece adicionando as suas contas e transações.</p>
            </div>
        </body></html>";

        return $this->send($to, $subject, $body);
    }
}
