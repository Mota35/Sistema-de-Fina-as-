<?php

namespace App\Validators;

use App\Exceptions\ValidationException;

class Validator
{
    private array $errors = [];
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public static function make(array $data, array $rules): self
    {
        $instance = new self($data);
        $instance->validate($rules);
        return $instance;
    }

    public function validate(array $rules): void
    {
        foreach ($rules as $field => $ruleString) {
            $fieldRules = explode('|', $ruleString);
            $value = $this->data[$field] ?? null;

            foreach ($fieldRules as $rule) {
                $this->applyRule($field, $value, $rule);
            }
        }

        if (!empty($this->errors)) {
            throw new ValidationException($this->errors);
        }
    }

    private function applyRule(string $field, mixed $value, string $rule): void
    {
        [$ruleName, $param] = array_pad(explode(':', $rule, 2), 2, null);

        match ($ruleName) {
            'required' => $this->required($field, $value),
            'email'    => $this->email($field, $value),
            'min'      => $this->min($field, $value, (int) $param),
            'max'      => $this->max($field, $value, (int) $param),
            'numeric'  => $this->numeric($field, $value),
            'integer'  => $this->integer($field, $value),
            'in'       => $this->inList($field, $value, explode(',', $param ?? '')),
            'url'      => $this->url($field, $value),
            'date'     => $this->date($field, $value),
            'nullable' => null, // no-op
            'boolean'  => $this->boolean($field, $value),
            'string'   => $this->string($field, $value),
            'confirmed' => $this->confirmed($field, $value),
            default    => null,
        };
    }

    private function required(string $field, mixed $value): void
    {
        if ($value === null || $value === '' || (is_array($value) && empty($value))) {
            $this->addError($field, "O campo '$field' é obrigatório.");
        }
    }

    private function email(string $field, mixed $value): void
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->addError($field, "O campo '$field' deve ser um email válido.");
        }
    }

    private function min(string $field, mixed $value, int $min): void
    {
        if ($value === null || $value === '') return;
        $length = is_string($value) ? mb_strlen($value) : (float) $value;
        if ($length < $min) {
            $msg = is_string($value)
                ? "O campo '$field' deve ter pelo menos $min caracteres."
                : "O campo '$field' deve ser no mínimo $min.";
            $this->addError($field, $msg);
        }
    }

    private function max(string $field, mixed $value, int $max): void
    {
        if ($value === null || $value === '') return;
        $length = is_string($value) ? mb_strlen($value) : (float) $value;
        if ($length > $max) {
            $msg = is_string($value)
                ? "O campo '$field' deve ter no máximo $max caracteres."
                : "O campo '$field' deve ser no máximo $max.";
            $this->addError($field, $msg);
        }
    }

    private function numeric(string $field, mixed $value): void
    {
        if ($value !== null && $value !== '' && !is_numeric($value)) {
            $this->addError($field, "O campo '$field' deve ser numérico.");
        }
    }

    private function integer(string $field, mixed $value): void
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_INT)) {
            $this->addError($field, "O campo '$field' deve ser um inteiro.");
        }
    }

    private function inList(string $field, mixed $value, array $allowed): void
    {
        if ($value !== null && $value !== '' && !in_array($value, $allowed, true)) {
            $this->addError($field, "O campo '$field' deve ser um dos: " . implode(', ', $allowed) . '.');
        }
    }

    private function url(string $field, mixed $value): void
    {
        if ($value !== null && $value !== '' && !filter_var($value, FILTER_VALIDATE_URL)) {
            $this->addError($field, "O campo '$field' deve ser uma URL válida.");
        }
    }

    private function date(string $field, mixed $value): void
    {
        if ($value !== null && $value !== '') {
            $d = \DateTime::createFromFormat('Y-m-d', $value);
            if (!$d || $d->format('Y-m-d') !== $value) {
                $this->addError($field, "O campo '$field' deve ser uma data válida (YYYY-MM-DD).");
            }
        }
    }

    private function boolean(string $field, mixed $value): void
    {
        if ($value !== null && $value !== '' && !in_array($value, [true, false, 0, 1, '0', '1', 'true', 'false'], true)) {
            $this->addError($field, "O campo '$field' deve ser boolean.");
        }
    }

    private function string(string $field, mixed $value): void
    {
        if ($value !== null && !is_string($value)) {
            $this->addError($field, "O campo '$field' deve ser uma string.");
        }
    }

    private function confirmed(string $field, mixed $value): void
    {
        $confirmed = $this->data[$field . '_confirmation'] ?? null;
        if ($value !== $confirmed) {
            $this->addError($field, "O campo '$field' não coincide com a confirmação.");
        }
    }

    private function addError(string $field, string $message): void
    {
        $this->errors[$field][] = $message;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
