@echo off

# bash script for running the discord bot easily,
# restarting if anything would happen

while true; do
    node app.js;
    # wait until node exits
    current_date="`date "+%Y-%m-%d %H:%M:%S"`";
    echo "Restarted on $current_date" >> app.log;
done