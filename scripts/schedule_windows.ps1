# Windows Task Scheduler setup for OneShot

$vendors = 'sunbelt','unitedrentals','farmington','mikesrentals','fabickrents'
$time    = [datetime]::Today.AddHours(3)  # 03:00 local
$i = 0
foreach ($v in $vendors) {
  $action  = New-ScheduledTaskAction -Execute "powershell.exe" `
               -Argument "-NoLogo -NoProfile -File `%"$env:USERPROFILE\\oneshot\\scripts\\runner-${v}.ps1`""
  $trigger = New-ScheduledTaskTrigger -Daily -At $time.AddMinutes($i*5)
  Register-ScheduledTask -TaskName "playbook_${v}" -Action $action -Trigger $trigger
  $i++
}
# nightly aggregation
$aggAction  = New-ScheduledTaskAction -Execute "powershell.exe" `
               -Argument "-NoLogo -NoProfile -Command `%\"cd $env:USERPROFILE\\oneshot; npm run aggregate:reports\"`" 
Register-ScheduledTask -TaskName "oneshot_aggregate" `
                       -Action $aggAction `
                       -Trigger (New-ScheduledTaskTrigger -Daily -At 05:00)