Add-Type -AssemblyName System.Drawing

$size = 512
$radius = 90  # corner radius

$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Fill entire bitmap transparent first
$g.Clear([System.Drawing.Color]::Transparent)

# Draw rounded rectangle background  #1a1830
$bgColor = [System.Drawing.Color]::FromArgb(255, 26, 24, 48)
$bgBrush = New-Object System.Drawing.SolidBrush($bgColor)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
$path.AddArc($size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
$path.AddArc($size - $radius * 2, $size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
$path.AddArc(0, $size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
$path.CloseFigure()
$g.FillPath($bgBrush, $path)

# Draw the cross  #d4a853
$crossColor = [System.Drawing.Color]::FromArgb(255, 212, 168, 83)
$crossBrush = New-Object System.Drawing.SolidBrush($crossColor)

# Vertical bar of cross
$vWidth = 52
$vHeight = 300
$vX = ($size - $vWidth) / 2
$vY = ($size - $vHeight) / 2 + 10
$g.FillRectangle($crossBrush, $vX, $vY, $vWidth, $vHeight)

# Horizontal bar of cross
$hWidth = 220
$hHeight = 52
$hX = ($size - $hWidth) / 2
$hY = ($size / 2) - 60
$g.FillRectangle($crossBrush, $hX, $hY, $hWidth, $hHeight)

$g.Dispose()

$publicPath = "c:\Users\touda\Downloads\bible-app (1)\bible-app\public"

# Save as PNG
$bmp.Save("$publicPath\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "logo.png saved"

# Save as JPEG (no transparency)
$jpgBmp = New-Object System.Drawing.Bitmap($size, $size)
$jpgG = [System.Drawing.Graphics]::FromImage($jpgBmp)
$jpgG.Clear([System.Drawing.Color]::FromArgb(255, 26, 24, 48))
$jpgG.DrawImage($bmp, 0, 0)
$jpgG.Dispose()

$jpgEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$jpgParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$jpgParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95L)
$jpgBmp.Save("$publicPath\logo.jpg", $jpgEncoder, $jpgParams)
Write-Host "logo.jpg saved"

$bmp.Dispose()
$jpgBmp.Dispose()

Write-Host "Done! Both logo.png and logo.jpg created at 512x512"
