#!/bin/bash
# Cron schedule for OneShot on Linux/WSL

# ┌ min ┐ ┌ hour ┐ ┌ dom ┐ ┌ mon ┐ ┌ dow ┐
0  3  * * *  cd ~/oneshot && npm run runner:sunbelt     >> cron.log 2>&1
5  3  * * *  cd ~/oneshot && npm run runner:united      >> cron.log 2>&1
10 3  * * *  cd ~/oneshot && npm run runner:farmington  >> cron.log 2>&1
60 4  * * *  cd ~/oneshot && npm run aggregate:reports  >> cron.log 2>&1

# To install this crontab, run `crontab -e` and paste the above lines.