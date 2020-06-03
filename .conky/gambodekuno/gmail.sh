#!/bin/bash

curl -u strohm.luke@gmail.com:fattyboy86 https://mail.google.com/mail/feed/atom/unread | sed 's/<\/entry>/<\/entry>\n/g' | grep "<entry>" |wc -l
