Add-Type -AssemblyName System.Drawing
function C([string]$h){ [System.Drawing.ColorTranslator]::FromHtml($h) }
function B([string]$h){ New-Object System.Drawing.SolidBrush (C $h) }
function P([string]$h,[float]$w){ New-Object System.Drawing.Pen ((C $h),$w) }
function RoundedPath([float]$x,[float]$y,[float]$w,[float]$h,[float]$r){$g=New-Object System.Drawing.Drawing2D.GraphicsPath;$g.AddArc($x,$y,$r*2,$r*2,180,90);$g.AddArc($x+$w-$r*2,$y,$r*2,$r*2,270,90);$g.AddArc($x+$w-$r*2,$y+$h-$r*2,$r*2,$r*2,0,90);$g.AddArc($x,$y+$h-$r*2,$r*2,$r*2,90,90);$g.CloseFigure();$g}
function DrawMark($g,[int]$size,[bool]$maskable){
  $inset=if($maskable){[int]($size*.14)}else{[int]($size*.08)};$side=$size-2*$inset;$r=[int]($side*.19)
  $p=RoundedPath $inset $inset $side $side $r;$g.FillPath((B '#2E6B52'),$p)
  $pad=[int]($side*.18);$grid=$side-2*$pad;$cell=[int]($grid*.42);$gap=$grid-$cell*2
  $g.FillRectangle((B '#E9D9BB'),$inset+$pad,$inset+$pad,$cell,$cell);$g.FillRectangle((B '#B9473B'),$inset+$pad+$cell+$gap,$inset+$pad,$cell,$cell)
  $g.FillRectangle((B '#B9473B'),$inset+$pad,$inset+$pad+$cell+$gap,$cell,$cell);$g.FillRectangle((B '#E9D9BB'),$inset+$pad+$cell+$gap,$inset+$pad+$cell+$gap,$cell,$cell)
  $cx=$inset+$side/2;$cy=$inset+$side/2;$g.DrawLine((P '#1F2A22' ($side*.055)),$cx,$cy-$side*.16,$cx,$cy+$side*.16);$g.DrawLine((P '#1F2A22' ($side*.055)),$cx-$side*.12,$cy,$cx+$side*.12,$cy)
}
$root=Split-Path -Parent $PSScriptRoot;$out=Join-Path $root 'public/icons';New-Item -ItemType Directory -Force $out|Out-Null
@(@{n='icon-192.png';s=192;m=$false},@{n='icon-512.png';s=512;m=$false},@{n='icon-maskable-512.png';s=512;m=$true},@{n='apple-touch-icon.png';s=180;m=$false})|ForEach-Object{
  $format=if($_.n -eq 'apple-touch-icon.png'){[System.Drawing.Imaging.PixelFormat]::Format24bppRgb}else{[System.Drawing.Imaging.PixelFormat]::Format32bppArgb};$im=[System.Drawing.Bitmap]::new([int]$_.s,[int]$_.s,$format);$g=[System.Drawing.Graphics]::FromImage($im);$g.SmoothingMode='AntiAlias';$g.Clear((C '#F5F0E5'));DrawMark $g $_.s $_.m;$im.Save((Join-Path $out $_.n),[System.Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$im.Dispose()
}
