<?php

namespace App\Services;

use App\Repositories\TransferRepository;
use App\Repositories\UserRepository;
use App\Repositories\AccountRepository;
use App\Exceptions\ValidationException;
use App\Exceptions\NotFoundException;
use App\Config\Database;

class TransferService
{
    public function __construct(
        private TransferRepository $repo = new TransferRepository(),
        private UserRepository $userRepo = new UserRepository(),
        private AccountRepository $accountRepo = new AccountRepository()
    ) {}

    public function transfer(int $senderUserId, array $data): array
    {
        $amount = (float) $data['amount'];
        $description = sanitize($data['description'] ?? '');
        $recipientIdentifier = $data['recipient']; // email or id_conta
        $senderAccountId = (int) $data['sender_account_id'];

        if ($amount <= 0) {
            throw new ValidationException(['amount' => ['O valor deve ser maior que zero.']]);
        }

        // 1. Find Sender Account
        $senderAccount = $this->accountRepo->findUserAccount($senderAccountId, $senderUserId);
        if (!$senderAccount) {
            throw new NotFoundException('Conta de origem não encontrada.');
        }

        // 2. Check Balance
        if ($senderAccount['balance'] < $amount) {
            throw new ValidationException(['amount' => ['Saldo insuficiente na conta selecionada.']]);
        }

        // 3. Find Recipient
        $recipient = null;
        if (str_contains($recipientIdentifier, '@')) {
            $recipient = $this->userRepo->findByEmail($recipientIdentifier);
        } else {
            $recipient = $this->userRepo->findByIdConta($recipientIdentifier);
        }

        if (!$recipient) {
            throw new ValidationException(['recipient' => ['Usuário não encontrado.']]);
        }

        if ($recipient['id'] == $senderUserId) {
            throw new ValidationException(['recipient' => ['Não pode enviar dinheiro para si mesmo.']]);
        }

        // 4. Find Recipient Account (Default receiving or Oldest account)
        $recipientAccount = $this->accountRepo->findDefaultReceiving($recipient['id']);
        
        if (!$recipientAccount) {
            $recipientAccount = $this->accountRepo->findOldestAccount($recipient['id']);
            if (!$recipientAccount) {
                throw new ValidationException(['recipient' => ['O destinatário não possui uma conta ativa para receber o valor.']]);
            }
        }

        // 5. Perform Transfer (Transaction)
        $db = Database::getInstance();
        try {
            $db->beginTransaction();

            // Create transfer record
            $transferId = $this->repo->create([
                'sender_id' => $senderUserId,
                'receiver_id' => $recipient['id'],
                'sender_account_id' => $senderAccountId,
                'receiver_account_id' => $recipientAccount['id'],
                'amount' => $amount,
                'description' => $description
            ]);

            // Update Balances
            $this->accountRepo->update($senderAccountId, [
                'balance' => $senderAccount['balance'] - $amount
            ]);
            $this->accountRepo->update($recipientAccount['id'], [
                'balance' => $recipientAccount['balance'] + $amount
            ]);

            $db->commit();
            return $this->repo->findById($transferId);

        } catch (\Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }

    public function history(int $accountId, int $userId, int $page = 1, int $perPage = 20): array
    {
        // Verify account belongs to user
        $account = $this->accountRepo->findUserAccount($accountId, $userId);
        if (!$account) {
            throw new NotFoundException('Conta não encontrada.');
        }

        return $this->repo->getCombinedHistory($accountId, $page, $perPage);
    }
}
