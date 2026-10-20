Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\cswas\.gemini\antigravity\brain\3c73326c-c1a0-4c79-b72b-ce31437b4955\thinai_app_icon_emerald_1792498197297.jpg"
$resDir = "C:\Users\cswas\Documents\THINAI\android\app\src\main\res"

$configs = @(
    @{ dir = "mipmap-mdpi";    legacy = 48;  fg = 108 },
    @{ dir = "mipmap-hdpi";    legacy = 72;  fg = 162 },
    @{ dir = "mipmap-xhdpi";   legacy = 96;  fg = 216 },
    @{ dir = "mipmap-xxhdpi";  legacy = 144; fg = 324 },
    @{ dir = "mipmap-xxxhdpi"; legacy = 192; fg = 432 }
)

$src = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($src, $w, $h, $isRound = $false) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($isRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $w, $h)
        $g.SetClip($path)
    }

    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    return $bmp
}

function Create-Foreground($src, $fgSize) {
    $bmp = New-Object System.Drawing.Bitmap($fgSize, $fgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Adaptive icons safe zone is central 66% - 72%
    $innerSize = [int]($fgSize * 0.72)
    $offset = [int](($fgSize - $innerSize) / 2)

    $g.DrawImage($src, $offset, $offset, $innerSize, $innerSize)
    $g.Dispose()
    return $bmp
}

function Create-Splash($src, $w, $h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill with THINAI deep emerald background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 1, 22, 18))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)
    $bgBrush.Dispose()

    # Draw centered icon at ~35% of the shortest side
    $iconSize = [int]([Math]::Min($w, $h) * 0.35)
    $x = [int](($w - $iconSize) / 2)
    $y = [int](($h - $iconSize) / 2)
    $g.DrawImage($src, $x, $y, $iconSize, $iconSize)
    $g.Dispose()
    return $bmp
}

foreach ($c in $configs) {
    $targetFolder = Join-Path $resDir $c.dir
    Write-Output "Generating icons for $($c.dir)..."

    # 1. Standard legacy icon
    $legacyBmp = Resize-Image $src $c.legacy $c.legacy $false
    $legacyPath = Join-Path $targetFolder "ic_launcher.png"
    $legacyBmp.Save($legacyPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $legacyBmp.Dispose()

    # 2. Round legacy icon
    $roundBmp = Resize-Image $src $c.legacy $c.legacy $true
    $roundPath = Join-Path $targetFolder "ic_launcher_round.png"
    $roundBmp.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $roundBmp.Dispose()

    # 3. Adaptive foreground icon
    $fgBmp = Create-Foreground $src $c.fg
    $fgPath = Join-Path $targetFolder "ic_launcher_foreground.png"
    $fgBmp.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $fgBmp.Dispose()
}

$splashConfigs = @(
    @{ dir = "drawable";             w = 480;  h = 320 },
    @{ dir = "drawable-land-mdpi";    w = 480;  h = 320 },
    @{ dir = "drawable-land-hdpi";    w = 800;  h = 480 },
    @{ dir = "drawable-land-xhdpi";   w = 1280; h = 720 },
    @{ dir = "drawable-land-xxhdpi";  w = 1600; h = 960 },
    @{ dir = "drawable-land-xxxhdpi"; w = 1920; h = 1280 },
    @{ dir = "drawable-port-mdpi";    w = 320;  h = 480 },
    @{ dir = "drawable-port-hdpi";    w = 480;  h = 800 },
    @{ dir = "drawable-port-xhdpi";   w = 720;  h = 1280 },
    @{ dir = "drawable-port-xxhdpi";  w = 960;  h = 1600 },
    @{ dir = "drawable-port-xxxhdpi"; w = 1280; h = 1920 }
)

foreach ($s in $splashConfigs) {
    $targetFolder = Join-Path $resDir $s.dir
    Write-Output "Generating splash for $($s.dir)..."
    $splashBmp = Create-Splash $src $s.w $s.h
    $splashPath = Join-Path $targetFolder "splash.png"
    $splashBmp.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $splashBmp.Dispose()
}

$src.Dispose()
Write-Output "All Android mipmap icons and splash screens generated successfully!"
