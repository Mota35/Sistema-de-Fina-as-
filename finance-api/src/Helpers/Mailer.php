<?php

namespace App\Helpers;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class Mailer
{
    private string $host;
    private int    $port;
    private string $username;
    private string $password;
    private string $fromAddress;
    private string $fromName;
    private string $encryption;

    public function __construct()
    {
        $this->host        = env('MAIL_HOST', 'smtp.gmail.com');
        $this->port        = (int) env('MAIL_PORT', 587);
        $this->username    = env('MAIL_USERNAME', '');
        $this->password    = env('MAIL_PASSWORD', '');
        $this->fromAddress = env('MAIL_FROM_ADDRESS', 'noreply@finance.com');
        $this->fromName    = env('MAIL_FROM_NAME', 'FinStruct Wealth');
        $this->encryption  = env('MAIL_ENCRYPTION', 'tls');
    }

    public function send(string $to, string $subject, string $body): bool
    {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = $this->host;
            $mail->SMTPAuth   = !empty($this->password);
            $mail->Username   = $this->username;
            $mail->Password   = $this->password;
            $mail->SMTPSecure = $this->encryption === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $this->port;
            $mail->CharSet    = 'UTF-8';

            // Recipients
            $mail->setFrom($this->fromAddress, $this->fromName);
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;

            $mail->send();
            
            $logger = new Logger();
            $logger->info("Email sent via PHPMailer to $to: $subject");
            return true;
        } catch (Exception $e) {
            $logger = new Logger();
            $logger->error("PHPMailer error: {$mail->ErrorInfo}");
            return false;
        }
    }

    public function sendPasswordReset(string $to, string $name, string $code): bool
    {
        $subject = 'Código de Recuperação - ' . env('APP_NAME', 'FinStruct');

        $body = "
        <html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333'>
            <div style='background:#0a0a0a;padding:40px;border-radius:12px 12px 0 0;text-align:center'>
                <h1 style='color:#f59e0b;margin:0;font-size:24px'>FinStruct Wealth</h1>
            </div>
            <div style='background:#ffffff;padding:40px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none'>
                <h2 style='color:#111;font-weight:900;margin-top:0'>Recuperação de Acesso</h2>
                <p>Olá <strong>$name</strong>,</p>
                <p>Recebemos um pedido para redefinir a sua senha. Utilize o código de 6 dígitos abaixo para prosseguir:</p>
                
                <div style='background:#f8f9fa;padding:24px;border-radius:12px;text-align:center;margin:32px 0;border:1px dashed #ddd'>
                    <span style='font-family:monospace;font-size:32px;font-weight:900;letter-spacing:8px;color:#f59e0b'>$code</span>
                </div>
                
                <p style='color:#666;font-size:13px'>Este código expira em <strong>1 hora</strong>.</p>
                <p style='color:#666;font-size:13px'>Se não solicitou esta alteração, pode ignorar este email com segurança.</p>
                <hr style='border:none;border-top:1px solid #eee;margin:32px 0'>
                <p style='color:#999;font-size:11px;text-align:center'>© " . date('Y') . " FinStruct Intelligence. Todos os direitos reservados.</p>
            </div>
        </body></html>";

        return $this->send($to, $subject, $body);
    }

    public function sendWelcome(string $to, string $name): bool
    {
        $subject = 'Bem-vindo à FinStruct Wealth!';

        $body = "
        <html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333'>
            <div style='background:#0a0a0a;padding:40px;border-radius:12px 12px 0 0;text-align:center'>
                <h1 style='color:#f59e0b;margin:0;font-size:24px'>FinStruct Wealth</h1>
            </div>
            <div style='background:#ffffff;padding:40px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none'>
                <h2 style='color:#111;font-weight:900;margin-top:0'>Conta criada com sucesso! 🎉</h2>
                <p>Olá <strong>$name</strong>,</p>
                <p>A sua conta foi configurada com sucesso. Agora você tem acesso à inteligência estratégica para gestão do seu patrimônio.</p>
                <p style='color:#666;font-size:14px;margin-top:24px'>Comece estruturando as suas contas e objetivos financeiros hoje mesmo.</p>
            </div>
        </body></html>";

        return $this->send($to, $subject, $body);
    }
}
