# Create fonts directory if it doesn't exist
$fontsDir = "assets/fonts"
if (-not (Test-Path -Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null
}

# Font URLs
$fontUrls = @{
    "Inter-Regular.woff2" = "https://rsms.me/inter/font-files/Inter-Regular.woff2"
    "Inter-Regular.woff" = "https://rsms.me/inter/font-files/Inter-Regular.woff"
    "Inter-Medium.woff2" = "https://rsms.me/inter/font-files/Inter-Medium.woff2"
    "Inter-Medium.woff" = "https://rsms.me/inter/font-files/Inter-Medium.woff"
    "Inter-Bold.woff2" = "https://rsms.me/inter/font-files/Inter-Bold.woff2"
    "Inter-Bold.woff" = "https://rsms.me/inter/font-files/Inter-Bold.woff"
    "PlusJakartaSans-SemiBold.woff2" = "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIZaomveNfLb85NDeh_p-5Iq0H_gMHRJXVBD2YHxQrQrQ.ttf"
    "PlusJakartaSans-SemiBold.woff" = "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIZaomveNfLb85NDeh_p-5Iq0H_gMHRJXVBD2YHxQrQrQ.ttf"
    "PlusJakartaSans-Bold.woff2" = "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIZaomveNfLb85NDeh_p-5Iq0H_gMHRJXVBD2YHxQrQrQ.ttf"
    "PlusJakartaSans-Bold.woff" = "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIZaomveNfLb85NDeh_p-5Iq0H_gMHRJXVBD2YHxQrQrQ.ttf"
}

# Download each font file
foreach ($fontFile in $fontUrls.Keys) {
    $fontPath = Join-Path $fontsDir $fontFile
    $fontUrl = $fontUrls[$fontFile]
    
    Write-Host "Downloading $fontFile..."
    try {
        Invoke-WebRequest -Uri $fontUrl -OutFile $fontPath -UseBasicParsing
        Write-Host "Downloaded $fontFile" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download $fontFile : $_" -ForegroundColor Red
    }
}

Write-Host "Font download complete!" -ForegroundColor Green
