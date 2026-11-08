Add-Type -AssemblyName System.Drawing

function Color([string]$hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Brush([string]$hex) { New-Object System.Drawing.SolidBrush (Color $hex) }
function Pen([string]$hex, [float]$width = 1) { New-Object System.Drawing.Pen ((Color $hex), $width) }
function RoundRect([float]$x,[float]$y,[float]$w,[float]$h,[float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc($x,$y,$r*2,$r*2,180,90); $p.AddArc($x+$w-$r*2,$y,$r*2,$r*2,270,90)
  $p.AddArc($x+$w-$r*2,$y+$h-$r*2,$r*2,$r*2,0,90); $p.AddArc($x,$y+$h-$r*2,$r*2,$r*2,90,90); $p.CloseFigure(); return $p
}
function Text($g,[string]$text,[float]$x,[float]$y,[float]$size,[string]$hex,[bool]$bold=$false) {
  $style = if ($bold) {[System.Drawing.FontStyle]::Bold} else {[System.Drawing.FontStyle]::Regular}
  $font = New-Object System.Drawing.Font('Arial', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($text,$font,(Brush $hex),$x,$y); $font.Dispose()
}
function Token($g,[float]$x,[float]$y,[string]$fill,[string]$outline,[string]$kind) {
  $g.FillEllipse((Brush $fill),$x+8,$y+3,28,28); $g.FillRectangle((Brush $fill),$x+10,$y+27,24,14); $g.FillEllipse((Brush $fill),$x+4,$y+38,36,10)
  $g.DrawEllipse((Pen $outline 2),$x+8,$y+3,28,28); $g.DrawRectangle((Pen $outline 2),$x+10,$y+27,24,14); $g.DrawEllipse((Pen $outline 2),$x+4,$y+38,36,10)
  if ($kind -eq 'K') { $g.DrawLine((Pen $outline 2),$x+22,$y+9,$x+22,$y+23); $g.DrawLine((Pen $outline 2),$x+16,$y+15,$x+28,$y+15) }
  if ($kind -eq 'Q') { $g.FillPolygon((Brush $outline),[System.Drawing.PointF[]]@([System.Drawing.PointF]::new($x+22,$y+9),[System.Drawing.PointF]::new($x+28,$y+16),[System.Drawing.PointF]::new($x+22,$y+23),[System.Drawing.PointF]::new($x+16,$y+16))) }
}
function Device($cfg,[string]$type,[string]$out) {
  $img = New-Object System.Drawing.Bitmap 360,780; $g=[System.Drawing.Graphics]::FromImage($img); $g.SmoothingMode='AntiAlias'; $g.TextRenderingHint='AntiAliasGridFit'; $g.Clear((Color $cfg.bg))
  $g.FillRectangle((Brush $cfg.surface),0,0,360,80); $g.FillEllipse((Brush $cfg.accent),20,22,36,36); $g.DrawRectangle((Pen $cfg.ink 2),31,33,14,14); Text $g 'Juegoteca' 68 27 25 $cfg.ink $true; $g.FillEllipse((Brush $cfg.secondary),314,27,24,24)
  if ($type -eq 'menu') {
    Text $g '¿A qué jugamos?' 20 108 25 $cfg.ink $true; Text $g 'Elige una mesa y empieza.' 20 142 15 $cfg.muted
    $games=@(@('Ajedrez','En marcha','♔'),@('Damas','Próximamente','●'),@('Backgammon','Próximamente','◆'),@('Sudoku','Próximamente','+'))
    for($i=0;$i -lt 4;$i++){ $col=$i%2; $row=[math]::Floor($i/2); $x=20+$col*160; $y=185+$row*188; $path=RoundRect $x $y 145 164 18; $g.FillPath((Brush $cfg.surface),$path); $g.DrawPath((Pen $cfg.boardDark 2),$path); $g.FillEllipse((Brush $(if($i -eq 0){$cfg.accent}else{$cfg.secondary})),$x+20,$y+22,56,56); Text $g $games[$i][2] ($x+35) ($y+27) 34 $cfg.bg $true; Text $g $games[$i][0] ($x+17) ($y+93) 17 $cfg.ink $true; Text $g $games[$i][1] ($x+17) ($y+120) 12 $cfg.muted }
    $p=RoundRect 20 590 320 62 18; $g.FillPath((Brush $cfg.ink),$p); Text $g 'Unirse con código de sala' 64 610 16 $cfg.bg $true; Text $g '→' 299 606 24 $cfg.accent $true
  } else {
    Text $g 'Partida en línea' 20 98 14 $cfg.muted; Text $g 'Daniel  ·  blancas' 20 122 18 $cfg.ink $true; $p=RoundRect 247 107 93 34 15; $g.FillPath((Brush $cfg.accent),$p); Text $g 'SALA  K7MP' 256 117 11 $cfg.bg $true
    $bx=20;$by=175;$s=40
    for($r=0;$r -lt 8;$r++){for($c=0;$c -lt 8;$c++){ $cc=if(($r+$c)%2 -eq 0){$cfg.boardLight}else{$cfg.boardDark};$g.FillRectangle((Brush $cc),$bx+$c*$s,$by+$r*$s,$s,$s)}}
    $g.FillRectangle((Brush $cfg.last),$bx+4*$s,$by+4*$s,$s,$s);$g.FillRectangle((Brush $cfg.last),$bx+4*$s,$by+6*$s,$s,$s); $g.DrawRectangle((Pen $cfg.accent 3),$bx+4*$s+2,$by+4*$s+2,$s-4,$s-4)
    Token $g ($bx+4) ($by+4) $cfg.light $cfg.ink 'R'; Token $g ($bx+84) ($by+4) $cfg.light $cfg.ink 'K'; Token $g ($bx+164) ($by+84) $cfg.light $cfg.ink 'Q'; Token $g ($bx+164) ($by+164) $cfg.light $cfg.ink 'P'; Token $g ($bx+244) ($by+204) $cfg.dark $cfg.light 'K'; Token $g ($bx+124) ($by+244) $cfg.dark $cfg.light 'Q'; Token $g ($bx+284) ($by+284) $cfg.dark $cfg.light 'P'
    $p=RoundRect 20 525 320 72 17;$g.FillPath((Brush $cfg.surface),$p);Text $g 'Tu turno' 38 540 15 $cfg.ink $true;Text $g 'Mueve una pieza' 38 563 13 $cfg.muted;Text $g '01:42' 272 546 18 $cfg.accent $true
    $p=RoundRect 20 619 153 48 15;$g.FillPath((Brush $cfg.ink),$p);Text $g 'Deshacer' 59 634 14 $cfg.bg $true;$p=RoundRect 187 619 153 48 15;$g.FillPath((Brush $cfg.surface),$p);$g.DrawPath((Pen $cfg.ink 1),$p);Text $g 'Rendirse' 228 634 14 $cfg.ink $true
  }
  $img.Save($out,[System.Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$img.Dispose()
}
$root = Split-Path -Parent $PSScriptRoot
$sets=@(
 @{ dir='D1-taller-de-fieltro'; bg='#F5F0E5';surface='#FFFDF6';ink='#1F2A22';muted='#637065';accent='#B9473B';secondary='#2E6B52';boardLight='#E9D9BB';boardDark='#967253';last='#EEC968';light='#FFF8E7';dark='#294536' },
 @{ dir='D2-club-de-medianoche'; bg='#0D1020';surface='#171C33';ink='#F5F7FF';muted='#B6BEDB';accent='#36D5C6';secondary='#F05A9B';boardLight='#333A68';boardDark='#1B2146';last='#F6B84B';light='#F4F7FF';dark='#10182D' },
 @{ dir='D3-papel-en-juego'; bg='#FFF9EE';surface='#F5ECD8';ink='#243B53';muted='#617080';accent='#B84A3D';secondary='#2D6F9D';boardLight='#F2D5A5';boardDark='#B87854';last='#E2B64B';light='#FFF9EE';dark='#294E6C' }
)
foreach($set in $sets){ $folder=Join-Path $PSScriptRoot "direcciones/$($set.dir)"; Device $set 'menu' (Join-Path $folder 'mockup-menu.png'); Device $set 'chess' (Join-Path $folder 'mockup-chess.png') }
