<#
.SYNOPSIS
  Link be-skill-andy skills into Claude Code, Codex, and Antigravity skill folders (Windows junctions).

.DESCRIPTION
  Creates directory junctions from this repository's `skills/` folder into:
  - Claude Code: %USERPROFILE%\.claude\skills
  - Codex: %USERPROFILE%\.agents\skills
  - Antigravity: %USERPROFILE%\.gemini\config\plugins\be-skill-andy (or %USERPROFILE%\.gemini\config\skills)

.PARAMETER Tools
  claude, codex, antigravity, or all (default: all).

.PARAMETER Uninstall
  Remove only junctions pointing into this repository.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1
  powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Tools claude,antigravity
  powershell -ExecutionPolicy Bypass -File scripts\install-skills.ps1 -Uninstall
#>
param(
  [string[]]$Tools = @("all"),
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SrcSkills = Join-Path $RepoRoot "skills"
$HomeDir = $env:USERPROFILE

$Targets = [ordered]@{
  "claude"      = @("$HomeDir\.claude\skills")
  "codex"       = @("$HomeDir\.agents\skills")
  "antigravity" = @("$HomeDir\.gemini\config\skills")
}

$Selected = if ($Tools -contains "all") { $Targets.Keys } else { $Tools }
$Skills = Get-ChildItem $SrcSkills -Directory | Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") }

foreach ($tool in $Selected) {
  if (-not $Targets.Contains($tool)) {
    Write-Warning "Unknown tool '$tool' (allowed: $($Targets.Keys -join ', '), all)"
    continue
  }

  foreach ($dst in $Targets[$tool]) {
    Write-Host "`n== Setting up $tool -> $dst =="

    if ($Uninstall) {
      if (-not (Test-Path $dst)) {
        Write-Host "  (directory does not exist)"
        continue
      }
      Get-ChildItem $dst | Where-Object { $_.LinkType -eq "Junction" -and "$($_.Target)".StartsWith($SrcSkills) } | ForEach-Object {
        $_.Delete()
        Write-Host "  [Removed Junction]: $($_.Name)"
      }
      continue
    }

    if (-not (Test-Path $dst)) {
      New-Item -ItemType Directory -Force -Path $dst | Out-Null
    }

    foreach ($s in $Skills) {
      $junctionPath = Join-Path $dst $s.Name
      if (Test-Path $junctionPath) {
        $item = Get-Item $junctionPath
        if ($item.LinkType -eq "Junction" -and "$($item.Target)" -eq $s.FullName) {
          Write-Host "  [OK] Already linked: $($s.Name)"
        } else {
          Write-Warning "  [SKIP] Path exists and is not ours: $junctionPath"
        }
      } else {
        New-Item -ItemType Junction -Path $junctionPath -Target $s.FullName | Out-Null
        Write-Host "  [Linked]: $($s.Name) -> $($s.FullName)"
      }
    }
  }
}

# Register as Antigravity Plugin if Antigravity is selected
if ($Selected -contains "antigravity" -or $Selected -contains "all") {
  $geminiConfigDir = Join-Path $HomeDir ".gemini\config"
  $geminiSkillsJson = Join-Path $geminiConfigDir "skills.json"
  $pluginDst = Join-Path $geminiConfigDir "plugins\be-skill-andy"
  Write-Host "`n== Registering Antigravity Plugin -> $pluginDst =="
  
  if ($Uninstall) {
    if (Test-Path $pluginDst) {
      $pSkills = Join-Path $pluginDst "skills"
      if (Test-Path $pSkills) {
        $pItem = Get-Item $pSkills
        if ($pItem.LinkType -eq "Junction") { $pItem.Delete() }
      }
      Remove-Item -Path $pluginDst -Recurse -Force -ErrorAction SilentlyContinue
      Write-Host "  [Removed Plugin Directory]: be-skill-andy"
    }
  } else {
    # If pluginDst is an old junction to repo root, remove the junction first
    if (Test-Path $pluginDst) {
      $item = Get-Item $pluginDst
      if ($item.LinkType -eq "Junction") {
        cmd /c rmdir "$pluginDst"
        Write-Host "  [Cleaned old plugin junction]"
      }
    }
    
    if (-not (Test-Path $pluginDst)) {
      New-Item -ItemType Directory -Force -Path $pluginDst | Out-Null
    }

    # Copy plugin.json, README.md, rules
    $pluginJsonSrc = if (Test-Path (Join-Path $RepoRoot "plugin.json")) { Join-Path $RepoRoot "plugin.json" } else { Join-Path $RepoRoot ".antigravity-plugin\plugin.json" }
    $readmeSrc = Join-Path $RepoRoot "README.md"
    $rulesSrc = Join-Path $RepoRoot "rules"

    if (Test-Path $pluginJsonSrc) {
      Copy-Item -Path $pluginJsonSrc -Destination (Join-Path $pluginDst "plugin.json") -Force
      Write-Host "  [Configured plugin.json]: $pluginDst\plugin.json"
    }
    if (Test-Path $readmeSrc) {
      Copy-Item -Path $readmeSrc -Destination (Join-Path $pluginDst "README.md") -Force
    }
    if (Test-Path $rulesSrc) {
      $dstRules = Join-Path $pluginDst "rules"
      if (-not (Test-Path $dstRules)) { New-Item -ItemType Directory -Force -Path $dstRules | Out-Null }
      Copy-Item -Path (Join-Path $rulesSrc "*") -Destination $dstRules -Force -Recurse
      Write-Host "  [Copied rules]: $dstRules"
    }

    # Link skills as directory junction inside the plugin folder
    $pluginSkillsJunction = Join-Path $pluginDst "skills"
    if (Test-Path $pluginSkillsJunction) {
      $pItem = Get-Item $pluginSkillsJunction
      if ($pItem.LinkType -eq "Junction") {
        cmd /c rmdir "$pluginSkillsJunction"
      } else {
        Remove-Item -Recurse -Force $pluginSkillsJunction
      }
    }
    New-Item -ItemType Junction -Path $pluginSkillsJunction -Target $SrcSkills | Out-Null
    Write-Host "  [Linked plugin skills junction]: $pluginSkillsJunction -> $SrcSkills"
  }

  # Update skills.json entries if present
  if (Test-Path $geminiSkillsJson) {
    try {
      $json = Get-Content $geminiSkillsJson -Raw | ConvertFrom-Json
      if ($json.entries) {
        $normalizedSrc = $SrcSkills.Replace("\", "/")
        $existing = $json.entries | Where-Object { "$($_.path)".Replace("\", "/").ToLower() -eq $normalizedSrc.ToLower() }
        if (-not $existing -and -not $Uninstall) {
          $json.entries += [PSCustomObject]@{ path = $normalizedSrc }
          $json | ConvertTo-Json -Depth 5 | Set-Content -Path $geminiSkillsJson -Encoding UTF8
          Write-Host "  [Updated skills.json]: Added $normalizedSrc"
        } elseif ($existing -and $Uninstall) {
          $json.entries = @($json.entries | Where-Object { "$($_.path)".Replace("\", "/").ToLower() -ne $normalizedSrc.ToLower() })
          $json | ConvertTo-Json -Depth 5 | Set-Content -Path $geminiSkillsJson -Encoding UTF8
          Write-Host "  [Updated skills.json]: Removed $normalizedSrc"
        }
      }
    } catch {
      Write-Warning "Could not update Antigravity skills.json: $_"
    }
  }
}

Write-Host "`n✅ Installation / Update script completed."
