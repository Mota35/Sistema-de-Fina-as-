<?php
// Create PWA icons from a minimal PNG base64

$basePNG = base64_decode(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
);

$iconsDir = 'd:\Aplicações PHP, Angular\Projecto2\financial-ng\src\assets\icons';
$sizes = [72, 96, 128, 152, 192, 384, 512];

if (!is_dir($iconsDir)) {
    mkdir($iconsDir, 0755, true);
}

foreach ($sizes as $size) {
    $filename = $iconsDir . DIRECTORY_SEPARATOR . "icon-{$size}x{$size}.png";
    if (!file_exists($filename)) {
        file_put_contents($filename, $basePNG);
        echo "Created: $filename\n";
    } else {
        echo "Exists: $filename\n";
    }
}

echo "\nAll icons processed successfully!\n";
