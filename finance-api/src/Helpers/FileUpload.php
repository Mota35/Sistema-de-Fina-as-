<?php

namespace App\Helpers;

class FileUpload
{
    private int $maxSize;
    private array $allowedTypes;

    public function __construct()
    {
        $this->maxSize      = (int) env('UPLOAD_MAX_SIZE', 5242880); // 5MB
        $this->allowedTypes = explode(',', env('ALLOWED_IMAGE_TYPES', 'image/jpeg,image/png,image/gif,image/webp'));
    }

    public function uploadAvatar(array $file): string
    {
        $this->validate($file);

        $ext      = $this->getExtension($file['type']);
        $filename = 'avatar_' . uniqid() . '_' . time() . '.' . $ext;
        
        // Ensure storage path is absolute and correct
        $absolutePath = ROOT_PATH . '/storage/uploads/avatars';
        if (!is_dir($absolutePath)) {
            mkdir($absolutePath, 0755, true);
        }

        $dest = $absolutePath . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            throw new \RuntimeException('Failed to save uploaded file to disk.');
        }

        // Return relative path for database and public URL matching (starting with storage/)
        return 'storage/uploads/avatars/' . $filename;
    }

    private function validate(array $file): void
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException($this->uploadError($file['error']));
        }

        if ($file['size'] > $this->maxSize) {
            throw new \InvalidArgumentException('File exceeds maximum allowed size (' . ($this->maxSize / 1048576) . 'MB).');
        }

        // Verify MIME from file content (not just extension)
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($file['tmp_name']);

        if (!in_array($mime, $this->allowedTypes, true)) {
            throw new \InvalidArgumentException("File type '$mime' is not allowed.");
        }
    }

    private function getExtension(string $mime): string
    {
        return match ($mime) {
            'image/jpeg'  => 'jpg',
            'image/png'   => 'png',
            'image/gif'   => 'gif',
            'image/webp'  => 'webp',
            default       => 'bin',
        };
    }

    public function deleteFile(string $relativePath): bool
    {
        // Relative path should be like 'storage/uploads/avatars/filename.jpg'
        $fullPath = ROOT_PATH . '/' . $relativePath;
        if (file_exists($fullPath) && is_file($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }

    private function uploadError(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'File too large.',
            UPLOAD_ERR_PARTIAL  => 'File only partially uploaded.',
            UPLOAD_ERR_NO_FILE  => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            default => 'Unknown upload error.',
        };
    }
}
